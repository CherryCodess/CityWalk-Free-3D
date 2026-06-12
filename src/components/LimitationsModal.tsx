type Props = {
  open: boolean;
  onClose: () => void;
};

export function LimitationsModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="limitations-title" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="limitations-title">Free open-data limitations</h2>
        <p>This app uses free and open map data, mainly OpenStreetMap-derived vector tiles rendered with MapLibre GL JS.</p>
        <p>It does not use paid photorealistic 3D scans. Building heights, shapes, labels, parks, water, and road detail depend on what exists in OpenStreetMap and the selected free tile style.</p>
        <p>Walk and drive modes are immersive camera simulations over open map data. The MVP does not include perfect collision detection, road snapping, indoor navigation, or guaranteed street-level accuracy.</p>
        <button onClick={onClose}>Close</button>
      </section>
    </div>
  );
}
