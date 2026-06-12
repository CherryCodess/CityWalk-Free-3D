const EARTH_RADIUS_METERS = 6378137;

export function normalizeBearing(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampPitch(pitch: number): number {
  return clamp(pitch, 20, 85);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function smoothDamp(current: number, target: number, factor: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-factor * dt));
}

export function moveLngLatByMeters(lng: number, lat: number, headingDeg: number, distanceMeters: number) {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const heading = (headingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(heading)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(heading) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  const nextLng = ((((lng2 * 180) / Math.PI + 540) % 360) - 180);
  return {
    lng: nextLng,
    lat: clamp((lat2 * 180) / Math.PI, -85, 85)
  };
}

export function distanceMetersBetween(a: { lng: number; lat: number }, b: { lng: number; lat: number }): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function metersPerSecondToKmh(speed: number): number {
  return Math.abs(speed) * 3.6;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}
