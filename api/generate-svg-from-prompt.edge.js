// Edge Function for Vercel to generate SVG from text prompt

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

  console.log('Calling Gemini API with URL:', url);
  console.log('Request body:', JSON.stringify(requestBody));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Gemini API response status:', response.status);

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
}

// Vercel Edge Function handler
export default async function handler(req) {
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      }
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    console.log('Request received:', req.method, req.url);
    
    // Parse request body
    const body = await req.json();
    const { prompt, apiKey } = body;
    
    console.log('Prompt received:', prompt ? 'Yes' : 'No');
    console.log('API Key received:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Call Gemini API to generate image
    const base64ImageData = await callGeminiAPI(prompt, apiKey);

    // Vytvořit jednoduché SVG s kruhem a textem
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

    return new Response(JSON.stringify({
      svgContent: svgContent.trim(),
      imageData: base64ImageData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
