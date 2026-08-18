# Orrery — Solar System Simulator

An interactive 3D solar system visualization built with [Three.js](https://threejs.org/) and [Vite](https://vite.dev/). Explore the Sun and eight planets, inspect planetary facts, control simulation speed, and switch between fixed and cinematic camera modes.

Sizes and orbital distances are visually adjusted for clarity and are not shown to scale.

## Features

- Textured 3D models of the Sun, planets, selected moons, and planetary rings
- Animated planetary orbits driven by each planet's orbital period
- Play, pause, reset, and simulation-speed controls
- Fixed and cinematic camera modes
- Mouse and touch orbit controls with scroll-to-zoom
- Clickable objects and navigation buttons with informational detail panels
- Responsive controls for desktop and smaller screens
- Static production output with no backend or database

## Requirements

- A current Node.js LTS release
- npm
- A browser with WebGL support

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit the camera |
| Scroll or pinch | Zoom |
| Click a body or its navigation button | Focus it and show details |
| Click empty space or close the panel | Return from the selected body |
| Pause / Play | Stop or resume simulated time |
| Reset | Reset simulated time and restore the overview |
| Speed | Select the simulation-time multiplier |
| Fixed / Cinematic | Switch camera behavior |

## Testing

Run the orbital-motion and simulation-time unit tests:

```bash
npm test
```

The tests use Node.js's built-in test runner.

## Production build

Create the static production files:

```bash
npm run build
```

Vite writes the result to `dist/`. Preview that build over HTTP with:

```bash
npx vite preview --host 127.0.0.1
```

Alternatively, serve the output with any static HTTP server:

```bash
python3 -m http.server 4173 --directory dist
```

Then visit `http://127.0.0.1:4173/`.

Do not open `dist/index.html` directly with a `file://` URL. The generated JavaScript modules and root-relative asset paths require the site to be served over HTTP.

## Deployment

Deploy the contents of `dist/` to a static host such as GitHub Pages, Cloudflare Pages, Netlify, Vercel, Amazon S3, Nginx, or Apache.

The current asset and texture URLs are root-relative, so the build is ready for deployment at a domain root, such as `https://orrery.example.com/`. Deployment below a path prefix, such as `https://example.github.io/solar-system-simulator/`, requires configuring Vite's base path and updating the texture URL handling.

## Project structure

```text
.
├── index.html                    # Application shell and controls
├── public/textures/              # Planet, moon, ring, and sky textures
├── src/main.js                   # Three.js scene and UI behavior
├── src/orbits.js                 # Orbital and simulation-time calculations
├── src/style.css                 # Layout and responsive styling
└── test/orbits.test.js           # Unit tests
```

## Credits

The textures in `public/textures/` are adapted from the [Solar System Scope texture pack](https://www.solarsystemscope.com/textures/), based on NASA imagery and elevation data. They are distributed under the [Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/). See `public/textures/ATTRIBUTION.txt` for details.

The interface loads DM Mono and Manrope from Google Fonts when an internet connection is available; system fonts provide the fallback.
