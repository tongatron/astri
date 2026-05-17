import { useState } from 'react';
import type { PlanetTrack } from './AltitudeChart';
import type { MoonState } from '@/core/astronomy/moon';
import { formatTime } from '@/core/time/format';
import { formatAngle, formatPercent } from '@/core/astronomy/format';
import {
  cloudLabel,
  meanCloudCover,
  type WeatherSample,
} from '@/core/weather/openmeteo';
import type { BortleEstimate } from '@/core/light-pollution/bortle';
import { bortlePenalty } from '@/core/light-pollution/bortle';

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
  cloud: number | null;
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
  weather: WeatherSample[] | null,
  bortleCls: number | null,
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
      cloud: null,
      instrument, note: PLANET_NOTES[key] ?? '',
    };
  }

  // Samples are spaced 20 min apart and represent the *start* of a 20 min slot.
  // The actual end of the window is one slot after the last visible sample.
  const SAMPLE_MIN = 20;
  const windowStart = visible[0].t;
  const windowEnd = new Date(visible[visible.length - 1].t.getTime() + SAMPLE_MIN * 60_000);
  const best = visible.reduce((a, b) => (b.altitude > a.altitude ? b : a));
  const durationMin = visible.length * SAMPLE_MIN;
  const altScore = Math.min(50, (best.altitude / 90) * 50);
  const durScore = Math.min(30, (durationMin / 360) * 30);
  const moonPenalty = key === 'moon' ? 0 : moonIllum * 20;
  const cloud =
    weather && weather.length > 0
      ? meanCloudCover(weather, windowStart, windowEnd)
      : null;
  const cloudPenalty = cloud === null ? 0 : (cloud / 100) * 30;
  // Light pollution penalty is dimmed for bright targets (Moon, Venus, Jupiter)
  // which remain easily visible under heavy skyglow.
  const lpAttenuation = key === 'moon' || key === 'venus' || key === 'jupiter' ? 0.2 : 1;
  const lpPenalty = bortleCls === null ? 0 : bortlePenalty(bortleCls) * lpAttenuation;
  const score = Math.round(altScore + durScore - moonPenalty - cloudPenalty - lpPenalty);

  return {
    key, name, color,
    windowStart,
    windowEnd,
    peakAlt: best.altitude,
    peakTime: best.t,
    durationMin,
    score: Math.max(0, score),
    cloud,
    instrument, note: PLANET_NOTES[key] ?? '',
  };
}

function formatDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function bortleChipTone(cls: number): string {
  if (cls <= 2) return 'border-emerald-700/60 bg-emerald-900/40 text-emerald-200';
  if (cls <= 4) return 'border-sky-700/60 bg-sky-900/40 text-sky-200';
  if (cls <= 6) return 'border-amber-700/60 bg-amber-900/40 text-amber-200';
  return 'border-rose-700/60 bg-rose-900/40 text-rose-200';
}

function QualityPill({ score }: { score: number }) {
  if (score >= 65)
    return <span className="rounded-full bg-emerald-900/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Ottima</span>;
  if (score >= 40)
    return <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-[10px] font-semibold text-sky-300">Buona</span>;
  return <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Discreta</span>;
}

type WeatherStatus =
  | { status: 'idle' | 'loading' | 'error'; samples?: undefined }
  | { status: 'ready'; samples: WeatherSample[] };

type Props = {
  sunTrack: Sample[];
  moonTrack: Sample[];
  moon: MoonState;
  planets: PlanetTrack[];
  planetInstruments: Record<string, string>;
  weather?: WeatherStatus;
  bortle?: BortleEstimate | null;
};

function CloudBadge({ cloud }: { cloud: number | null }) {
  if (cloud === null) return null;
  const tone =
    cloud < 15
      ? 'text-emerald-300'
      : cloud < 40
        ? 'text-sky-300'
        : cloud < 70
          ? 'text-amber-300'
          : 'text-rose-300';
  return (
    <span className={`text-[10px] ${tone}`}>
      ☁ {Math.round(cloud)}% · {cloudLabel(cloud)}
    </span>
  );
}

export default function TonightReport({
  sunTrack,
  moonTrack,
  moon,
  planets,
  planetInstruments,
  weather,
  bortle,
}: Props) {
  const bortleCls = bortle?.class ?? null;
  const [bortleOpen, setBortleOpen] = useState(false);
  const weatherSamples =
    weather && weather.status === 'ready' ? weather.samples : null;
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
    'moon', 'Luna', '#e2e8f0', moonTrack, nightSamples, moon.illumination, 'occhio nudo', weatherSamples, bortleCls,
  );

  const results: BodyResult[] = [
    moonResult,
    ...planets.map((p) =>
      computeBody(p.key, p.name, p.color, p.track, nightSamples, moon.illumination, planetInstruments[p.key] ?? 'occhio nudo', weatherSamples, bortleCls),
    ),
  ]
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const nightCloud = weatherSamples
    ? meanCloudCover(weatherSamples, nightStart, nightEnd)
    : null;

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
          {nightCloud !== null && (
            <>
              <span className="text-night-600">·</span>
              <span>
                ☁ {Math.round(nightCloud)}% · {cloudLabel(nightCloud)}
              </span>
            </>
          )}
          {bortle && (
            <>
              <span className="text-night-600">·</span>
              <button
                type="button"
                onClick={() => setBortleOpen(true)}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition hover:brightness-125 ${bortleChipTone(bortle.class)}`}
                title="Clicca per la legenda della scala Bortle"
              >
                Bortle {bortle.class}
              </button>
            </>
          )}
          {weather?.status === 'loading' && (
            <>
              <span className="text-night-600">·</span>
              <span className="text-night-400">meteo…</span>
            </>
          )}
          {weather?.status === 'error' && (
            <>
              <span className="text-night-600">·</span>
              <span className="text-amber-400" title="Meteo non disponibile">
                meteo n/d
              </span>
            </>
          )}
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
                <CloudBadge cloud={r.cloud} />
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
      {bortleOpen && bortle && (
        <BortleLegend current={bortle.class} bortle={bortle} onClose={() => setBortleOpen(false)} />
      )}
    </section>
  );
}

function BortleLegend({
  current,
  bortle,
  onClose,
}: {
  current: number;
  bortle: BortleEstimate;
  onClose: () => void;
}) {
  const rows: { cls: number; label: string; desc: string }[] = [
    { cls: 1, label: 'Cielo eccellente', desc: 'Via Lattea ricca di dettagli, luminescenza zodiacale visibile.' },
    { cls: 2, label: 'Cielo tipico rurale', desc: 'Via Lattea molto strutturata, M31 nettamente visibile.' },
    { cls: 3, label: 'Cielo rurale', desc: 'Via Lattea ben visibile, alone galattico evidente.' },
    { cls: 4, label: 'Transizione rurale-suburbano', desc: 'Via Lattea ancora visibile, struttura ridotta verso l\'orizzonte.' },
    { cls: 5, label: 'Cielo suburbano', desc: 'Via Lattea debole allo zenit, perde dettaglio sotto i 30°.' },
    { cls: 6, label: 'Suburbano luminoso', desc: 'Via Lattea appena percettibile, cielo grigio chiaro.' },
    { cls: 7, label: 'Transizione suburbano-urbano', desc: 'Cielo perennemente illuminato, Via Lattea non visibile.' },
    { cls: 8, label: 'Cielo urbano', desc: 'Solo pianeti e stelle più brillanti.' },
    { cls: 9, label: 'Centro città', desc: 'Cielo arancione, poche stelle visibili anche allo zenit.' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-night-700 bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Scala Bortle</h2>
            <p className="mt-1 text-xs text-night-400">
              Misura della qualità del cielo notturno in 9 classi (1 = eccellente, 9 = centro città).
              {bortle.nearest && (
                <> Stima basata su {bortle.nearest.name} a {bortle.nearest.km} km.</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-night-700 px-2 py-0.5 text-xs text-night-300 hover:bg-night-800"
          >
            ✕
          </button>
        </div>

        <ul className="mt-4 space-y-1.5">
          {rows.map((r) => {
            const active = r.cls === current;
            return (
              <li
                key={r.cls}
                className={`flex items-start gap-3 rounded-lg border p-2.5 text-xs ${
                  active
                    ? `${bortleChipTone(r.cls)} ring-1 ring-inset ring-current/30`
                    : 'border-night-800/70 bg-night-950/40 text-night-300'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? 'bg-current/20' : 'bg-night-800 text-night-300'
                  }`}
                >
                  {r.cls}
                </span>
                <div>
                  <div className={`font-semibold ${active ? '' : 'text-slate-200'}`}>{r.label}</div>
                  <div className={`mt-0.5 ${active ? 'opacity-80' : 'text-night-400'}`}>{r.desc}</div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-[11px] leading-relaxed text-night-500">
          Stima approssimata basata su distanza e popolazione delle principali città. Non sostituisce
          una misura SQM in loco o le mappe satellitari VIIRS/Falchi.
        </p>
      </div>
    </div>
  );
}
