const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const potrace = require('potrace');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify potrace.trace
const potraceAsync = promisify(potrace.trace);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

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
    
    // Načíst obrázek pomocí Jimp
    const image = await Jimp.read(buffer);
    
    // Upravit obrázek pro lepší výsledky
    image.greyscale().contrast(0.8);
    
    // Převést na buffer pro potrace
    const processedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    
    // Nastavení potrace
    const potraceOptions = {
      turdSize: options?.turdSize || 2,
      turnPolicy: options?.turnPolicy || potrace.Potrace.TURNPOLICY_MINORITY,
      alphaMax: options?.alphaMax || 1,
      optCurve: options?.optCurve !== undefined ? options?.optCurve : true,
      optTolerance: options?.optTolerance || 0.2,
      threshold: options?.threshold || 128,
      blackOnWhite: options?.blackOnWhite !== undefined ? options?.blackOnWhite : true,
      color: options?.color || '#000000',
      background: options?.background || '#FFFFFF'
    };
    
    // Použít potrace pro převod na SVG
    const svg = await potraceAsync(processedBuffer, potraceOptions);
    
    // Vrátit SVG
    res.json({ svg });
  } catch (error) {
    console.error('Error converting image to SVG:', error);
    res.status(500).json({ error: 'Failed to convert image to SVG' });
  }
});

// Spustit server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
