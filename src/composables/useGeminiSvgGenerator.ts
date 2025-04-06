import { ref } from 'vue'

export function useGeminiSvgGenerator() {
  const isGenerating = ref(false)
  const generationError = ref<string | null>(null)
  const apiKey = ref<string>('')
  const generatedImageBase64 = ref<string>('')

  /**
   * Generate SVG from a text prompt using the Gemini API
   * @param prompt The text prompt to generate an image from
   * @returns The SVG content as a string
   */
  async function generateSvgFromPrompt(prompt: string): Promise<string> {
    isGenerating.value = true
    generationError.value = null

    try {
      // Použít API klíč zadaný uživatelem
      if (!apiKey.value) {
        throw new Error('Gemini API key is required')
      }

      // Determine if we're in development or production
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      let svgContent = ''
      let imageBase64 = ''

      if (isDevelopment && false) { // Set to false to always use serverless function
        // DEVELOPMENT MODE - Call Gemini API directly (for testing only)
        console.log('DEV MODE: Calling Gemini API directly for testing purposes')

        // Direct API call implementation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey.value}`

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `Create a minimalist black and white lineart illustration of ${prompt}, contained within a perfect circle with thick border. Use clean continuous lines suitable for 3D printing as wall art with bold outlines, negative space, and the same graphic style as the reference image - high contrast, simplified shapes, and subtle background elements to create depth. The ${prompt} should be the main focus in the center of the circular composition.`
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["Text", "Image"]
          }
        }

        const apiResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text()
          throw new Error(`Gemini API error: ${apiResponse.status} ${errorText}`)
        }

        const apiData = await apiResponse.json()

        // Extract image data
        if (apiData.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
          imageBase64 = apiData.candidates[0].content.parts[0].inlineData.data
          generatedImageBase64.value = `data:image/png;base64,${imageBase64}`

          // Try to convert using local potrace server
          try {
            const potraceResponse = await fetch('http://localhost:3000/api/convert-to-svg', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: `data:image/png;base64,${imageBase64}`,
                options: {
                  turdSize: 2,
                  alphaMax: 1,
                  optCurve: true,
                  optTolerance: 0.2,
                  threshold: 128,
                  blackOnWhite: true,
                  color: '#000000',
                  background: '#FFFFFF'
                }
              }),
            })

            if (potraceResponse.ok) {
              const potraceData = await potraceResponse.json()
              svgContent = potraceData.svg
            } else {
              throw new Error(`Potrace server error: ${potraceResponse.status}`)
            }
          } catch (error) {
            console.error('Error converting PNG to SVG using local server:', error)
            // Use fallback SVG
            svgContent = createFallbackSvg(prompt)
          }
        } else {
          console.error('No image data found in Gemini API response')
          svgContent = createErrorSvg(prompt, 'API did not return an image')
        }
      } else {
        // PRODUCTION MODE - Use serverless function
        console.log('PROD MODE: Using serverless function to generate SVG')

        // Determine which serverless function endpoint to use based on deployment platform
        const apiEndpoint = window.location.hostname.includes('netlify')
          ? '/.netlify/functions/generate-svg-from-prompt'
          : '/api/generate-svg-from-prompt';

        console.log('Using API endpoint:', apiEndpoint);

        let serverData;
        try {
          console.log('Calling API endpoint with timeout:', apiEndpoint);

          // Use AbortController to set a timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const serverResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              apiKey: apiKey.value
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId);

          if (!serverResponse.ok) {
            const errorText = await serverResponse.text()
            console.error(`Server error: ${serverResponse.status} ${errorText}`);
            // Don't throw, use fallback instead
            return createFallbackSvg(prompt);
          }

          serverData = await serverResponse.json();
          console.log('Server response:', serverData);
        } catch (error) {
          console.error('Error calling API endpoint:', error);
          // Use fallback SVG on error
          return createFallbackSvg(prompt);
        }

        if (serverData.svgContent) {
          console.log('SVG content received from server')
          svgContent = serverData.svgContent
        } else if (serverData.imageData) {
          console.log('Image data received from server, creating SVG wrapper')
          imageBase64 = serverData.imageData
          generatedImageBase64.value = `data:image/png;base64,${imageBase64}`

          // Create SVG wrapper for the image
          svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
              <image width="512" height="512" xlink:href="data:image/png;base64,${imageBase64}" />
            </svg>
          `.trim()
        } else {
          throw new Error('No image or SVG data received from the server')
        }
      }

      return svgContent
    } catch (error) {
      console.error('Error generating SVG:', error)
      generationError.value = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  // Helper function to create a fallback SVG
  function createFallbackSvg(prompt: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="white" stroke="black" stroke-width="2"/>
        <text x="100" y="70" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="black">
          PeroBot
        </text>
        <text x="100" y="100" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="black">
          ${prompt}
        </text>
        <path d="M50,135 C50,135 100,175 150,135" stroke="black" fill="none" stroke-width="2"/>
      </svg>
    `.trim()
  }

  // Helper function to create an error SVG
  function createErrorSvg(prompt: string, errorMessage: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">
        <rect width="500" height="300" fill="white" stroke="black" stroke-width="2"/>
        <text x="250" y="120" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
          PeroBot
        </text>
        <text x="250" y="150" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle">
          ${prompt} (${errorMessage})
        </text>
      </svg>
    `.trim()
  }

  return {
    generateSvgFromPrompt,
    isGenerating,
    generationError,
    apiKey,
    generatedImageBase64,
  }
}
