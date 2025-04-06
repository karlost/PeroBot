# PeroBot - AI generátor nástěnných obrazů

PeroBot je webová aplikace, která využívá umělou inteligenci k vytváření uměleckých obrazů, které můžete vytisknout jako nástěnné dekorace. Aplikace kombinuje sílu Gemini API pro generování obrázků s pokročilými nástroji pro 3D modelování a export.

## Funkce

- **Generování obrazů pomocí AI** - Zadejte textový popis a PeroBot vytvoří unikátní umělecké dílo
- **Vektorizace** - Automatická konverze rastrových obrázků na vektorové SVG
- **3D modelování** - Převod SVG na 3D modely s nastavitelnou hloubkou a pozicí
- **Export v různých formátech** - STL, OBJ, GLTF a 3MF pro 3D tisk nebo další zpracování
- **Vlastní API klíč** - Možnost použít vlastní Gemini API klíč

## Začínáme

### Předpoklady

- Node.js (verze 18 nebo novější)
- pnpm (verze 8 nebo novější)
- Gemini API klíč (získáte na [Google AI Studio](https://ai.google.dev/))

### Instalace

1. Naklonujte repozitář

   ```bash
   git clone https://github.com/yourusername/perobot.git
   cd perobot
   ```

2. Nainstalujte závislosti

   ```bash
   pnpm install
   ```

3. Spusťte vývojový server

   ```bash
   pnpm dev
   ```

4. Otevřete prohlížeč na adrese `http://localhost:3333`

### Lokální server pro vektorizaci

Pro převod PNG na SVG je potřeba spustit lokální server:

```bash
cd netlify/functions
node server.js
```

Server bude dostupný na portu 3000.

## Použití

1. **Generování obrazu**
   - Zadejte svůj Gemini API klíč do příslušného pole
   - Napište textový popis požadovaného obrazu
   - Klikněte na tlačítko "Generate"

2. **Úprava 3D modelu**
   - Upravte hloubku a pozici jednotlivých částí modelu
   - Změňte barvy podle potřeby
   - Otáčejte a přibližujte model pomocí myši

3. **Export**
   - Vyberte požadovaný formát (STL, OBJ, GLTF, 3MF)
   - Stáhněte soubor pro 3D tisk nebo další zpracování

## Technologie

- **Frontend**: Vue.js 3, TresJS (Three.js pro Vue), UnoCSS
- **3D modelování**: Three.js
- **Vektorizace**: Potrace
- **AI generování**: Gemini API
- **Serverless funkce**: Netlify Functions

## Sub-packages

- [three-3mf-exporter](./packages/three-3mf-exporter) - Export 3D modelů do formátu 3MF v Three.js

## Screenshot

![PeroBot Screenshot](https://github.com/user-attachments/assets/05d55a11-ce45-402a-9221-95d191f5223b)

## Logo

<img src="public/logo-perobot-light.svg" alt="PeroBot Logo" width="200">

## Licence

Tento projekt je licencován pod MIT licencí.

## Poděkování

PeroBot je založen na projektu [Bekuto3D](https://github.com/LittleSound/bekuto3d) od [LittleSound](https://github.com/LittleSound).
