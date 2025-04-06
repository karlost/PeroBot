# Three.js 3MF Exporter

Export 3D models to 3MF format in Three.js

<!-- Some beautiful tags -->
<p align="left">
  <a href="https://www.npmjs.com/package/three-3mf-exporter">
    <img alt="npm" src="https://badgen.net/npm/v/three-3mf-exporter">
  </a>
  <a href="#usage">
    <img alt="docs" src="https://img.shields.io/badge/-docs%20%26%20demos-1e8a7a">
  </a>
  <a href="https://github.com/sponsors/LittleSound">
    <img alt="sponsors" src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86">
  </a>
</p>

## Features

- Export Three.js models to 3MF format
- BambuStudio compatible
- Support for multiple materials and colors
- Automatic model centering on print bed
- Customizable print settings
- Preserves model names and hierarchy

## Usage

### Basic usage

```typescript
import { exportTo3MF } from 'three-3mf-exporter'

// Parse the three.js object and generate the 3MF encoded output
const blob = await exportTo3MF(mesh)

// Download the file
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
```

### With custom print settings (BambuStudio compatible)

```typescript
const blob = await exportTo3MF(meshOrGroup, {
  printer_name: 'Bambu Lab A1',
  filament: 'Bambu PLA Basic @BBL A1',
  printableWidth: 256,
  printableDepth: 256,
  printableHeight: 256,
  printerSettingsId: 'Bambu Lab A1 0.4 nozzle',
  printSettingsId: '0.20mm Standard @BBL A1',
})

// Download the file
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
```

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/LittleSound">
    <img src="https://cdn.jsdelivr.net/gh/littlesound/sponsors/sponsors.svg"/>
  </a>
</p>

<p align="center">
  This project is made possible by all the sponsors supporting my work <br>
  You can join them at my sponsors profile:
</p>
<p align="center"><a href="https://github.com/sponsors/LittleSound"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86&style=for-the-badge" /></a></p>
