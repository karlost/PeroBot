import ImageTracer from 'imagetracerjs' // Import ImageTracer
import { ref } from 'vue'

// Removed unused helper function base64ToImageData

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
        // console.log('DEV MODE: Calling Gemini API directly for testing purposes') // Removed console.log

        // Direct API call implementation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey.value}`

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `Create a minimalist black and white lineart illustration of ${prompt}, contained within a perfect circle with thick border. Use clean continuous lines suitable for 3D printing as wall art with bold outlines, negative space, and the same graphic style as the reference image - high contrast, simplified shapes, and subtle background elements to create depth. The ${prompt} should be the main focus in the center of the circular composition.`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['Text', 'Image'],
          },
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
                  background: '#FFFFFF',
                },
              }),
            })

            if (potraceResponse.ok) {
              const potraceData = await potraceResponse.json()
              svgContent = potraceData.svg
            }
            else {
              throw new Error(`Potrace server error: ${potraceResponse.status}`)
            }
          }
          catch (error) {
            console.error('Error converting PNG to SVG using local server:', error)
            // Use fallback SVG
            svgContent = createFallbackSvg(prompt)
          }
        }
        else {
          console.error('No image data found in Gemini API response') // Keep console.error
          svgContent = createErrorSvg(prompt, 'API did not return an image')
        }
      }
      else {
        // PRODUCTION MODE - Use serverless function
        // console.log('PROD MODE: Using serverless function to generate SVG') // Keep removed console.log

        // Determine which serverless function endpoint to use based on deployment platform
        const apiEndpoint = window.location.hostname.includes('netlify')
          ? '/.netlify/functions/generate-svg-from-prompt'
          : '/api/generate-svg-from-prompt'

        // console.log('Using API endpoint:', apiEndpoint); // Keep removed console.log

        let serverData
        try {
          // console.log('Calling API endpoint with timeout:', apiEndpoint); // Keep removed console.log

          // Use AbortController to set a timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          const serverResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              apiKey: apiKey.value,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!serverResponse.ok) {
            const errorText = await serverResponse.text()
            console.error(`Server error: ${serverResponse.status} ${errorText}`) // Keep console.error
            // Don't throw, use fallback instead
            return createFallbackSvg(prompt)
          }

          serverData = await serverResponse.json()
          // console.log('Server response:', serverData); // Keep removed console.log
        }
        catch (error) {
          console.error('Error calling API endpoint:', error) // Keep console.error
          // Use fallback SVG on error
          return createFallbackSvg(prompt)
        }

        if (serverData.svgContent) {
          // console.log('SVG content received from server') // Keep removed console.log
          svgContent = serverData.svgContent
        }
        else if (serverData.imageData) {
          // console.log('Image data received from server, creating SVG wrapper') // Keep removed console.log
          imageBase64 = serverData.imageData
          generatedImageBase64.value = `data:image/png;base64,${imageBase64}`

          // Convert PNG to vector SVG using imagetracerjs
          try {
            const imageDataUri = `data:image/png;base64,${imageBase64}`
            // No need to convert to ImageData, imagetracerjs accepts data URI

            // Define options for imagetracerjs (adjust as needed)
            // Refer to imagetracerjs documentation for details
            const options = {
              ltres: 1, // Error threshold for straight lines
              qtres: 1, // Error threshold for quadratic splines
              pathomit: 8, // Path simplification threshold
              rightangleenhance: true, // Enhance right angles
              // Colors for color quantization (if needed, default is black/white)
              // colorsampling: 1,
              // numberofcolors: 2,
              // mincolorratio: 0.02,
              // colorquantcycles: 3,
              // Layering options (if needed)
              // layerseparator: '_',
              // scale: 1,
              // roundcoords: 1,
              viewbox: true, // Add viewBox attribute
              desc: false, // Add description element
              // Blur options (if needed)
              // blurradius: 0,
              // blurdelta: 20
            }

            // console.log('Starting imagetracerjs conversion...'); // Keep removed console.log
            // Perform the conversion
            svgContent = await new Promise<string>((resolve) => {
              // Use imageToSVG to directly get the SVG string
              // Note: imagetracerjs might not be strictly Promise-based, using callback
              ImageTracer.imageToSVG(
                imageDataUri, // Pass the data URI directly
                (svgString: string) => {
                  // console.log('imagetracerjs conversion successful.'); // Keep removed console.log
                  resolve(svgString)
                },
                options,
              )
            })
          }
          catch (tracerError) {
            console.error('Error converting PNG to SVG using imagetracerjs:', tracerError) // Keep console.error
            generationError.value = tracerError instanceof Error ? tracerError.message : 'ImageTracer conversion failed'
            // Use fallback SVG on conversion error
            svgContent = createFallbackSvg(prompt)
          }
        }
        else {
          console.error('No image or SVG data received from the server') // Keep console.error
          svgContent = createErrorSvg(prompt, 'No image or SVG data received')
        }
      }

      return svgContent
    }
    catch (error) {
      console.error('Error generating SVG:', error) // Keep console.error
      generationError.value = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
    finally {
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
