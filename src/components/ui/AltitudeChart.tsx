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
const WINDOW_H = 24;      // total hours shown
const BEFORE_H = 3;       // hours before "now" on the left

function altitudeY(alt: number): number {
  const innerH = HEIGHT - PAD_T - PAD_B;
  const norm = (alt - ALT_MIN) / (ALT_MAX - ALT_MIN);
  return PAD_T + (1 - Math.max(0, Math.min(1, norm))) * innerH;
}

function timeX(t: Date, windowStart: Date): number {
  const innerW = WIDTH - PAD_L - PAD_R;
  const hours = (t.getTime() - windowStart.getTime()) / 3_600_000;
  return PAD_L + (hours / WINDOW_H) * innerW;
}

function buildPath(samples: Sample[], windowStart: Date): string {
  if (samples.length === 0) return '';
  return samples
    .map((s, i) => {
      const x = timeX(s.t, windowStart);
      const y = altitudeY(s.altitude);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function AltitudeChart({ sun, moon, planets, now }: Props) {
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

  const { windowStart, sunPath, moonPath, horizonY, nowX, planetPaths, hourTicks } = useMemo(() => {
    const wStart = new Date(now.getTime() - BEFORE_H * 3_600_000);
    const wEnd   = new Date(wStart.getTime() + WINDOW_H * 3_600_000);

    // Generate hour ticks at every 3h boundary within the window
    const firstTickMs =
      Math.ceil(wStart.getTime() / (3 * 3_600_000)) * (3 * 3_600_000);
    const ticks: Date[] = [];
    for (let ms = firstTickMs; ms <= wEnd.getTime(); ms += 3 * 3_600_000) {
      ticks.push(new Date(ms));
    }

    const nowXVal = timeX(now, wStart);

    return {
      windowStart: wStart,
      sunPath: buildPath(sun, wStart),
      moonPath: buildPath(moon, wStart),
      horizonY: altitudeY(0),
      nowX: nowXVal,
      planetPaths: planets.map((p) => ({ key: p.key, path: buildPath(p.track, wStart) })),
      hourTicks: ticks,
    };
  }, [sun, moon, planets, now]);

  const altTicks = [-30, 0, 30, 60, 90];
  const innerW = WIDTH - PAD_L - PAD_R;

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0a0f1a]/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">Traiettoria oggi</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1.5 text-night-300">
            <span className="inline-block size-2 rounded-full bg-sun" />
            Sole
          </span>
          <span className="flex items-center gap-1.5 text-night-300">
            <span className="inline-block size-2 rounded-full bg-moon" />
            Luna
          </span>
          {planets.map((p) => (
            <button
              key={p.key}
              onClick={() => toggle(p.key)}
              className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors ${
                visible.has(p.key) ? 'text-slate-200' : 'text-night-600 line-through'
              }`}
            >
              <span className="inline-block size-2 rounded-full" style={{ backgroundColor: p.color }} />
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
        {/* Altitude grid */}
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

        {/* Hour ticks */}
        {hourTicks.map((t) => {
          const x = timeX(t, windowStart);
          const hh = t.getHours().toString().padStart(2, '0');
          return (
            <g key={t.getTime()}>
              <line x1={x} x2={x} y1={PAD_T} y2={HEIGHT - PAD_B} stroke="rgba(148,163,184,0.08)" />
              <text x={x} y={HEIGHT - PAD_B + 14} textAnchor="middle" className="fill-night-300" fontSize={10}>
                {hh}
              </text>
            </g>
          );
        })}

        {/* Shaded "past" region (left of now) */}
        <rect
          x={PAD_L} y={PAD_T}
          width={nowX - PAD_L}
          height={HEIGHT - PAD_T - PAD_B}
          fill="rgba(0,0,0,0.18)"
        />

        {/* Below-horizon fill */}
        <rect
          x={PAD_L} y={horizonY}
          width={innerW}
          height={HEIGHT - PAD_B - horizonY}
          fill="rgba(15,23,42,0.55)"
        />

        {/* Planet lines */}
        {planetPaths.map(({ key, path }) => {
          const p = planets.find((pl) => pl.key === key)!;
          if (!visible.has(key)) return null;
          return <path key={key} d={path} fill="none" stroke={p.color} strokeWidth={1.3} opacity={0.75} />;
        })}

        <path d={moonPath} fill="none" stroke="#e2e8f0" strokeWidth={1.6} opacity={0.85} />
        <path d={sunPath}  fill="none" stroke="#fbbf24" strokeWidth={1.8} />

        {/* Now line — always at BEFORE_H/WINDOW_H from left */}
        <g>
          <line
            x1={nowX} x2={nowX} y1={PAD_T} y2={HEIGHT - PAD_B}
            stroke="rgba(251,191,36,0.8)" strokeWidth={1.2} strokeDasharray="3,3"
          />
          <text x={nowX} y={PAD_T - 3} textAnchor="middle" className="fill-amber-200" fontSize={9}>
            ora
          </text>
        </g>
      </svg>
    </section>
  );
}
