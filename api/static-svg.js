// Static function that always returns the same SVG
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Create a static SVG
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="90" fill="white" stroke="black" stroke-width="2"/>
      <text x="100" y="70" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
        PeroBot
      </text>
      <text x="100" y="100" font-family="Arial" font-size="12" text-anchor="middle" dominant-baseline="middle">
        Static SVG Example
      </text>
      <path d="M50,135 C50,135 100,175 150,135" stroke="black" fill="none" stroke-width="2"/>
    </svg>
  `;

  // Return the SVG
  res.status(200).json({
    svgContent: svgContent.trim(),
    imageData: null
  });
}
