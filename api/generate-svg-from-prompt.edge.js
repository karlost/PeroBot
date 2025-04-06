// Edge Function for Vercel to generate SVG from text prompt

// Simplified function to create a fallback SVG
function createFallbackSvg(prompt) {
  return `
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
  `.trim();
}

// Vercel Edge Function handler
export default async function handler(req) {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: corsHeaders
    });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400, headers: corsHeaders
      });
    }

    // Instead of calling Gemini API, just return a fallback SVG
    // This avoids the timeout issue while we debug
    const svgContent = createFallbackSvg(prompt);

    return new Response(JSON.stringify({
      svgContent: svgContent,
      // No image data for now to avoid timeout
      imageData: null
    }), {
      status: 200, headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: corsHeaders
    });
  }
}
