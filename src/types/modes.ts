export type Mode = 'fly' | 'walk' | 'drive';
export type Quality = 'low' | 'medium' | 'high';
export type DriveCameraMode = 'driver' | 'chase';

export type MobileInput = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  accelerate: boolean;
  brake: boolean;
  steer: number;
  boost: boolean;
};

export type HudStats = {
  speedKmh: number;
  speedMph: number;
  cameraHeight: number;
  heading: number;
  pitch: number;
  zoom: number;
  driveCameraMode?: DriveCameraMode;
  steering?: number;
  throttle?: number;
  braking?: boolean;
  gear?: 'D' | 'R' | 'N';
};
