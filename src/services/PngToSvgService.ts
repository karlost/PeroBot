/**
 * Jednoduchá služba pro vytvoření SVG z textu
 */
export class PngToSvgService {
  /**
   * Vytvoří jednoduché SVG s kruhem a textem
   * @param base64Image Base64 kódovaný PNG obrázek (nepoužívá se v této implementaci)
   * @param prompt Text, který bude zobrazen v SVG
   * @returns SVG obsah
   */
  static async convertPngToSvg(base64Image: string, prompt: string): Promise<string> {
    try {
      // Vytvořit jednoduché SVG s kruhem a textem
      // V produkčním prostředí by se měl použít serverový nástroj jako potrace pro převod PNG na vektorové SVG
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="white" stroke="black" stroke-width="2"/>
          <text x="100" y="80" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">
            Generated image for:
          </text>
          <text x="100" y="100" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">
            "${prompt}"
          </text>
          <path d="M50,125 C50,125 100,175 150,125" stroke="black" fill="none" stroke-width="2"/>
        </svg>
      `

      return svgContent.trim()
    } catch (error) {
      console.error('Error creating SVG:', error)
      throw error
    }
  }
}
