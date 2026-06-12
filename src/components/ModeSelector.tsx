import type { Mode } from '../types/modes';

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

const modes: Mode[] = ['fly', 'walk', 'drive'];

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="mode-selector" aria-label="Mode selector">
      {modes.map((item) => (
        <button key={item} className={mode === item ? 'active' : ''} onClick={() => onChange(item)}>
          {item[0].toUpperCase() + item.slice(1)}
        </button>
      ))}
    </div>
  );
}
