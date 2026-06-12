import maplibregl, { type Map, type Marker } from 'maplibre-gl';
import type { DriveCameraMode, HudStats, MobileInput } from '../types/modes';
import { setDriveCamera } from './camera';
import { clamp, distanceMetersBetween, kmhToMph, metersPerSecondToKmh, moveLngLatByMeters, normalizeBearing } from './movementMath';
import { findRoadSpawnNearCenter } from './roadSnap';

type DriveCallbacks = {
  onStats?: (stats: HudStats) => void;
};

export class DriveController {
  private map: Map;
  private callbacks: DriveCallbacks;
  private keys = new Set<string>();
  private enabled = false;
  private lng: number;
  private lat: number;
  private heading: number;
  private speed = 0;
  private cameraMode: DriveCameraMode = 'chase';
  private speedLimitKmh = 80;
  private marker: Marker | null = null;
  private markerElement: HTMLDivElement | null = null;
  private mobileInput: MobileInput = {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    accelerate: false,
    brake: false,
    steer: 0,
    boost: false
  };

  constructor(map: Map, callbacks: DriveCallbacks = {}) {
    this.map = map;
    this.callbacks = callbacks;
    const center = map.getCenter();
    this.lng = center.lng;
    this.lat = center.lat;
    this.heading = map.getBearing();
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    const center = this.map.getCenter();
    const roadSpawn = findRoadSpawnNearCenter(this.map);
    this.lng = roadSpawn?.lng ?? center.lng;
    this.lat = roadSpawn?.lat ?? center.lat;
    this.heading = roadSpawn?.heading ?? this.map.getBearing();
    this.speed = 0;
    this.ensureMarker();
    this.updateMarker();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.map.dragPan.disable();
    this.map.scrollZoom.enable();
    setDriveCamera(this.map, this.state(), this.cameraMode);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.map.dragPan.enable();
    this.keys.clear();
    this.marker?.remove();
    this.marker = null;
    this.markerElement = null;
  }

  update(deltaTime: number) {
    if (!this.enabled) return;
    const accelerating = this.keys.has('w') || this.keys.has('arrowup') || this.mobileInput.accelerate;
    const braking = this.keys.has('s') || this.keys.has('arrowdown') || this.mobileInput.brake;
    const boost = this.keys.has('shift') || this.mobileInput.boost;
    const steer = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.mobileInput.steer;

    const normalizedSteer = clamp(steer, -1, 1);
    const accel = boost ? 18 : 10.5;
    if (accelerating) this.speed += accel * deltaTime;
    if (braking) this.speed -= (this.speed > 0 ? 18 : 8) * deltaTime;
    if (!accelerating && !braking) this.speed *= Math.exp(-1.9 * deltaTime);
    if (Math.abs(this.speed) < 0.05 && !accelerating && !braking) this.speed = 0;
    const maxForwardSpeed = this.speedLimitKmh / 3.6;
    this.speed = clamp(this.speed, -9, maxForwardSpeed);

    const turnAuthority = clamp(Math.abs(this.speed) / 8, 0.25, 1);
    const turnRate = normalizedSteer * turnAuthority * 74;
    this.heading = normalizeBearing(this.heading + turnRate * deltaTime * Math.sign(this.speed || 1));
    const previous = { lng: this.lng, lat: this.lat };
    const next = moveLngLatByMeters(this.lng, this.lat, this.heading, this.speed * deltaTime);
    this.lng = next.lng;
    this.lat = next.lat;

    this.updateMarker();
    setDriveCamera(this.map, this.state(), this.cameraMode);
    const actualMeters = distanceMetersBetween(previous, next);
    const actualMetersPerSecond = actualMeters / Math.max(deltaTime, 0.001);
    const kmh = metersPerSecondToKmh(actualMetersPerSecond);
    this.callbacks.onStats?.({
      speedKmh: kmh,
      speedMph: kmhToMph(kmh),
      cameraHeight: this.cameraMode === 'chase' ? 8 : 1.4,
      heading: this.heading,
      pitch: this.map.getPitch(),
      zoom: this.map.getZoom(),
      driveCameraMode: this.cameraMode,
      steering: normalizedSteer,
      throttle: accelerating ? (boost ? 1 : 0.72) : 0,
      braking,
      gear: this.speed < -0.4 ? 'R' : this.speed > 0.4 ? 'D' : 'N'
    });
  }

  setMobileInput(input: MobileInput) {
    this.mobileInput = input;
  }

  toggleCameraMode() {
    this.setCameraMode(this.cameraMode === 'chase' ? 'driver' : 'chase');
  }

  setCameraMode(cameraMode: DriveCameraMode) {
    this.cameraMode = cameraMode;
    if (this.enabled) {
      setDriveCamera(this.map, this.state(), this.cameraMode);
    }
  }

  setSpeedLimitKmh(speedLimitKmh: number) {
    this.speedLimitKmh = clamp(speedLimitKmh, 10, 180);
    const maxForwardSpeed = this.speedLimitKmh / 3.6;
    this.speed = clamp(this.speed, -9, maxForwardSpeed);
  }

  private state() {
    return {
      lng: this.lng,
      lat: this.lat,
      heading: this.heading,
      speed: this.speed
    };
  }

  private ensureMarker() {
    if (this.marker) return;
    this.markerElement = document.createElement('div');
    this.markerElement.className = 'map-car-marker';
    this.markerElement.innerHTML = '<div class="map-car-top"></div><div class="map-car-cabin"></div><div class="map-car-windshield"></div><div class="map-car-headlight left"></div><div class="map-car-headlight right"></div>';
    this.marker = new maplibregl.Marker({
      element: this.markerElement,
      anchor: 'center',
      rotationAlignment: 'map',
      pitchAlignment: 'map'
    })
      .setLngLat([this.lng, this.lat])
      .addTo(this.map);
  }

  private updateMarker() {
    this.marker?.setLngLat([this.lng, this.lat]);
    this.marker?.setRotation(this.heading);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'c') {
      this.toggleCameraMode();
      return;
    }
    this.keys.add(key);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };
}
