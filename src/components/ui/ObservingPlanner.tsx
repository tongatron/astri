import { useMemo, useState } from 'react';
import * as A from 'astronomy-engine';
import { planObservingWindows, type NightlyWindow } from '@/core/astronomy/observing-planner';
import { exportICS } from '@/core/astronomy/ics';
import { toObserver } from '@/core/astronomy/observer';
import { useStore } from '@/state/store';
import { useQuantizedDisplayTime } from '@/state/useDisplayTime';
import { formatTime } from '@/core/time/format';
import { formatAngle, formatPercent } from '@/core/astronomy/format';

const PLANETS: { key: string; name: string; body: A.Body }[] = [
  { key: 'mercury', name: 'Mercurio', body: A.Body.Mercury },
  { key: 'venus', name: 'Venere', body: A.Body.Venus },
  { key: 'mars', name: 'Marte', body: A.Body.Mars },
  { key: 'jupiter', name: 'Giove', body: A.Body.Jupiter },
  { key: 'saturn', name: 'Saturno', body: A.Body.Saturn },
  { key: 'uranus', name: 'Urano', body: A.Body.Uranus },
  { key: 'neptune', name: 'Nettuno', body: A.Body.Neptune },
];

const DAY_OPTIONS = [14, 30, 60] as const;

function scoreBadge(score: number) {
  if (score >= 75)
    return (
      <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        Ottima
      </span>
    );
  if (score >= 50)
    return (
      <span className="rounded-full bg-sky-900/60 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
        Buona
      </span>
    );
  if (score >= 25)
    return (
      <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
        Discreta
      </span>
    );
  return (
    <span className="rounded-full bg-night-800 px-2 py-0.5 text-[10px] font-semibold text-night-300">
      Scarsa
    </span>
  );
}

function moonIcon(illumination: number): string {
  const pct = illumination;
  if (pct < 0.06) return '🌑';
  if (pct < 0.25) return '🌒';
  if (pct < 0.5) return '🌓';
  if (pct < 0.75) return '🌔';
  if (pct < 0.94) return '🌕';
  return '🌕';
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'bg-emerald-400'
      : score >= 50
        ? 'bg-sky-400'
        : score >= 25
          ? 'bg-amber-400'
          : 'bg-night-600';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-night-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function formatWindowDuration(start: Date, end: Date): string {
  const min = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

type RowProps = { w: NightlyWindow; isTop: boolean };

function NightRow({ w, isTop }: RowProps) {
  const hasWindow = w.windowStart !== null && w.windowEnd !== null;
  return (
    <tr
      className={`border-t border-night-800/60 transition-colors ${
        isTop
          ? 'bg-emerald-950/30'
          : hasWindow
            ? 'hover:bg-night-900/40'
            : 'opacity-40'
      }`}
    >
      <td className="py-2.5 pl-3 pr-2 text-left">
        <span className="text-sm text-slate-100">{formatShortDate(w.date)}</span>
        {isTop && (
          <span className="ml-2 rounded bg-emerald-800/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
            migliore
          </span>
        )}
      </td>
      <td className="px-2 py-2.5 text-sm text-slate-200">
        {hasWindow
          ? `${formatTime(w.windowStart!)} – ${formatTime(w.windowEnd!)}`
          : '—'}
      </td>
      <td className="px-2 py-2.5 text-sm text-slate-200">
        {hasWindow ? formatWindowDuration(w.windowStart!, w.windowEnd!) : '—'}
      </td>
      <td className="px-2 py-2.5">
        {hasWindow ? (
          <span className="text-sm font-semibold text-slate-100">
            {formatAngle(w.peakAltitude)}
          </span>
        ) : (
          <span className="text-sm text-night-500">—</span>
        )}
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs" title={`Luna: ${formatPercent(w.moonIllumination)}`}>
            {moonIcon(w.moonIllumination)}
          </span>
          <span className="text-xs text-night-300">{formatPercent(w.moonIllumination)}</span>
        </div>
      </td>
      <td className="px-2 py-2.5">
        {hasWindow ? (
          <div className="flex min-w-[72px] flex-col gap-1">
            <ScoreBar score={w.score} />
            {scoreBadge(w.score)}
          </div>
        ) : (
          <span className="text-xs text-night-500">Non visibile</span>
        )}
      </td>
    </tr>
  );
}

export default function ObservingPlanner() {
  const location = useStore((s) => s.location);
  // Planner spans days; 15-min refresh is more than enough.
  const displayed = useQuantizedDisplayTime(15 * 60_000);
  const [selectedPlanet, setSelectedPlanet] = useState(PLANETS[4]); // Saturno default
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(30);

  const windows = useMemo(() => {
    if (!location) return [];
    const observer = toObserver(location);
    const from = new Date(displayed);
    from.setHours(0, 0, 0, 0);
    return planObservingWindows(selectedPlanet.body, observer, from, days);
  }, [location, displayed, selectedPlanet, days]);

  const topScore = useMemo(
    () => (windows.length > 0 ? Math.max(...windows.map((w) => w.score)) : 0),
    [windows],
  );

  const visibleNights = windows.filter((w) => w.windowStart !== null).length;

  function handleExport() {
    if (!location) return;
    exportICS(windows, selectedPlanet.name, location.name);
  }

  if (!location) return null;

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#080e14]/80 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">
            Quando osservare dal tuo balcone
          </h3>
          <p className="mt-1 text-xs text-night-300">
            Finestre notturne utili (sole &lt; −12°, pianeta &gt; 15°) · {location.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Planet selector */}
          <select
            value={selectedPlanet.key}
            onChange={(e) =>
              setSelectedPlanet(PLANETS.find((p) => p.key === e.target.value)!)
            }
            className="rounded-md border border-night-700 bg-night-900 px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {PLANETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Days selector */}
          <div className="flex overflow-hidden rounded-md border border-night-700">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === d
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-night-900 text-night-300 hover:bg-night-800'
                }`}
              >
                {d}g
              </button>
            ))}
          </div>

          {/* ICS export */}
          <button
            onClick={handleExport}
            disabled={visibleNights === 0}
            className="flex items-center gap-1.5 rounded-md border border-night-700 bg-night-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-emerald-700 hover:bg-emerald-900/40 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
            title="Esporta tutte le notti utili come file .ics"
          >
            <svg
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Aggiungi a calendario
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mt-4 flex flex-wrap gap-4 rounded-md border border-night-800/60 bg-night-950/40 px-4 py-3 text-xs">
        <div>
          <span className="text-night-300">Notti utili</span>
          <span className="ml-2 font-semibold text-slate-100">
            {visibleNights} / {days}
          </span>
        </div>
        <div>
          <span className="text-night-300">Migliore punteggio</span>
          <span className="ml-2 font-semibold text-slate-100">{topScore}/100</span>
        </div>
        <div>
          <span className="text-night-300">Pianeta</span>
          <span className="ml-2 font-semibold text-slate-100">{selectedPlanet.name}</span>
        </div>
      </div>

      {/* Table */}
      {visibleNights === 0 ? (
        <p className="mt-6 text-center text-sm text-night-300">
          {selectedPlanet.name} non raggiunge i 15° durante la notte nei prossimi {days} giorni.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-night-800/80">
                <th className="pb-2 pl-3 pr-2 font-medium text-night-300">Notte</th>
                <th className="px-2 pb-2 font-medium text-night-300">Finestra</th>
                <th className="px-2 pb-2 font-medium text-night-300">Durata</th>
                <th className="px-2 pb-2 font-medium text-night-300">Picco</th>
                <th className="px-2 pb-2 font-medium text-night-300">Luna</th>
                <th className="px-2 pb-2 font-medium text-night-300">Qualità</th>
              </tr>
            </thead>
            <tbody>
              {windows.map((w) => (
                <NightRow
                  key={w.date.toISOString()}
                  w={w}
                  isTop={w.score === topScore && w.windowStart !== null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
