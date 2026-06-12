import type { Map } from 'maplibre-gl';
import type { GeocodeResult } from '../types/geo';
import type { DriveCameraMode } from '../types/modes';
import { clampPitch, moveLngLatByMeters, normalizeBearing } from './movementMath';

export type VehicleState = {
  lng: number;
  lat: number;
  heading: number;
  speed: number;
};

export function flyToCity(map: Map, city: GeocodeResult): void {
  map.flyTo({
    center: [city.lon, city.lat],
    zoom: 15.2,
    pitch: 72,
    bearing: -25,
    speed: 0.8,
    curve: 1.35,
    essential: true
  });
}

export function resetToCity(map: Map, city: GeocodeResult): void {
  map.easeTo({
    center: [city.lon, city.lat],
    zoom: 15.2,
    pitch: 70,
    bearing: -25,
    duration: 900,
    essential: true
  });
}

export function setFirstPersonCamera(map: Map, position: { lng: number; lat: number }, heading: number, pitch: number): void {
  map.jumpTo({
    center: [position.lng, position.lat],
    zoom: 18.25,
    bearing: normalizeBearing(heading),
    pitch: clampPitch(pitch)
  });
}

export function setDriveCamera(map: Map, vehicle: VehicleState, cameraMode: DriveCameraMode): void {
  const driverFocus = moveLngLatByMeters(vehicle.lng, vehicle.lat, vehicle.heading, 10);
  const chaseFocus = moveLngLatByMeters(vehicle.lng, vehicle.lat, vehicle.heading, 26);
  map.jumpTo({
    center: cameraMode === 'chase' ? [chaseFocus.lng, chaseFocus.lat] : [driverFocus.lng, driverFocus.lat],
    zoom: cameraMode === 'chase' ? 18.35 : 19.15,
    bearing: normalizeBearing(vehicle.heading),
    pitch: cameraMode === 'chase' ? 68 : 84
  });
}
