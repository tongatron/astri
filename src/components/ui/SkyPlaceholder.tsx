import { useMemo } from 'react';
import { useStore } from '@/state/store';
import { useDisplayTime } from '@/state/useDisplayTime';
import { formatDateTime } from '@/core/time/format';

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function SkyPlaceholder() {
  const location = useStore((s) => s.location);
  const displayed = useDisplayTime();

  const stars = useMemo(() => {
    const rand = seeded(42);
    return Array.from({ length: 220 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.4 + 0.2,
      o: rand() * 0.7 + 0.3,
    }));
  }, []);

  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill="var(--color-star)"
            opacity={s.o}
          />
        ))}
      </svg>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-100">
          {location ? `Cielo di ${location.name}` : 'Hello, sky.'}
        </h2>
        <p className="max-w-md text-sm text-night-300">
          {location
            ? 'Tappa 1 completata: posizione e tempo collegati. La prossima tappa porta Sole e Luna.'
            : 'Imposta una posizione dall’header per iniziare. Userai Geolocation o ricerca città.'}
        </p>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-night-800 bg-night-900/40 px-4 py-3 text-xs text-night-200">
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-night-400">
              Posizione
            </div>
            <div className="mt-1 font-medium">
              {location ? location.name : '—'}
            </div>
            {location && (
              <div className="text-[11px] text-night-400">
                {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-night-400">
              Tempo
            </div>
            <div className="mt-1 font-medium">{formatDateTime(displayed)}</div>
            <div className="text-[11px] text-night-400">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
