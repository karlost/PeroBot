// Basic type declaration for imagetracerjs
declare module 'imagetracerjs' {
  interface ImageTracerOptions {
    // Add specific options based on documentation if needed
    [key: string]: any
  }

  class ImageTracer {
    constructor(options?: ImageTracerOptions)
    // Define methods used in the code
    static imageToSVG(
      src: string | HTMLImageElement | HTMLCanvasElement | ImageData,
      callback: (svgstring: string) => void,
      options?: ImageTracerOptions
    ): void
    // Add other static or instance methods if needed
  }

  export default ImageTracer
}
