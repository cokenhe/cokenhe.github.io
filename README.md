# Ken He Portfolio Portal

This is the React 18/Vite source for the Open Design project one directory above.

The app deliberately keeps two complete visual worlds:

- **Classic world** — the existing `dev` branch JSX/Framer Motion portfolio in `src/App.jsx` and `src/styles.css`.
- **Nocturnal world** — the preserved Open Design HTML/WebGL experience under `src/public/new-world/`.

React owns the navigation magic button, accessible world state, reduced-motion timing, and the centered shaking portal transition. The nocturnal page remains isolated in a same-origin iframe so its WebGL liquid background, five animal portraits, eye tracking, scroll morph, navigation, content, and local assets remain unchanged.

## Develop

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173/`).

## Build and preview this repository

```bash
npm run build
npm run preview
```

## Build into the Open Design project root

```bash
npm run build:open-design
cd ..
python3 -m http.server 8125 --bind 127.0.0.1
```

Open `http://127.0.0.1:8125/`.

## Verify

```bash
npm test
npm run verify
node scripts/verify-portal.mjs http://127.0.0.1:8125/
```

The parent project also exposes `npm run verify:portal` and `npm run verify:new-world` while its preview server is running.
