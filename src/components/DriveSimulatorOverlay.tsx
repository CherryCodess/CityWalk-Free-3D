import type { HudStats, Mode } from '../types/modes';

type Props = {
  mode: Mode;
  stats: HudStats;
};

export function DriveSimulatorOverlay({ mode, stats }: Props) {
  if (mode !== 'drive') return null;

  const steering = stats.steering || 0;
  const wheelRotation = steering * 42;
  const driver = stats.driveCameraMode !== 'chase';

  return (
    <div className={`drive-sim ${driver ? 'driver-view' : 'chase-view'}`} aria-hidden>
      <div className="speed-vignette" />
      <div className="lane-guide lane-left" />
      <div className="lane-guide lane-right" />
      {driver ? (
        <div className="cockpit">
          <div className="windshield-shadow" />
          <div className="hood">
            <span />
          </div>
          <div className="dash">
            <div className="wheel" style={{ transform: `rotate(${wheelRotation}deg)` }}>
              <div className="wheel-inner" />
              <div className="wheel-spoke spoke-top" />
              <div className="wheel-spoke spoke-left" />
              <div className="wheel-spoke spoke-right" />
            </div>
            <div className="cluster">
              <b>{stats.speedKmh.toFixed(0)}</b>
              <span>km/h</span>
              <em>{stats.gear || 'N'}</em>
            </div>
          </div>
        </div>
      ) : (
        <div className="chase-car">
          <div className="car-roof" />
          <div className="car-body" />
          <div className="car-light left-light" />
          <div className="car-light right-light" />
        </div>
      )}
    </div>
  );
}
