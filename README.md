# CityWalk Free 3D

CityWalk Free 3D is a free, browser-based 3D city explorer. Search for a city, landmark, or address, fly to that location, then explore the city through a 3D OpenStreetMap-based map.

The app supports three modes:

- Fly mode: normal 3D map orbit, pan, zoom, pitch, and rotate controls.
- Walk mode: spawns an avatar at the selected location and lets you explore with first-person-style walking controls.
- Drive mode: spawns a car near a road at the selected location, follows it with a chase camera, and can switch to an in-car camera view.

The goal is to provide the best possible free/open-data city driving and walking prototype without paid map providers or API keys.

## Tech Stack

- Vite
- React
- TypeScript
- MapLibre GL JS
- OpenFreeMap styles and vector tiles
- OpenStreetMap-derived map data
- Plain CSS

No backend is required for the MVP.

## Free And Open Data

This project does not use:

- Google Maps
- Google Photorealistic 3D Tiles
- Mapbox
- Cesium ion
- Paid geocoding APIs
- Billing-based map providers
- Required API keys

Default data/rendering stack:

- Map rendering: MapLibre GL JS
- Default style: OpenFreeMap Liberty
- Map data: OpenStreetMap-derived vector tiles
- Geocoding: Photon first, Nominatim fallback
- Offline fallback: built-in demo city list

3D building accuracy depends on OpenStreetMap coverage. Some cities have detailed building footprints and heights; others may have simple or missing 3D buildings.

## Features

- Fullscreen 3D map interface
- City, landmark, and address search
- Smooth camera fly-to on search result selection
- OSM-based 3D building extrusions where data is available
- Fly / Walk / Drive mode selector
- Avatar spawn in Walk mode
- Car spawn near rendered roads in Drive mode when road features are available
- Chase and in-car camera views
- User-configurable car speed limit
- Speedometer in km/h and mph
- Graphics quality selector
- Style selector
- Mobile touch controls for Walk and Drive modes
- Free-data limitations modal
- No account system, billing, backend, or API keys

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local Vite URL printed in the terminal, usually:

```text
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Environment Variables

The app works without environment variables.

Optional overrides are available in `.env.example`:

```bash
VITE_PHOTON_URL=
VITE_NOMINATIM_URL=
VITE_STYLE_URL=
```

Use these only if you want to self-host Photon, self-host Nominatim, or point the app at your own MapLibre style.

## Controls

Fly mode:

- Drag: pan/orbit
- Scroll: zoom
- MapLibre navigation controls: zoom, rotate, and pitch
- Reset button: return camera to current city

Walk mode:

- W / Arrow Up: move forward
- S / Arrow Down: move backward
- A / Arrow Left: strafe left
- D / Arrow Right: strafe right
- Shift: move faster
- Mouse drag or pointer lock: look around
- Esc: exit pointer lock

Drive mode:

- W / Arrow Up: accelerate
- S / Arrow Down: brake/reverse
- A / Arrow Left: steer left
- D / Arrow Right: steer right
- Shift: stronger acceleration up to the selected speed limit
- C: toggle Chase view / In-car view
- Car speed limit slider: caps the car's real map movement speed
- Car camera selector: choose Chase view or In-car view

Touch devices show large mobile controls for Walk and Drive modes.

## Project Structure

```text
src/
  main.tsx
  App.tsx
  styles.css
  components/
    Hud.tsx
    LimitationsModal.tsx
    MobileControls.tsx
    ModeSelector.tsx
    SearchBar.tsx
    SettingsPanel.tsx
  map/
    add3DBuildings.ts
    camera.ts
    createMap.ts
    driveController.ts
    geocode.ts
    movementMath.ts
    roadSnap.ts
    styles.ts
    walkController.ts
  types/
    geo.ts
    modes.ts
```

## How Drive Spawning Works

When Drive mode is enabled, the app checks rendered road line layers near the current map center with `map.queryRenderedFeatures`. If a nearby road segment is found, the car spawns at the midpoint of that segment and uses the road segment heading. If road features are unavailable in the selected free style, the car safely falls back to the selected city/map center.

This is not full road snapping. The car can currently drive freely over the map after spawning.

## Optional Self-Hosting

For more control, you can self-host vector tiles with PMTiles or Protomaps and point `VITE_STYLE_URL` to your own MapLibre style.

If your tile schema uses a building source layer other than `building`, update `src/map/add3DBuildings.ts`.

If your road layer names are different, update the road layer matching logic in `src/map/roadSnap.ts`.

## Attribution

Keep map attribution visible. This app intentionally leaves the MapLibre attribution control enabled because OpenFreeMap and OpenStreetMap-derived data require attribution.

## Known Limitations

- Not photorealistic scanned 3D
- Building heights and shapes depend on OpenStreetMap coverage
- Walk and drive movement are simulations over map data
- No complex collision detection
- No indoor navigation
- No guaranteed road-following after the initial car spawn
- Public Nominatim has usage limits; heavier usage should self-host or use a compliant free endpoint
- Some OpenFreeMap/style schemas may not expose every building or road feature needed for rich 3D behavior

## Deployment

This is a static Vite app. It can be deployed to free static hosting platforms.

Build the app:

```bash
npm run build
```

Deploy the generated `dist/` directory.

## Troubleshooting

- Blank map: check network access to OpenFreeMap style and tile URLs.
- Search does not return results: Photon or Nominatim may be unavailable or rate-limited; built-in cities still work.
- Few or no buildings: the city or selected style may not expose building height data.
- Car does not spawn exactly on a road: the selected style may not expose road line features near the center.
- Speed feels wrong: the speedometer is calculated from actual map distance traveled per animation frame; reduce the speed limit if the camera motion feels too fast.
- Slow performance: switch graphics quality to Low or Medium.
