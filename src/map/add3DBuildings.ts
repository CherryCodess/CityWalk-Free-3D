import type { FillExtrusionLayerSpecification, Map } from 'maplibre-gl';
import type { Quality } from '../types/modes';

const BUILDING_LAYER_ID = 'citywalk-3d-buildings';

function firstSymbolLayer(map: Map): string | undefined {
  return map.getStyle().layers?.find((layer) => layer.type === 'symbol')?.id;
}

function findVectorSource(map: Map): string | null {
  const sources = map.getStyle().sources || {};
  const preferred = ['openmaptiles', 'protomaps', 'osm', 'vector'];
  for (const id of preferred) {
    const source = sources[id];
    if (source && source.type === 'vector') return id;
  }
  const first = Object.entries(sources).find(([, source]) => source.type === 'vector');
  return first?.[0] || null;
}

function layerExists(map: Map, id: string): boolean {
  return Boolean(map.getLayer(id));
}

export function add3DBuildings(map: Map, quality: Quality): void {
  if (!map.isStyleLoaded()) {
    map.once('styledata', () => add3DBuildings(map, quality));
    return;
  }

  if (layerExists(map, BUILDING_LAYER_ID)) {
    map.removeLayer(BUILDING_LAYER_ID);
  }

  const sourceId = findVectorSource(map);
  if (!sourceId) return;

  const opacity = quality === 'low' ? 0.35 : quality === 'medium' ? 0.55 : 0.72;
  const baseColor = quality === 'high' ? '#8fa4ad' : '#7e8d94';
  const minZoom = quality === 'low' ? 15 : 13.5;

  // OpenFreeMap/OpenMapTiles normally uses source-layer "building".
  // Other OSM vector schemas may use a different source-layer; adjust here if self-hosting PMTiles.
  const layer: FillExtrusionLayerSpecification = {
    id: BUILDING_LAYER_ID,
    type: 'fill-extrusion',
    source: sourceId,
    'source-layer': 'building',
    minzoom: minZoom,
    filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']],
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['to-number', ['get', 'render_height']], ['to-number', ['get', 'height']], ['*', ['to-number', ['get', 'building:levels']], 3], 12],
        0,
        baseColor,
        80,
        '#a7bcc4',
        180,
        '#d4dde0'
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13,
        0,
        15,
        ['coalesce', ['to-number', ['get', 'render_height']], ['to-number', ['get', 'height']], ['*', ['to-number', ['get', 'building:levels']], 3], 12]
      ],
      'fill-extrusion-base': ['coalesce', ['to-number', ['get', 'render_min_height']], ['to-number', ['get', 'min_height']], 0],
      'fill-extrusion-opacity': opacity,
      'fill-extrusion-vertical-gradient': true
    }
  };

  try {
    map.addLayer(layer, firstSymbolLayer(map));
  } catch {
    // Some free styles expose a vector source but not the OpenMapTiles "building" source-layer.
    // The app should remain usable even when 3D buildings are unavailable.
  }
}
