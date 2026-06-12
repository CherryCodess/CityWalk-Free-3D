import maplibregl, { Map } from 'maplibre-gl';
import { DEFAULT_STYLE } from './styles';

export function createMap(container: HTMLElement): Map {
  const map = new maplibregl.Map({
    container,
    style: DEFAULT_STYLE.url,
    center: [-122.4194, 37.7749],
    zoom: 15.4,
    pitch: 70,
    bearing: -28,
    antialias: true,
    attributionControl: { compact: false },
    cooperativeGestures: false
  });

  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    }),
    'top-right'
  );
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  return map;
}
