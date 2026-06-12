import { RotateCcw } from 'lucide-react';
import type { DriveCameraMode, Mode, Quality } from '../types/modes';
import type { MapStyleId, MapStyleOption } from '../map/styles';

type Props = {
  quality: Quality;
  onQualityChange: (quality: Quality) => void;
  styles: MapStyleOption[];
  styleId: MapStyleId;
  onStyleChange: (styleId: MapStyleId) => void;
  debug: boolean;
  onDebugChange: (debug: boolean) => void;
  mode: Mode;
  driveCameraMode: DriveCameraMode;
  onDriveCameraModeChange: (cameraMode: DriveCameraMode) => void;
  speedLimitKmh: number;
  onSpeedLimitChange: (speedLimitKmh: number) => void;
  onReset: () => void;
};

export function SettingsPanel({
  quality,
  onQualityChange,
  styles,
  styleId,
  onStyleChange,
  debug,
  onDebugChange,
  mode,
  driveCameraMode,
  onDriveCameraModeChange,
  speedLimitKmh,
  onSpeedLimitChange,
  onReset
}: Props) {
  return (
    <div className="settings-panel">
      <label>
        Graphics
        <select value={quality} onChange={(event) => onQualityChange(event.target.value as Quality)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label>
        Style
        <select value={styleId} onChange={(event) => onStyleChange(event.target.value as MapStyleId)}>
          {styles.map((style) => (
            <option key={style.id} value={style.id}>{style.name}</option>
          ))}
        </select>
      </label>
      <label className="toggle-row">
        <input type="checkbox" checked={debug} onChange={(event) => onDebugChange(event.target.checked)} />
        Debug
      </label>
      {mode === 'drive' && (
        <>
          <label>
            Car speed limit
            <input
              type="range"
              min="20"
              max="180"
              step="5"
              value={speedLimitKmh}
              onChange={(event) => onSpeedLimitChange(Number(event.target.value))}
            />
            <span className="range-value">{speedLimitKmh} km/h</span>
          </label>
          <label>
            Car camera
            <select value={driveCameraMode} onChange={(event) => onDriveCameraModeChange(event.target.value as DriveCameraMode)}>
              <option value="chase">Chase view</option>
              <option value="driver">In-car view</option>
            </select>
          </label>
        </>
      )}
      <button className="icon-button" onClick={onReset} title="Reset camera" aria-label="Reset camera">
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
