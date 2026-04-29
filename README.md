# BrandShot

## Local Development

This repo keeps local npm packages inside `.local-preview` so a cloned checkout does not depend on globally installed project modules.

## New Computer Setup

- Install Node.js/npm on the computer.
- Clone this repo.
- Open a terminal in the cloned repo folder.
- Add any required local environment variables to `.env` or `.env.local`.
- Run the local preview setup:

```bash
npm run local:setup
```

- Start the local development server:

```bash
npm run local:dev
```

- Open the localhost URL printed by Vite in the terminal.

No global project packages are required. `local:setup` copies the app into `.local-preview/app` and runs `npm ci` there, using `.local-preview/npm-cache` for npm's cache. The installed modules live at `.local-preview/app/node_modules`.

## Daily Commands

After setup, use this to start local development:

```bash
npm run local:dev
```

Run this again when the files in `.local-preview/app` need to be refreshed:

- after downloading new updates from GitHub
- after changing `package.json` or `package-lock.json`
- after changing app files like `src/`, `api/`, `index.html`, or `vite.config.ts`

```bash
npm run local:setup
```

Use these commands for the preview environment:

```bash
npm run local:build
npm run local:preview
```

## Vercel Deployment

This project is set up for Vercel using Vite for the frontend and the root `api/` folder for serverless functions.

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- API routes:
  - `/api/generate`
  - `/api/describe-reference-images`
- Required environment variable:
  - `GEMINI_API_KEY`
- Optional environment variables:
  - `GEMINI_IMAGE_MODEL`
  - `GEMINI_TEXT_MODEL`

Deployment uses the root project files and the committed `package-lock.json`.
