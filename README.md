# RunPaths

A local, open-source friendly web app to generate **nice running loops** from a chosen start point.
It uses **OpenStreetMap** tiles (MapLibre), **OpenRouteService** for loop routing, and **Overpass** to estimate traffic lights & park adjacency.

## Features
- Click map to set start
- Target distance slider (1–25 km) + quick 3k/5k/10k/15k
- Sliders: **Avoid traffic lights**, **Prefer parks**
- Generates multiple loop candidates (varying ORS `seed`) and picks the best
- Displays distance, estimated time, traffic lights near route, park adjacency %, and a composite score
- Pretty UI with Tailwind + soft panels
- OSM raster tiles with attribution (suitable for local dev)

## 1) Requirements
- Node.js 18+ and npm or pnpm/yarn
- An OpenRouteService API key: https://openrouteservice.org/dev/#/signup

## 2) Setup
```bash
npm install
cp .env.local.example .env.local
# edit .env.local to set ORS_API_KEY
```

## 3) Run
```bash
npm run dev
# open http://localhost:3000
```

## Notes
- The OSM tile server is fine for **local development**. For production, use a proper OSM-compatible tile provider and cache tiles.
- Overpass usage is rate-limited; this MVP keeps queries tight to the route bbox.
- Park adjacency is an approximation (distance to park outlines). It’s fast and works well enough for picking nicer loops.
