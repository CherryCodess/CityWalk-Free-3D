export type BBox = [number, number, number, number];

export type GeocodeResult = {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lon: number;
  bbox?: BBox;
  source: 'photon' | 'nominatim' | 'built-in';
};
