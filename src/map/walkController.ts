import maplibregl, { type Map, type Marker } from 'maplibre-gl';
import type { HudStats, MobileInput } from '../types/modes';
import { setFirstPersonCamera } from './camera';
import { clamp, clampPitch, kmhToMph, metersPerSecondToKmh, moveLngLatByMeters, normalizeBearing } from './movementMath';

type WalkCallbacks = {
  onStats?: (stats: HudStats) => void;
  onPointerLockChange?: (locked: boolean) => void;
};

export class WalkController {
  private map: Map;
  private callbacks: WalkCallbacks;
  private keys = new Set<string>();
  private enabled = false;
  private lng: number;
  private lat: number;
  private heading: number;
  private pitch = 82;
  private lastSpeed = 0;
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

  constructor(map: Map, callbacks: WalkCallbacks = {}) {
    this.map = map;
    this.callbacks = callbacks;
    const center = map.getCenter();
    this.lng = center.lng;
    this.lat = center.lat;
    this.heading = map.getBearing();
    this.pitch = clampPitch(map.getPitch() || 80);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    const center = this.map.getCenter();
    this.lng = center.lng;
    this.lat = center.lat;
    this.heading = this.map.getBearing();
    this.pitch = 82;
    this.ensureMarker();
    this.updateMarker();
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.map.getCanvas().addEventListener('mousedown', this.onMouseDown);
    this.map.dragPan.disable();
    this.map.scrollZoom.enable();
    setFirstPersonCamera(this.map, { lng: this.lng, lat: this.lat }, this.heading, this.pitch);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.map.getCanvas().removeEventListener('mousedown', this.onMouseDown);
    if (document.pointerLockElement === this.map.getCanvas()) document.exitPointerLock();
    this.map.dragPan.enable();
    this.keys.clear();
    this.marker?.remove();
    this.marker = null;
    this.markerElement = null;
  }

  update(deltaTime: number) {
    if (!this.enabled) return;
    const forward = Number(this.keys.has('w') || this.keys.has('arrowup')) - Number(this.keys.has('s') || this.keys.has('arrowdown')) + -this.mobileInput.moveY;
    const strafe = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')) + this.mobileInput.moveX;
    const boost = this.keys.has('shift') || this.mobileInput.boost;
    const speed = boost ? 4.8 : 2.1;
    const moveLen = Math.hypot(forward, strafe);
    const distance = clamp(moveLen, 0, 1) * speed * deltaTime;
    this.lastSpeed = distance / Math.max(deltaTime, 0.001);

    if (moveLen > 0.01) {
      const relative = (Math.atan2(strafe, forward) * 180) / Math.PI;
      const next = moveLngLatByMeters(this.lng, this.lat, this.heading + relative, distance);
      this.lng = next.lng;
      this.lat = next.lat;
    }

    if (Math.abs(this.mobileInput.lookX) > 0.001 || Math.abs(this.mobileInput.lookY) > 0.001) {
      this.heading = normalizeBearing(this.heading + this.mobileInput.lookX * 90 * deltaTime);
      this.pitch = clampPitch(this.pitch - this.mobileInput.lookY * 55 * deltaTime);
    }

    setFirstPersonCamera(this.map, { lng: this.lng, lat: this.lat }, this.heading, this.pitch);
    this.updateMarker();
    const kmh = metersPerSecondToKmh(this.lastSpeed);
    this.callbacks.onStats?.({
      speedKmh: kmh,
      speedMph: kmhToMph(kmh),
      cameraHeight: 1.7,
      heading: this.heading,
      pitch: this.pitch,
      zoom: this.map.getZoom()
    });
  }

  setMobileInput(input: MobileInput) {
    this.mobileInput = input;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === 'escape') return;
    this.keys.add(event.key.toLowerCase());
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private onMouseDown = () => {
    this.map.getCanvas().requestPointerLock?.();
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.enabled) return;
    const locked = document.pointerLockElement === this.map.getCanvas();
    if (!locked && event.buttons !== 1) return;
    this.heading = normalizeBearing(this.heading + event.movementX * 0.12);
    this.pitch = clampPitch(this.pitch - event.movementY * 0.08);
  };

  private onPointerLockChange = () => {
    this.callbacks.onPointerLockChange?.(document.pointerLockElement === this.map.getCanvas());
  };

  private ensureMarker() {
    if (this.marker) return;
    this.markerElement = document.createElement('div');
    this.markerElement.className = 'map-avatar-marker';
    this.markerElement.innerHTML = '<div class="avatar-head"></div><div class="avatar-body"></div><div class="avatar-shadow"></div>';
    this.marker = new maplibregl.Marker({
      element: this.markerElement,
      anchor: 'bottom',
      rotationAlignment: 'map',
      pitchAlignment: 'map'
    })
      .setLngLat([this.lng, this.lat])
      .addTo(this.map);
  }

  private updateMarker() {
    this.marker?.setLngLat([this.lng, this.lat]);
    if (this.markerElement) {
      this.markerElement.style.setProperty('--avatar-heading', `${this.heading}deg`);
    }
  }
}
