const process = require('node:process') // Import process
const ImageTracer = require('imagetracerjs') // Import imagetracerjs
// Serverless function for Vercel to generate SVG from text prompt
// Uses imagetracerjs for PNG to SVG conversion
const fetch = require('node-fetch')

// Function to call Gemini API
async function callGeminiAPI(prompt, apiKey) {
  // Použít API klíč z parametru nebo z proměnné prostředí
  const key = apiKey || process.env.GEMINI_API_KEY

  if (!key) {
    throw new Error('Gemini API key is required but not provided')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${key}`

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
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
      responseModalities: ['Text', 'Image'],
    },
  }

  try {
    // console.log('Calling Gemini API with URL:', url); // Removed console.log
    // console.log('Request body:', JSON.stringify(requestBody)); // Removed console.log

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // console.log('Gemini API response status:', response.status); // Removed console.log

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    // Extract base64 image data from response
    if (data.candidates
      && data.candidates[0]
      && data.candidates[0].content
      && data.candidates[0].content.parts
      && data.candidates[0].content.parts[0]
      && data.candidates[0].content.parts[0].inlineData
      && data.candidates[0].content.parts[0].inlineData.data) {
      return data.candidates[0].content.parts[0].inlineData.data
    }
    else {
      throw new Error('No image data found in Gemini API response')
    }
  }
  catch (error) {
    console.error('Error calling Gemini API:', error)
    throw error
  }
}

// Vercel API handler
export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  )

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // console.log('Request received:', req.method, req.url); // Removed console.log

    // Parse request body
    const { prompt, apiKey } = req.body
    // console.log('Prompt received:', prompt ? 'Yes' : 'No'); // Removed console.log
    // console.log('API Key received:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No'); // Removed console.log

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Call Gemini API to generate image
    const base64ImageData = await callGeminiAPI(prompt, apiKey)

    // Convert PNG to vector SVG using imagetracerjs
    const imageDataUri = `data:image/png;base64,${base64ImageData}`
    const options = {
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      rightangleenhance: true,
      viewbox: true,
      desc: false,
    }

    let svgContent
    try {
      // imagetracerjs expects a callback, wrap in a Promise for async/await
      svgContent = await new Promise((resolve, reject) => {
        ImageTracer.imageToSVG(
          imageDataUri,
          (svgString) => {
            if (svgString) {
              resolve(svgString)
            }
            else {
              reject(new Error('ImageTracer returned empty SVG string'))
            }
          },
          options,
        )
        // Add a timeout mechanism in case imagetracerjs hangs
        setTimeout(() => {
          reject(new Error('ImageTracer conversion timed out'))
        }, 9000) // Slightly less than Vercel's 10s limit
      })
    }
    catch (tracerError) {
      console.error('Error converting PNG to SVG using imagetracerjs in serverless function:', tracerError)
      // Return a fallback or error indicator if conversion fails
      return res.status(500).json({ error: 'SVG conversion failed', details: tracerError.message })
    }

    // Return only the generated SVG content
    return res.status(200).json({
      svgContent, // Already trimmed by imagetracerjs usually
    })
  }
  catch (error) {
    console.error('Error in serverless function:', error)
    return res.status(500).json({ error: error.message })
  }
}
