import { useMemo, useState } from 'react';

type Sample = { t: Date; altitude: number };

export type PlanetTrack = {
  key: string;
  name: string;
  color: string;
  track: Sample[];
};

type Props = {
  dayStart: Date;
  sun: Sample[];
  moon: Sample[];
  planets: PlanetTrack[];
  now: Date;
};

const WIDTH = 640;
const HEIGHT = 220;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;
const ALT_MIN = -30;
const ALT_MAX = 90;

function buildPath(samples: Sample[], dayStart: Date): string {
  if (samples.length === 0) return '';
  const dayMs = 24 * 3600_000;
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;
  return samples
    .map((s, i) => {
      const hours = (s.t.getTime() - dayStart.getTime()) / dayMs;
      const x = PAD_L + hours * innerW;
      const norm = (s.altitude - ALT_MIN) / (ALT_MAX - ALT_MIN);
      const y = PAD_T + (1 - Math.max(0, Math.min(1, norm))) * innerH;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function altitudeY(alt: number): number {
  const innerH = HEIGHT - PAD_T - PAD_B;
  const norm = (alt - ALT_MIN) / (ALT_MAX - ALT_MIN);
  return PAD_T + (1 - Math.max(0, Math.min(1, norm))) * innerH;
}

function hourX(hour: number): number {
  const innerW = WIDTH - PAD_L - PAD_R;
  return PAD_L + (hour / 24) * innerW;
}

export default function AltitudeChart({ dayStart, sun, moon, planets, now }: Props) {
  // Default: show only planets that cross the horizon at some point today
  const defaultVisible = useMemo(
    () => new Set(planets.filter((p) => p.track.some((s) => s.altitude > 0)).map((p) => p.key)),
    [planets],
  );
  const [visible, setVisible] = useState<Set<string>>(defaultVisible);

  const toggle = (key: string) =>
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const { sunPath, moonPath, horizonY, nowX, planetPaths } = useMemo(() => {
    const dayMs = 24 * 3600_000;
    const nowHours = (now.getTime() - dayStart.getTime()) / dayMs;
    return {
      sunPath: buildPath(sun, dayStart),
      moonPath: buildPath(moon, dayStart),
      horizonY: altitudeY(0),
      nowX: nowHours >= 0 && nowHours <= 1 ? hourX(nowHours * 24) : null,
      planetPaths: planets.map((p) => ({ key: p.key, path: buildPath(p.track, dayStart) })),
    };
  }, [sun, moon, planets, dayStart, now]);

  const hourTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const altTicks = [-30, 0, 30, 60, 90];

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0a0f1a]/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">Traiettoria oggi</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {/* Fixed: Sun + Moon */}
          <span className="flex items-center gap-1.5 text-night-300">
            <span className="inline-block size-2 rounded-full bg-sun" />
            Sole
          </span>
          <span className="flex items-center gap-1.5 text-night-300">
            <span className="inline-block size-2 rounded-full bg-moon" />
            Luna
          </span>
          {/* Toggleable planets */}
          {planets.map((p) => (
            <button
              key={p.key}
              onClick={() => toggle(p.key)}
              className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors ${
                visible.has(p.key)
                  ? 'text-slate-200'
                  : 'text-night-600 line-through'
              }`}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Altitudine di Sole, Luna e pianeti nelle 24 ore"
      >
        {altTicks.map((alt) => {
          const y = altitudeY(alt);
          return (
            <g key={alt}>
              <line
                x1={PAD_L} x2={WIDTH - PAD_R} y1={y} y2={y}
                stroke={alt === 0 ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.12)'}
                strokeDasharray={alt === 0 ? undefined : '2,4'}
              />
              <text x={PAD_L - 6} y={y + 3} textAnchor="end" className="fill-night-300" fontSize={10}>
                {alt}°
              </text>
            </g>
          );
        })}

        {hourTicks.map((h) => {
          const x = hourX(h);
          return (
            <g key={h}>
              <line x1={x} x2={x} y1={PAD_T} y2={HEIGHT - PAD_B} stroke="rgba(148,163,184,0.08)" />
              <text x={x} y={HEIGHT - PAD_B + 14} textAnchor="middle" className="fill-night-300" fontSize={10}>
                {h.toString().padStart(2, '0')}
              </text>
            </g>
          );
        })}

        {/* Below-horizon fill */}
        <rect
          x={PAD_L} y={horizonY}
          width={WIDTH - PAD_L - PAD_R}
          height={HEIGHT - PAD_B - horizonY}
          fill="rgba(15,23,42,0.6)"
        />

        {/* Planet lines (behind sun/moon) */}
        {planetPaths.map(({ key, path }) => {
          const p = planets.find((pl) => pl.key === key)!;
          if (!visible.has(key)) return null;
          return (
            <path key={key} d={path} fill="none" stroke={p.color} strokeWidth={1.3} opacity={0.75} />
          );
        })}

        <path d={moonPath} fill="none" stroke="#e2e8f0" strokeWidth={1.6} opacity={0.85} />
        <path d={sunPath} fill="none" stroke="#fbbf24" strokeWidth={1.8} />

        {nowX !== null && (
          <g>
            <line
              x1={nowX} x2={nowX} y1={PAD_T} y2={HEIGHT - PAD_B}
              stroke="rgba(251,191,36,0.55)" strokeDasharray="3,3"
            />
            <text x={nowX} y={PAD_T - 3} textAnchor="middle" className="fill-amber-200" fontSize={9}>
              ora
            </text>
          </g>
        )}
      </svg>
    </section>
  );
}
