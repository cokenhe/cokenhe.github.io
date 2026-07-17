# Ken He Portfolio Portal

This is the React 18/Vite source for `cokenhe.github.io`.

The app deliberately keeps two complete visual worlds:

- **Classic world** — the existing `dev` branch JSX/Framer Motion portfolio in `src/App.jsx` and `src/styles.css`.
- **Nocturnal world** — the preserved Open Design HTML/WebGL experience under `src/public/new-world/`.

React owns the navigation magic button, accessible world state, reduced-motion timing, and the centered shaking portal transition. The nocturnal page remains isolated in a same-origin iframe so its WebGL liquid background, five animal portraits, eye tracking, scroll morph, navigation, content, and local assets remain unchanged.

## Develop

```bash
npm install
npx playwright install chromium webkit
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173/`).

## Build and preview this repository

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173

# In another terminal:
npm run test:e2e -- http://127.0.0.1:4173/
```

## Verify

```bash
npm test
npm run verify
npm audit --audit-level=high
```

`npm run test:e2e` launches project-owned Playwright and checks the live readiness
handshake, dog peek and gaze, intermediate opening and closing clips, child
interactivity, focus and scroll restoration, reduced motion, the 390×844 mobile
layout, Chromium, and WebKit. Screenshots from the detailed Chromium flow are
written to a temporary directory reported by the command.
