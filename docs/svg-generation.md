# SVG Generation with AI in bekuto3d

This document explains how the AI-powered SVG generation feature works in bekuto3d.

## Overview

The SVG generation feature allows users to create SVG files from text prompts using Google's Gemini AI. These SVGs can then be converted to 3D models directly in the bekuto3d application.

## Architecture

The feature consists of two main components:

1. **Frontend UI**: A text input and button in the SvgTo3D.vue component that allows users to enter a prompt and generate an SVG.

2. **Serverless Function**: A Netlify serverless function that handles the communication with the Gemini API and processes the response.

## How It Works

1. The user enters a text prompt in the UI and clicks "Generate SVG".
2. The frontend calls the serverless function with the prompt.
3. The serverless function sends a request to the Gemini API with a specialized prompt that instructs it to create a minimalist black and white line art illustration.
4. The Gemini API returns a PNG image as base64 data.
5. In the initial implementation, the serverless function returns this base64 data to the frontend, which wraps it in an SVG.
6. In a future implementation, the serverless function will use potrace to convert the PNG to a proper SVG before returning it.
7. The frontend displays the SVG and allows the user to convert it to a 3D model using the existing bekuto3d functionality.

## Setup Requirements

To use this feature, you need to:

1. Deploy the application to Netlify (or another serverless platform).
2. Set the `GEMINI_API_KEY` environment variable in your Netlify dashboard.
3. For the full SVG conversion functionality, you'll need to configure potrace in the Netlify build environment (this is planned for a future update).

## Future Improvements

- Implement proper PNG to SVG conversion using potrace in the serverless function.
- Add options for customizing the generated image (style, complexity, etc.).
- Implement caching to reduce API calls.
- Add the ability to refine and iterate on generated images.

## Troubleshooting

If you encounter issues with SVG generation:

1. Check that the `GEMINI_API_KEY` environment variable is set correctly.
2. Verify that the Gemini API is available and that your API key has sufficient quota.
3. Check the browser console and Netlify function logs for error messages.
