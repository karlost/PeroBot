import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import potrace from 'potrace';
// Zjednodušená implementace bez Jimp
// import * as Jimp from 'jimp';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify potrace.trace
const potraceAsync = promisify(potrace.trace);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../../dist')));

// Endpoint pro převod base64 obrázku na SVG
app.post('/api/convert-to-svg', async (req, res) => {
  try {
    const { imageData, options } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Odstranit prefix 'data:image/png;base64,' pokud existuje
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    // Vytvořit buffer z base64 dat
    const buffer = Buffer.from(base64Data, 'base64');

    // Zjednodušená implementace bez Jimp
    // Použijeme přímo buffer z base64 dat
    const processedBuffer = buffer;

    // Uložit původní obrázek pro diagnostiku
    const originalImagePath = path.join(__dirname, 'original.png');
    fs.writeFileSync(originalImagePath, buffer);
    console.log('Original image saved to:', originalImagePath);

    // Nastavení potrace - optimalizováno pro zachování detailů
    const potraceOptions = {
      turdSize: options?.turdSize || 1,        // Snížená hodnota pro zachování malých detailů
      turnPolicy: options?.turnPolicy || potrace.Potrace.TURNPOLICY_MINORITY,
      alphaMax: options?.alphaMax || 0.5,      // Snížená hodnota pro lepší zachování ostrých rohů
      optCurve: options?.optCurve !== undefined ? options?.optCurve : true,
      optTolerance: options?.optTolerance || 0.1, // Vyšší přesnost pro křivky
      threshold: options?.threshold || 140,     // Upravený práh pro lepší rozlišení černé a bílé
      blackOnWhite: options?.blackOnWhite !== undefined ? options?.blackOnWhite : true,
      color: options?.color || '#000000',
      background: options?.background || '#FFFFFF'
    };

    console.log('Potrace options:', potraceOptions);

    // Použít potrace pro převod na SVG
    const svg = await potraceAsync(processedBuffer, potraceOptions);

    // Uložit SVG pro diagnostiku
    const svgPath = path.join(__dirname, 'output.svg');
    fs.writeFileSync(svgPath, svg, 'utf8');
    console.log('SVG saved to:', svgPath);

    // Analyzovat SVG pro diagnostiku
    const pathCount = (svg.match(/<path/g) || []).length;
    const polygonCount = (svg.match(/<polygon/g) || []).length;
    console.log('SVG analysis:', {
      size: svg.length,
      pathCount,
      polygonCount,
      hasPaths: pathCount > 0,
      hasPolygons: polygonCount > 0
    });

    // Vrátit SVG
    res.json({
      svg,
      diagnostics: {
        pathCount,
        polygonCount,
        size: svg.length
      }
    });
  } catch (error) {
    console.error('Error converting image to SVG:', error);
    res.status(500).json({ error: 'Failed to convert image to SVG' });
  }
});

// Spustit server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
