import { useEffect } from 'react';
import { useStore } from '@/state/store';
import { useDisplayTime } from '@/state/useDisplayTime';
import { formatDateTime, formatOffset, formatSpeed } from '@/core/time/format';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const STEPS: { label: string; ms: number }[] = [
  { label: '−1g', ms: -86_400_000 },
  { label: '−1h', ms: -3_600_000 },
  { label: '−1m', ms: -60_000 },
  { label: '+1m', ms: 60_000 },
  { label: '+1h', ms: 3_600_000 },
  { label: '+1g', ms: 86_400_000 },
];

const SPEEDS = [1, 60, 600, 3600, 86400, 604800];

export default function TimeControls() {
  const timeMode = useStore((s) => s.timeMode);
  const isPlaying = useStore((s) => s.isPlaying);
  const speed = useStore((s) => s.speed);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const setSpeed = useStore((s) => s.setSpeed);
  const setSimulatedTime = useStore((s) => s.setSimulatedTime);
  const step = useStore((s) => s.step);
  const resetToNow = useStore((s) => s.resetToNow);

  const displayed = useDisplayTime();
  const realNow = Date.now();
  const offset = displayed.getTime() - realNow;
  const sliderValue = Math.max(-ONE_YEAR_MS, Math.min(ONE_YEAR_MS, offset));

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSimulatedTime(Date.now() + v);
  };

  const togglePlay = () => {
    if (timeMode === 'real') setSimulatedTime(displayed.getTime());
    setIsPlaying(!isPlaying);
  };

  // Keyboard shortcuts:
  //   ← / →            ± 1 hour
  //   Shift + ← / →    ± 1 day
  //   Space            play / pause
  //   N                back to real time
  // Ignored while typing in an input/textarea/contenteditable.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (target.isContentEditable) return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          step(e.shiftKey ? -86_400_000 : -3_600_000);
          break;
        case 'ArrowRight':
          e.preventDefault();
          step(e.shiftKey ? 86_400_000 : 3_600_000);
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          togglePlay();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          resetToNow();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // togglePlay closes over `displayed`/`isPlaying`/`timeMode`; we want a
    // fresh handler on each render so it reads the current store values.
  });

  return (
    <div className="border-t border-night-800/60 bg-night-950/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-100">
              {formatDateTime(displayed)}
            </span>
            {timeMode === 'simulated' && (
              <span className="rounded-full bg-night-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-night-200">
                Simulato {formatOffset(offset)}
              </span>
            )}
          </div>
          <button
            onClick={resetToNow}
            disabled={timeMode === 'real'}
            title="Torna a ora reale (N)"
            className="rounded-md border border-night-700 px-2 py-1 text-[11px] transition hover:bg-night-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Ora reale
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="size-8 shrink-0 rounded-full border border-night-700 bg-night-800 text-sm transition hover:bg-night-700"
            aria-label={isPlaying ? 'Pausa' : 'Play'}
            title={`${isPlaying ? 'Pausa' : 'Play'} (Spazio)`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <input
            type="range"
            min={-ONE_YEAR_MS}
            max={ONE_YEAR_MS}
            step={60_000}
            value={sliderValue}
            onChange={onSlider}
            className="flex-1 accent-sun"
          />
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-md border border-night-700 bg-night-900 px-2 py-1 text-xs"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {formatSpeed(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {STEPS.map((s) => (
            <button
              key={s.label}
              onClick={() => step(s.ms)}
              className="rounded-md border border-night-800 bg-night-900/60 px-2 py-1 text-[11px] text-night-200 transition hover:bg-night-800"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
