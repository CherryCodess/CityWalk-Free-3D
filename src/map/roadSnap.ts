import type { Map } from 'maplibre-gl';

export type RoadSnapResult = {
  lng: number;
  lat: number;
  heading: number;
  confidence: number;
} | null;

type LngLatTuple = [number, number];

function isRoadLayerId(id: string): boolean {
  return /(road|street|highway|transport|motorway|trunk|primary|secondary|tertiary|minor|service|path)/i.test(id);
}

function roadLayerIds(map: Map): string[] {
  return (map.getStyle().layers || [])
    .filter((layer) => layer.type === 'line' && isRoadLayerId(layer.id))
    .map((layer) => layer.id);
}

function lineStrings(geometry: GeoJSON.Geometry | undefined): LngLatTuple[][] {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates as LngLatTuple[]];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as LngLatTuple[][];
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(lineStrings);
  return [];
}

function segmentHeading(a: LngLatTuple, b: LngLatTuple): number {
  const dLng = b[0] - a[0];
  const dLat = b[1] - a[1];
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

export function findNearbyRoad(map: Map, point: { x: number; y: number }): RoadSnapResult {
  const layerIds = roadLayerIds(map);
  if (layerIds.length === 0) return null;

  const radius = 180;
  const features = map.queryRenderedFeatures(
    [
      [point.x - radius, point.y - radius],
      [point.x + radius, point.y + radius]
    ],
    { layers: layerIds }
  );

  let best: RoadSnapResult = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const feature of features) {
    for (const line of lineStrings(feature.geometry)) {
      for (let i = 0; i < line.length - 1; i += 1) {
        const a = line[i];
        const b = line[i + 1];
        if (!a || !b) continue;
        const mid: LngLatTuple = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const projected = map.project(mid);
        const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = {
            lng: mid[0],
            lat: mid[1],
            heading: segmentHeading(a, b),
            confidence: Math.max(0, 1 - distance / radius)
          };
        }
      }
    }
  }

  return best;
}

export function findRoadSpawnNearCenter(map: Map): RoadSnapResult {
  const canvas = map.getCanvas();
  return findNearbyRoad(map, {
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight / 2
  });
}
