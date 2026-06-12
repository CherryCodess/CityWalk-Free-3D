import type { GeocodeResult } from '../types/geo';
import type { HudStats, Mode, Quality } from '../types/modes';

type Props = {
  mode: Mode;
  city: GeocodeResult;
  stats: HudStats;
  quality: Quality;
  pointerLocked: boolean;
  debug: boolean;
  onShowLimitations: () => void;
};

export function Hud({ mode, city, stats, quality, pointerLocked, debug, onShowLimitations }: Props) {
  return (
    <>
      <div className="hud-panel bottom-left">
        <strong>{mode.toUpperCase()} controls</strong>
        {mode === 'fly' && <p>Drag to orbit, scroll to zoom, right-drag to pitch.</p>}
        {mode === 'walk' && <p>WASD/arrows move. Drag or click map to look. Shift moves faster. Esc exits pointer lock.</p>}
        {mode === 'drive' && <p>WASD/arrows drive. Shift boosts. C toggles chase and driver camera.</p>}
        {mode !== 'fly' && !pointerLocked && <p className="muted">Click the map to control camera.</p>}
        <button className="text-button" onClick={onShowLimitations}>Why doesn&apos;t every city look perfect?</button>
      </div>
      <div className="hud-panel bottom-right">
        <div className="stat-row"><span>City</span><b>{city.name}</b></div>
        <div className="stat-row"><span>Quality</span><b>{quality}</b></div>
        {mode === 'drive' && (
          <>
            <div className="stat-row"><span>Speed</span><b>{stats.speedKmh.toFixed(0)} km/h</b></div>
            <div className="stat-row"><span>Speed</span><b>{stats.speedMph.toFixed(0)} mph</b></div>
            <div className="stat-row"><span>Camera</span><b>{stats.driveCameraMode}</b></div>
          </>
        )}
        {mode === 'walk' && <div className="stat-row"><span>Walk speed</span><b>{stats.speedKmh.toFixed(1)} km/h</b></div>}
        {debug && (
          <>
            <div className="stat-row"><span>Zoom</span><b>{stats.zoom.toFixed(2)}</b></div>
            <div className="stat-row"><span>Pitch</span><b>{stats.pitch.toFixed(0)} deg</b></div>
            <div className="stat-row"><span>Bearing</span><b>{stats.heading.toFixed(0)} deg</b></div>
          </>
        )}
        <p className="limitation-note">3D building accuracy depends on OpenStreetMap data coverage.</p>
      </div>
      {mode === 'walk' && <div className="crosshair" aria-hidden />}
    </>
  );
}
