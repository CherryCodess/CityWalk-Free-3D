import type { Map } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { add3DBuildings } from './map/add3DBuildings';
import { resetToCity, flyToCity } from './map/camera';
import { createMap } from './map/createMap';
import { DriveController } from './map/driveController';
import { DEFAULT_STYLE, MAP_STYLES, type MapStyleId } from './map/styles';
import { WalkController } from './map/walkController';
import { BUILT_IN_CITIES } from './map/geocode';
import { Hud } from './components/Hud';
import { LimitationsModal } from './components/LimitationsModal';
import { MobileControls } from './components/MobileControls';
import { ModeSelector } from './components/ModeSelector';
import { SearchBar } from './components/SearchBar';
import { SettingsPanel } from './components/SettingsPanel';
import type { GeocodeResult } from './types/geo';
import type { DriveCameraMode, HudStats, MobileInput, Mode, Quality } from './types/modes';

const EMPTY_INPUT: MobileInput = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  accelerate: false,
  brake: false,
  steer: 0,
  boost: false
};

const DEFAULT_STATS: HudStats = {
  speedKmh: 0,
  speedMph: 0,
  cameraHeight: 0,
  heading: 0,
  pitch: 70,
  zoom: 15
};

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const walkRef = useRef<WalkController | null>(null);
  const driveRef = useRef<DriveController | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(performance.now());

  const [mode, setMode] = useState<Mode>('fly');
  const modeRef = useRef<Mode>('fly');
  const [quality, setQuality] = useState<Quality>('high');
  const qualityRef = useRef<Quality>('high');
  const [styleId, setStyleId] = useState<MapStyleId>(DEFAULT_STYLE.id);
  const [city, setCity] = useState<GeocodeResult>(BUILT_IN_CITIES[1]);
  const cityRef = useRef<GeocodeResult>(BUILT_IN_CITIES[1]);
  const [stats, setStats] = useState<HudStats>(DEFAULT_STATS);
  const [debug, setDebug] = useState(false);
  const [speedLimitKmh, setSpeedLimitKmh] = useState(80);
  const [driveCameraMode, setDriveCameraMode] = useState<DriveCameraMode>('chase');
  const [pointerLocked, setPointerLocked] = useState(false);
  const [limitationsOpen, setLimitationsOpen] = useState(false);
  const [mobileInput, setMobileInput] = useState<MobileInput>(EMPTY_INPUT);

  const touchCapable = useMemo(() => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window, []);

  const handleStats = useCallback((next: HudStats) => {
    if (next.driveCameraMode) {
      setDriveCameraMode((current) => (current === next.driveCameraMode ? current : next.driveCameraMode!));
    }
    setStats((current) => {
      if (
        Math.abs(current.speedKmh - next.speedKmh) < 0.1 &&
        Math.abs(current.heading - next.heading) < 0.5 &&
        Math.abs(current.pitch - next.pitch) < 0.5 &&
        Math.abs(current.zoom - next.zoom) < 0.02 &&
        current.driveCameraMode === next.driveCameraMode
      ) {
        return current;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    qualityRef.current = quality;
    if (mapRef.current) add3DBuildings(mapRef.current, quality);
  }, [quality]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = createMap(containerRef.current);
    mapRef.current = map;

    map.on('load', () => {
      add3DBuildings(map, qualityRef.current);
      setStats((current) => ({ ...current, zoom: map.getZoom(), pitch: map.getPitch(), heading: map.getBearing() }));
    });
    map.on('styledata', () => {
      if (map.isStyleLoaded()) add3DBuildings(map, qualityRef.current);
    });
    map.on('move', () => {
      if (modeRef.current !== 'fly') return;
      setStats((current) => ({ ...current, zoom: map.getZoom(), pitch: map.getPitch(), heading: map.getBearing() }));
    });

    walkRef.current = new WalkController(map, {
      onStats: handleStats,
      onPointerLockChange: setPointerLocked
    });
    driveRef.current = new DriveController(map, {
      onStats: handleStats
    });

    const tick = (time: number) => {
      const dt = Math.min(0.05, (time - lastFrameRef.current) / 1000);
      lastFrameRef.current = time;
      if (modeRef.current === 'walk') walkRef.current?.update(dt);
      if (modeRef.current === 'drive') driveRef.current?.update(dt);
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      walkRef.current?.disable();
      driveRef.current?.disable();
      map.remove();
      mapRef.current = null;
    };
  }, [handleStats]);

  useEffect(() => {
    if (!mapRef.current) return;
    walkRef.current?.disable();
    driveRef.current?.disable();
    setPointerLocked(false);
    if (mode === 'walk') walkRef.current?.enable();
    if (mode === 'drive') driveRef.current?.enable();
    if (mode === 'fly') mapRef.current.dragPan.enable();
  }, [mode]);

  useEffect(() => {
    walkRef.current?.setMobileInput(mobileInput);
    driveRef.current?.setMobileInput(mobileInput);
  }, [mobileInput]);

  useEffect(() => {
    driveRef.current?.setSpeedLimitKmh(speedLimitKmh);
  }, [speedLimitKmh]);

  useEffect(() => {
    driveRef.current?.setCameraMode(driveCameraMode);
  }, [driveCameraMode]);

  function selectCity(result: GeocodeResult) {
    setCity(result);
    cityRef.current = result;
    if (mapRef.current) flyToCity(mapRef.current, result);
  }

  function changeStyle(nextId: MapStyleId) {
    const next = MAP_STYLES.find((item) => item.id === nextId);
    if (!next || !mapRef.current) return;
    setStyleId(nextId);
    mapRef.current.setStyle(next.url);
  }

  function resetCamera() {
    if (mapRef.current) resetToCity(mapRef.current, cityRef.current);
  }

  function setModeAndClearInput(next: Mode) {
    setMobileInput(EMPTY_INPUT);
    setMode(next);
  }

  return (
    <main className={`app-shell mode-${mode}`}>
      <div ref={containerRef} className="map-root" />
      <header className="top-bar">
        <div className="brand">
          <span>CityWalk</span>
          <b>Free 3D</b>
        </div>
        <SearchBar onSelect={selectCity} />
        <ModeSelector mode={mode} onChange={setModeAndClearInput} />
      </header>
      <SettingsPanel
        quality={quality}
        onQualityChange={setQuality}
        styles={MAP_STYLES}
        styleId={styleId}
        onStyleChange={changeStyle}
        debug={debug}
        onDebugChange={setDebug}
        mode={mode}
        driveCameraMode={driveCameraMode}
        onDriveCameraModeChange={setDriveCameraMode}
        speedLimitKmh={speedLimitKmh}
        onSpeedLimitChange={setSpeedLimitKmh}
        onReset={resetCamera}
      />
      <Hud
        mode={mode}
        city={city}
        stats={stats}
        quality={quality}
        pointerLocked={pointerLocked}
        debug={debug}
        onShowLimitations={() => setLimitationsOpen(true)}
      />
      <MobileControls
        mode={mode}
        visible={touchCapable}
        input={mobileInput}
        onInput={setMobileInput}
        onToggleCamera={() => setDriveCameraMode((current) => (current === 'chase' ? 'driver' : 'chase'))}
      />
      <LimitationsModal open={limitationsOpen} onClose={() => setLimitationsOpen(false)} />
    </main>
  );
}
