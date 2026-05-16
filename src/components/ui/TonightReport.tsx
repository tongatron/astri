import type { PlanetTrack } from './AltitudeChart';
import type { MoonState } from '@/core/astronomy/moon';
import { formatTime } from '@/core/time/format';
import { formatAngle, formatPercent } from '@/core/astronomy/format';

type Sample = { t: Date; altitude: number };

type BodyResult = {
  key: string;
  name: string;
  color: string;
  windowStart: Date | null;
  windowEnd: Date | null;
  peakAlt: number;
  peakTime: Date | null;
  durationMin: number;
  score: number;
  instrument: string;
  note: string;
};

const PLANET_NOTES: Record<string, string> = {
  mercury: 'Vicino all\'orizzonte, finestra breve',
  venus: 'Luminosissima, fasi visibili col binocolo',
  mars: 'Colore rossastro a occhio nudo',
  jupiter: 'Bande e lune galileiane col binocolo',
  saturn: 'Anelli visibili già a 30×',
  uranus: 'Verde pallido, binocolo o telescopio',
  neptune: 'Solo telescopio, mappa stellare utile',
};

function computeBody(
  key: string,
  name: string,
  color: string,
  track: Sample[],
  nightSamples: Sample[],
  moonIllum: number,
  instrument: string,
): BodyResult {
  const nightTimes = new Set(nightSamples.map((s) => s.t.getTime()));
  const visible = track.filter(
    (s) => nightTimes.has(s.t.getTime()) && s.altitude > 10,
  );

  if (visible.length === 0) {
    return {
      key, name, color,
      windowStart: null, windowEnd: null,
      peakAlt: 0, peakTime: null, durationMin: 0, score: 0,
      instrument, note: PLANET_NOTES[key] ?? '',
    };
  }

  const best = visible.reduce((a, b) => (b.altitude > a.altitude ? b : a));
  const durationMin = visible.length * 20;
  const altScore = Math.min(50, (best.altitude / 90) * 50);
  const durScore = Math.min(30, (durationMin / 360) * 30);
  const moonPenalty = key === 'moon' ? 0 : moonIllum * 20;
  const score = Math.round(altScore + durScore - moonPenalty);

  return {
    key, name, color,
    windowStart: visible[0].t,
    windowEnd: visible[visible.length - 1].t,
    peakAlt: best.altitude,
    peakTime: best.t,
    durationMin,
    score: Math.max(0, score),
    instrument, note: PLANET_NOTES[key] ?? '',
  };
}

function formatDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function QualityPill({ score }: { score: number }) {
  if (score >= 65)
    return <span className="rounded-full bg-emerald-900/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Ottima</span>;
  if (score >= 40)
    return <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-[10px] font-semibold text-sky-300">Buona</span>;
  return <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Discreta</span>;
}

type Props = {
  sunTrack: Sample[];
  moonTrack: Sample[];
  moon: MoonState;
  planets: PlanetTrack[];
  planetInstruments: Record<string, string>;
};

export default function TonightReport({ sunTrack, moonTrack, moon, planets, planetInstruments }: Props) {
  // Nautical night: sun < -12°
  const nightSamples = sunTrack.filter((s) => s.altitude < -12);

  if (nightSamples.length === 0) {
    return (
      <section className="rounded-lg border border-night-800/80 bg-[#07090f]/80 p-4">
        <h3 className="text-sm font-semibold text-slate-50">Questa notte</h3>
        <p className="mt-3 text-sm text-night-300">
          Nessuna oscurità astronomica nelle prossime 24 ore (latitudine alta o estate).
        </p>
      </section>
    );
  }

  const nightStart = nightSamples[0].t;
  const nightEnd = nightSamples[nightSamples.length - 1].t;
  const nightDurMin = nightSamples.length * 20;

  const moonResult = computeBody(
    'moon', 'Luna', '#e2e8f0', moonTrack, nightSamples, moon.illumination, 'occhio nudo',
  );

  const results: BodyResult[] = [
    moonResult,
    ...planets.map((p) =>
      computeBody(p.key, p.name, p.color, p.track, nightSamples, moon.illumination, planetInstruments[p.key] ?? 'occhio nudo'),
    ),
  ]
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#07090f]/80 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">Questa notte</h3>
        <div className="flex items-center gap-3 text-xs text-night-300">
          <span>
            Oscurità:{' '}
            <span className="font-semibold text-slate-200">
              {formatTime(nightStart)} → {formatTime(nightEnd)}
            </span>
          </span>
          <span className="text-night-600">·</span>
          <span>{formatDur(nightDurMin)}</span>
          <span className="text-night-600">·</span>
          <span>Luna {formatPercent(moon.illumination)}</span>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="mt-4 text-sm text-night-300">
          Nessun oggetto raggiunge i 10° durante la notte.
        </p>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {results.map((r) => (
            <div
              key={r.key}
              className="flex w-36 shrink-0 flex-col gap-2 rounded-lg border border-night-800/70 bg-night-950/50 p-3"
            >
              {/* Name + dot */}
              <div className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-sm font-semibold text-slate-100 truncate">{r.name}</span>
              </div>

              {/* Window */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-night-400">Finestra</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-200">
                  {formatTime(r.windowStart!)} – {formatTime(r.windowEnd!)}
                </div>
                <div className="mt-0.5 text-[10px] text-night-400">{formatDur(r.durationMin)}</div>
              </div>

              {/* Peak */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-night-400">Picco</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-200">
                  {formatAngle(r.peakAlt)} {r.peakTime ? `· ${formatTime(r.peakTime)}` : ''}
                </div>
              </div>

              {/* Quality + instrument */}
              <div className="mt-auto flex flex-col gap-1.5">
                <QualityPill score={r.score} />
                <span className="text-[10px] text-night-400">{r.instrument}</span>
              </div>

              {/* Note */}
              {r.note && (
                <p className="text-[10px] leading-relaxed text-night-500">{r.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
