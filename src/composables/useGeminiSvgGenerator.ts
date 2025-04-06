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
      // Pro testovací účely voláme Gemini API přímo z frontendu
      // POZNÁMKA: Toto není bezpečné pro produkční prostředí, protože API klíč je vystaven
      // V produkci by toto měla dělat serverless funkce

      console.log('Calling Gemini API directly for testing purposes')

      // Použít API klíč zadaný uživatelem
      if (!apiKey.value) {
        throw new Error('Gemini API key is required')
      }

      // Použijeme model pro generování obrázků
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      console.log('Gemini API response:', data)

      // Extrahovat base64 data obrázku z odpovědi
      if (data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].inlineData &&
          data.candidates[0].content.parts[0].inlineData.data) {

        // Získat base64 data obrázku
        const imageData = data.candidates[0].content.parts[0].inlineData.data
        console.log('Image data found, length:', imageData.length)

        // Uložit base64 data obrázku pro zobrazení
        generatedImageBase64.value = `data:image/png;base64,${imageData}`

        // Použití lokálního serveru s potrace pro převod PNG na SVG
        console.log('Converting PNG to SVG using local server with potrace')

        try {
          // Volat lokální server pro převod PNG na SVG
          const response = await fetch('http://localhost:3000/api/convert-to-svg', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData: `data:image/png;base64,${imageData}`,
              options: {
                turdSize: 2,          // Odstraní malé ostrůvky
                alphaMax: 1,          // Maximální úhel pro křivky
                optCurve: true,        // Optimalizace křivek
                optTolerance: 0.2,     // Tolerance pro optimalizaci
                threshold: 128,        // Práh pro černobílou konverzi
                blackOnWhite: true,    // Černá na bílém pozadí
                color: '#000000',      // Barva čar
                background: '#FFFFFF'  // Barva pozadí
              }
            }),
          })

          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`)
          }

          const data = await response.json()
          console.log('SVG received from server', data.diagnostics)

          // Zkontrolovat, zda SVG obsahuje cesty
          if (data.diagnostics && data.diagnostics.pathCount === 0 && data.diagnostics.polygonCount === 0) {
            console.warn('SVG does not contain any paths or polygons!')
          }

          // Použít SVG z odpovědi serveru
          const svgContent = data.svg

          return svgContent
        } catch (error) {
          console.error('Error converting PNG to SVG using server:', error)

          // Fallback - vytvořit jednoduché SVG s kruhem a textem
          console.log('Using fallback SVG')
          const fallbackSvg = `
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
          `

          return fallbackSvg.trim()
        }

        // Tento řádek je nadbytečný, protože máme return v try/catch bloku
      } else {
        // Pokud není obrázek, vytvoříme jednoduché SVG s textem chyby
        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">
            <rect width="500" height="300" fill="white" stroke="black" stroke-width="2"/>
            <text x="250" y="120" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
              PeroBot
            </text>
            <text x="250" y="150" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle">
              ${prompt} (API did not return an image)
            </text>
          </svg>
        `
        console.error('No image data found in Gemini API response:', data)
        return svgContent.trim()
      }

      /* PRODUCTION CODE - Using serverless function - Uncomment when deploying to Netlify
      console.log('Calling serverless function to generate SVG')

      // Použít API klíč zadaný uživatelem
      if (!apiKey.value) {
        throw new Error('Gemini API key is required')
      }

      // Call our serverless function
      const response = await fetch('/.netlify/functions/generate-svg-from-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          apiKey: apiKey.value // Předáme API klíč serverless funkci
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('Server response:', data)

      if (data.svgContent) {
        console.log('SVG content received from server')
        return data.svgContent
      } else if (data.imageData) {
        console.log('Image data received from server, creating SVG wrapper')
        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
            <image width="512" height="512" xlink:href="data:image/png;base64,${data.imageData}" />
          </svg>
        `
        return svgContent.trim()
      } else {
        throw new Error('No image or SVG data received from the server')
      }
      */
    } catch (error) {
      console.error('Error generating SVG:', error)
      generationError.value = error instanceof Error ? error.message : 'Unknown error'
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generateSvgFromPrompt,
    isGenerating,
    generationError,
    apiKey,
    generatedImageBase64,
  }
}
