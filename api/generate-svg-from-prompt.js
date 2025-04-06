// Serverless function for Vercel to generate SVG from text prompt
const fetch = require('node-fetch');

// Function to call Gemini API
async function callGeminiAPI(prompt, apiKey) {
  // Použít API klíč z parametru nebo z proměnné prostředí
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('Gemini API key is required but not provided');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${key}`;

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
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
      responseModalities: ["Text", "Image"]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Extract base64 image data from response
    if (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].inlineData &&
        data.candidates[0].content.parts[0].inlineData.data) {
      return data.candidates[0].content.parts[0].inlineData.data;
    } else {
      throw new Error('No image data found in Gemini API response');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Vercel API handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse request body
    const { prompt, apiKey } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Gemini API to generate image
    const base64ImageData = await callGeminiAPI(prompt, apiKey);

    // Vytvořit jednoduché SVG s kruhem a textem
    // V produkčním prostředí by se měl použít potrace pro převod PNG na vektorové SVG
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="white" stroke="black" stroke-width="2"/>
        <text x="100" y="70" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
          PeroBot
        </text>
        <text x="100" y="90" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">
          Generated image for:
        </text>
        <text x="100" y="110" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">
          "${prompt}"
        </text>
        <path d="M50,135 C50,135 100,175 150,135" stroke="black" fill="none" stroke-width="2"/>
      </svg>
    `;

    return res.status(200).json({
      svgContent: svgContent.trim(),
      imageData: base64ImageData
    });
  } catch (error) {
    console.error('Error in serverless function:', error);
    return res.status(500).json({ error: error.message });
  }
};
