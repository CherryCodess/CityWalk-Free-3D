import { Camera, Gauge, MoveDown, MoveLeft, MoveRight, MoveUp } from 'lucide-react';
import type { MobileInput, Mode } from '../types/modes';

type Props = {
  mode: Mode;
  visible: boolean;
  input: MobileInput;
  onInput: (input: MobileInput) => void;
  onToggleCamera: () => void;
};

function update(input: MobileInput, patch: Partial<MobileInput>): MobileInput {
  return { ...input, ...patch };
}

export function MobileControls({ mode, visible, input, onInput, onToggleCamera }: Props) {
  if (!visible || mode === 'fly') return null;

  if (mode === 'walk') {
    return (
      <div className="mobile-controls">
        <div className="mobile-pad">
          <button onPointerDown={() => onInput(update(input, { moveY: -1 }))} onPointerUp={() => onInput(update(input, { moveY: 0 }))}><MoveUp /></button>
          <button onPointerDown={() => onInput(update(input, { moveX: -1 }))} onPointerUp={() => onInput(update(input, { moveX: 0 }))}><MoveLeft /></button>
          <button onPointerDown={() => onInput(update(input, { moveX: 1 }))} onPointerUp={() => onInput(update(input, { moveX: 0 }))}><MoveRight /></button>
          <button onPointerDown={() => onInput(update(input, { moveY: 1 }))} onPointerUp={() => onInput(update(input, { moveY: 0 }))}><MoveDown /></button>
        </div>
        <div className="mobile-pad look-pad">
          <button onPointerDown={() => onInput(update(input, { lookY: -1 }))} onPointerUp={() => onInput(update(input, { lookY: 0 }))}><MoveUp /></button>
          <button onPointerDown={() => onInput(update(input, { lookX: -1 }))} onPointerUp={() => onInput(update(input, { lookX: 0 }))}><MoveLeft /></button>
          <button onPointerDown={() => onInput(update(input, { lookX: 1 }))} onPointerUp={() => onInput(update(input, { lookX: 0 }))}><MoveRight /></button>
          <button onPointerDown={() => onInput(update(input, { lookY: 1 }))} onPointerUp={() => onInput(update(input, { lookY: 0 }))}><MoveDown /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-controls">
      <div className="mobile-pad">
        <button onPointerDown={() => onInput(update(input, { steer: -1 }))} onPointerUp={() => onInput(update(input, { steer: 0 }))}><MoveLeft /></button>
        <button onPointerDown={() => onInput(update(input, { steer: 1 }))} onPointerUp={() => onInput(update(input, { steer: 0 }))}><MoveRight /></button>
      </div>
      <div className="drive-buttons">
        <button onPointerDown={() => onInput(update(input, { accelerate: true }))} onPointerUp={() => onInput(update(input, { accelerate: false }))}><Gauge /> Gas</button>
        <button onPointerDown={() => onInput(update(input, { brake: true }))} onPointerUp={() => onInput(update(input, { brake: false }))}>Brake</button>
        <button onClick={onToggleCamera}><Camera /> Camera</button>
      </div>
    </div>
  );
}
