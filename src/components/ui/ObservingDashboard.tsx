import { useMemo } from 'react';
import { moonState, moonTrajectory } from '@/core/astronomy/moon';
import { toObserver } from '@/core/astronomy/observer';
import { planetStates, planetTrajectory, type PlanetState } from '@/core/astronomy/planets';
import { sunState, sunTrajectory } from '@/core/astronomy/sun';
import {
  compassDirection,
  formatAngle,
  formatDuration,
  formatKm,
  formatMagnitude,
  formatOptionalTime,
  formatPercent,
  visibilityLabel,
} from '@/core/astronomy/format';
import { formatDate, formatDateTime, formatTime } from '@/core/time/format';
import { useQuantizedDisplayTime } from '@/state/useDisplayTime';
import { useStore } from '@/state/store';
import { useWeatherForecast } from '@/state/useWeatherForecast';
import { estimateBortle } from '@/core/light-pollution/bortle';
import AltitudeChart from './AltitudeChart';
import MoonPhaseCalendar from './MoonPhaseCalendar';
import ObservingPlanner from './ObservingPlanner';
import TonightReport from './TonightReport';
import UpcomingEvents from './UpcomingEvents';
import * as A from 'astronomy-engine';

const PLANET_META: { key: string; name: string; body: A.Body; color: string; instrument: string }[] = [
  { key: 'mercury', name: 'Mercurio', body: A.Body.Mercury, color: '#94a3b8', instrument: 'occhio nudo' },
  { key: 'venus',   name: 'Venere',   body: A.Body.Venus,   color: '#fde68a', instrument: 'occhio nudo' },
  { key: 'mars',    name: 'Marte',    body: A.Body.Mars,    color: '#f87171', instrument: 'occhio nudo' },
  { key: 'jupiter', name: 'Giove',    body: A.Body.Jupiter, color: '#fb923c', instrument: 'occhio nudo' },
  { key: 'saturn',  name: 'Saturno',  body: A.Body.Saturn,  color: '#d4a574', instrument: 'occhio nudo' },
  { key: 'uranus',  name: 'Urano',    body: A.Body.Uranus,  color: '#67e8f9', instrument: 'binocolo/telescopio' },
  { key: 'neptune', name: 'Nettuno',  body: A.Body.Neptune, color: '#818cf8', instrument: 'binocolo/telescopio' },
];

type SkyPoint = {
  key: string;
  label: string;
  altitude: number;
  azimuth: number;
  tone: 'sun' | 'moon' | 'planet';
};

type TimelineEvent = {
  key: string;
  at: Date;
  label: string;
  detail: string;
  tone: 'sun' | 'moon' | 'planet';
};

function localDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function nextBestWindow(
  trajectory: { t: Date; altitude: number }[],
): { start: Date; end: Date; peak: number } | null {
  const visible = trajectory.filter((p) => p.altitude > 5);
  if (visible.length === 0) return null;

  return {
    start: visible[0].t,
    end: visible[visible.length - 1].t,
    peak: Math.max(...visible.map((p) => p.altitude)),
  };
}

function inFutureWindow(date: Date | null, from: Date, hours = 24): boolean {
  if (!date) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= from.getTime() + hours * 3600_000;
}

function buildTimeline({
  from,
  sun,
  moon,
  planets,
}: {
  from: Date;
  sun: ReturnType<typeof sunState>;
  moon: ReturnType<typeof moonState>;
  planets: PlanetState[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const pushEvent = (
    key: string,
    at: Date | null,
    label: string,
    detail: string,
    tone: TimelineEvent['tone'],
  ) => {
    if (at && inFutureWindow(at, from)) {
      events.push({ key, at, label, detail, tone });
    }
  };

  pushEvent('sun-rise', sun.rise, 'Alba', "Il Sole torna sopra l'orizzonte", 'sun');
  pushEvent('sun-set', sun.set, 'Tramonto', 'Inizia la finestra serale', 'sun');
  pushEvent('moon-rise', moon.rise, 'Sorge la Luna', moon.phaseName, 'moon');
  pushEvent('moon-set', moon.set, 'Tramonta la Luna', moon.phaseName, 'moon');

  // One headline planet: brightest naked-eye planet whose transit falls in
  // the next 24h. Rise/set/transit of every planet duplicates TonightReport,
  // so we keep only this single marker for orientation.
  const headline = planets
    .filter((p) => p.instrument === 'occhio nudo' && inFutureWindow(p.transit, from))
    .sort((a, b) => a.magnitude - b.magnitude)[0];
  if (headline) {
    pushEvent(
      `${headline.key}-transit`,
      headline.transit,
      `${headline.name} al massimo`,
      `Al meridiano · mag ${formatMagnitude(headline.magnitude)}`,
      'planet',
    );
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-night-700/70 pl-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-night-300">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-50">
        {value}
      </div>
    </div>
  );
}

function BodyPanel({
  title,
  subtitle,
  altitude,
  azimuth,
  stats,
}: {
  title: string;
  subtitle: string;
  altitude: number;
  azimuth: number;
  stats: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-lg border border-night-800/80 bg-night-950/55 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
          <p className="mt-1 text-xs text-night-300">{subtitle}</p>
        </div>
        <div className="max-w-28 rounded-md border border-night-700 bg-night-900/70 px-2.5 py-1 text-xs font-semibold leading-tight text-slate-100">
          {visibilityLabel(altitude)}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Altezza" value={formatAngle(altitude)} />
        <Stat label="Direzione" value={`${compassDirection(azimuth)} ${formatAngle(azimuth, 0)}`} />
        {stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </section>
  );
}

function HorizonMap({ points }: { points: SkyPoint[] }) {
  const visiblePoints = points.filter((point) => point.altitude >= 0);

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#07120f]/70 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-50">Orizzonte locale</h3>
        <span className="text-xs text-night-300">N E S O</span>
      </div>
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-[420px] rounded-full border border-night-700 bg-[radial-gradient(circle_at_center,rgba(27,91,85,0.28),rgba(7,18,15,0.85)_66%)]">
        <div className="absolute inset-[18%] rounded-full border border-dashed border-night-600/70" />
        <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[10px] font-semibold text-night-200">
          N
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-night-200">
          S
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-night-200">
          E
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-night-200">
          O
        </div>

        {visiblePoints.map((point) => {
          const radius = Math.max(6, 46 - Math.max(point.altitude, 0) * 0.45);
          const angle = (point.azimuth - 90) * (Math.PI / 180);
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const color =
            point.tone === 'sun'
              ? 'bg-sun text-night-950'
              : point.tone === 'moon'
                ? 'bg-moon text-night-950'
                : 'bg-emerald-300 text-night-950';

          return (
            <div
              key={point.key}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`grid size-8 place-items-center rounded-full ${color} text-[10px] font-bold shadow-lg`}>
                {point.label.slice(0, point.tone === 'planet' ? 2 : 1)}
              </div>
              <span className="rounded bg-night-950/80 px-1.5 py-0.5 text-[10px] text-slate-100">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlanetList({ planets }: { planets: PlanetState[] }) {
  const visiblePlanets = planets.filter((planet) => planet.altitude > 0);
  const primary = visiblePlanets.length > 0 ? visiblePlanets : planets.slice(0, 4);

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0b1017]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">Pianeti</h3>
        <span className="text-xs text-night-300">
          {visiblePlanets.length} sopra l'orizzonte
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {primary.map((planet) => (
          <div
            key={planet.key}
            className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-night-800/70 bg-night-950/45 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-50">
                  {planet.name}
                </span>
                <span className="rounded bg-night-800 px-1.5 py-0.5 text-[10px] text-night-200">
                  mag {formatMagnitude(planet.magnitude)}
                </span>
              </div>
              <div className="mt-1 text-xs text-night-300">
                {visibilityLabel(planet.altitude)} · {planet.instrument}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-50">
                {formatAngle(planet.altitude)}
              </div>
              <div className="mt-1 text-night-300">
                {compassDirection(planet.azimuth)} {formatAngle(planet.azimuth, 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="rounded-lg border border-night-800/80 bg-[#11110d]/80 p-4">
      <h3 className="text-sm font-semibold text-slate-50">Prossime 24 ore</h3>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-night-300">
            Nessun evento principale nelle prossime ore.
          </p>
        ) : (
          events.map((event) => (
            <div key={event.key} className="grid grid-cols-[4.25rem_1fr] gap-3">
              <div className="text-xs font-semibold text-amber-100">
                {formatTime(event.at)}
              </div>
              <div className="border-l border-night-700/70 pl-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${
                      event.tone === 'sun'
                        ? 'bg-sun'
                        : event.tone === 'moon'
                          ? 'bg-moon'
                          : 'bg-emerald-300'
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-50">
                    {event.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-night-300">{event.detail}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <div className="relative grid h-full place-items-center px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-5 size-16 rounded-full border border-amber-200/40 bg-amber-300/10 shadow-[0_0_44px_rgba(251,191,36,0.22)]" />
        <h2 className="text-3xl font-semibold text-slate-50">
          Scegli una posizione per accendere il cielo locale.
        </h2>
        <p className="mt-3 text-sm leading-6 text-night-200">
          Astri usa coordinate e orario per mostrare Sole, Luna, orizzonte e finestre osservative direttamente dal luogo selezionato.
        </p>
      </div>
    </div>
  );
}

export default function ObservingDashboard() {
  const location = useStore((s) => s.location);
  // Dashboard data (TonightReport, planet states, weather scoring, etc.) is
  // refreshed every 15 minutes. The header clock still ticks every second.
  const displayed = useQuantizedDisplayTime(15 * 60_000);
  const weather = useWeatherForecast(location);
  const bortle = useMemo(
    () => (location ? estimateBortle(location.lat, location.lon) : null),
    [location],
  );

  const model = useMemo(() => {
    if (!location) return null;
    const observer = toObserver(location);
    const dayStart = localDayStart(displayed);
    // Trajectories: start 6h before "now" and span 30h so we always capture
    // the full observing night (sunset → next sunrise) around `displayed`.
    const chartStart = new Date(displayed.getTime() - 6 * 3_600_000);
    const sun = sunState(displayed, observer);
    const moon = moonState(displayed, observer);
    const planets = planetStates(displayed, observer);
    const sunTrack = sunTrajectory(chartStart, observer, 20, 30);
    const moonTrack = moonTrajectory(chartStart, observer, 20, 30);
    const moonWindow = nextBestWindow(moonTrack);
    const timeline = buildTimeline({ from: displayed, sun, moon, planets });
    const planetTracks = PLANET_META.map((p) => ({
      key: p.key,
      name: p.name,
      color: p.color,
      track: planetTrajectory(p.body, chartStart, observer, 20, 30),
    }));
    const planetInstruments = Object.fromEntries(PLANET_META.map((p) => [p.key, p.instrument]));

    return { sun, moon, planets, sunTrack, moonTrack, moonWindow, timeline, dayStart, planetTracks, planetInstruments };
  }, [displayed, location]);

  if (!location || !model) return <EmptyDashboard />;

  const { sun, moon, planets, sunTrack, moonTrack, moonWindow, timeline, dayStart, planetTracks, planetInstruments } = model;
  const bestSun = Math.max(...sunTrack.map((p) => p.altitude));
  const bestMoon = Math.max(...moonTrack.map((p) => p.altitude));
  const isNight = sun.altitude < -6;
  const visiblePlanets = planets.filter((planet) => planet.altitude > 0);
  const bestPlanet = visiblePlanets[0];
  const visibleNow = [
    sun.altitude > 0 ? "Sole sopra l'orizzonte" : null,
    moon.altitude > 0 ? `Luna visibile a ${formatAngle(moon.altitude)}` : null,
    bestPlanet ? `${bestPlanet.name} a ${formatAngle(bestPlanet.altitude)}` : null,
  ].filter(Boolean);

  return (
    <div className="scrollbar-hidden h-full overflow-y-auto bg-[linear-gradient(180deg,rgba(7,9,28,0.3),rgba(7,18,15,0.55))]">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-4 lg:px-8">
        <TonightReport
          sunTrack={sunTrack}
          moonTrack={moonTrack}
          moon={moon}
          planets={planetTracks}
          planetInstruments={planetInstruments}
          weather={
            weather.status === 'ready'
              ? { status: 'ready', samples: weather.forecast.samples }
              : { status: weather.status }
          }
          bortle={bortle}
        />

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="min-h-[260px] rounded-lg border border-night-800/80 bg-[radial-gradient(circle_at_25%_20%,rgba(255,209,102,0.17),transparent_30%),linear-gradient(135deg,rgba(7,9,28,0.95),rgba(7,18,15,0.86))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-amber-200/80">
                  {formatDate(displayed)}
                </div>
                <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-slate-50">
                  Cielo di {location.name}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-night-200">
                  {isNight
                    ? 'Il Sole è sotto il crepuscolo civile: questa è la finestra giusta per osservare gli oggetti luminosi.'
                    : 'La luce solare domina ancora il cielo: usa la timeline per arrivare a tramonto e prime ore notturne.'}
                </p>
              </div>
              <div className="rounded-md border border-night-700 bg-night-950/55 px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.14em] text-night-300">
                  Ora mostrata
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-50">
                  {formatDateTime(displayed)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Stat label="Sole max oggi" value={formatAngle(bestSun)} />
              <Stat label="Luna max oggi" value={formatAngle(bestMoon)} />
              <Stat label="Pianeti ora" value={`${visiblePlanets.length} visibili`} />
              <Stat label="Visibile ora" value={visibleNow.length ? visibleNow.join(' · ') : 'Nessun corpo principale'} />
            </div>
          </div>

          <section className="rounded-lg border border-night-800/80 bg-[#101315]/80 p-4">
            <h3 className="text-sm font-semibold text-slate-50">Prossima finestra utile</h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-night-300">
                  Luna
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {moonWindow
                    ? `${formatTime(moonWindow.start)} - ${formatTime(moonWindow.end)}`
                    : 'Non sopra i 5° oggi'}
                </div>
                <p className="mt-1 text-xs text-night-300">
                  {moonWindow
                    ? `Culmine della finestra: ${formatAngle(moonWindow.peak)}.`
                    : 'Controlla il giorno successivo dalla barra temporale.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Alba" value={formatOptionalTime(sun.rise)} />
                <Stat label="Tramonto" value={formatOptionalTime(sun.set)} />
              </div>
            </div>
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <BodyPanel
              title="Sole"
              subtitle="Posizione apparente e ritmo della giornata"
              altitude={sun.altitude}
              azimuth={sun.azimuth}
              stats={[
                { label: 'Alba', value: formatOptionalTime(sun.rise) },
                { label: 'Tramonto', value: formatOptionalTime(sun.set) },
                { label: 'Transito', value: formatOptionalTime(sun.transit) },
                { label: 'Durata giorno', value: formatDuration(sun.dayLengthMs) },
              ]}
            />
            <BodyPanel
              title="Luna"
              subtitle={`${moon.phaseName}, illuminata al ${formatPercent(moon.illumination)}`}
              altitude={moon.altitude}
              azimuth={moon.azimuth}
              stats={[
                { label: 'Sorge', value: formatOptionalTime(moon.rise) },
                { label: 'Tramonta', value: formatOptionalTime(moon.set) },
                { label: 'Distanza', value: formatKm(moon.distanceKm) },
                { label: 'Fase', value: formatAngle(moon.phaseAngle, 0) },
              ]}
            />
          </div>

          <HorizonMap
            points={[
              {
                key: 'sun',
                label: 'Sole',
                altitude: sun.altitude,
                azimuth: sun.azimuth,
                tone: 'sun',
              },
              {
                key: 'moon',
                label: 'Luna',
                altitude: moon.altitude,
                azimuth: moon.azimuth,
                tone: 'moon',
              },
              ...planets
                .filter((planet) => planet.altitude > -8)
                .slice(0, 5)
                .map((planet) => ({
                  key: planet.key,
                  label: planet.name,
                  altitude: planet.altitude,
                  azimuth: planet.azimuth,
                  tone: 'planet' as const,
                })),
            ]}
          />
        </section>

        <AltitudeChart
          dayStart={dayStart}
          sun={sunTrack}
          moon={moonTrack}
          planets={planetTracks}
          now={displayed}
        />

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <PlanetList planets={planets} />
          <Timeline events={timeline} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <UpcomingEvents reference={displayed} />
          <MoonPhaseCalendar reference={displayed} />
        </section>

        <ObservingPlanner />
      </div>
    </div>
  );
}
