import { useMemo, useState } from 'react';
import {
  upcomingEvents,
  type AstroEvent,
  type EventCategory,
} from '@/core/astronomy/events';
import { downloadICS } from '@/core/astronomy/ics';
import { formatDate, formatTime } from '@/core/time/format';

function relativeDays(from: Date, to: Date): string {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  if (days <= 0) return 'oggi';
  if (days === 1) return 'domani';
  if (days < 30) return `tra ${days} giorni`;
  const months = Math.round(days / 30);
  return months === 1 ? 'tra 1 mese' : `tra ${months} mesi`;
}

function eventToneClass(event: AstroEvent): string {
  switch (event.category) {
    case 'planet':
      if (event.planetKind === 'opposition') return 'bg-emerald-300';
      if (event.planetKind === 'max-elongation-evening') return 'bg-sky-300';
      return 'bg-amber-200';
    case 'season':
      return 'bg-yellow-300';
    case 'lunar-eclipse':
      return 'bg-rose-300';
    case 'solar-eclipse':
      return 'bg-orange-400';
    case 'meteor-shower':
      return 'bg-violet-300';
  }
}

const ALL_CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: 'planet', label: 'Pianeti' },
  { id: 'season', label: 'Stagioni' },
  { id: 'lunar-eclipse', label: 'Eclissi lunari' },
  { id: 'solar-eclipse', label: 'Eclissi solari' },
  { id: 'meteor-shower', label: 'Sciami' },
];

export default function UpcomingEvents({
  reference,
  latitude,
}: {
  reference: Date;
  latitude?: number;
}) {
  const [active, setActive] = useState<Set<EventCategory>>(
    () => new Set(ALL_CATEGORIES.map((c) => c.id)),
  );
  const [onlyVisible, setOnlyVisible] = useState(true);

  const events = useMemo(
    () =>
      upcomingEvents(reference, 12, {
        categories: Array.from(active),
        latitude: onlyVisible ? latitude : undefined,
      }),
    [reference, active, latitude, onlyVisible],
  );

  const visible = events.slice(0, 10);

  const toggle = (id: EventCategory) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0f1a18]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">
          Prossimi eventi astronomici
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-night-300">12 mesi</span>
          <button
            type="button"
            onClick={() => downloadICS(events)}
            disabled={events.length === 0}
            className="rounded border border-night-700 bg-night-900/70 px-2 py-1 text-[11px] font-semibold text-slate-100 transition hover:bg-night-800 disabled:opacity-40"
            title="Scarica come file .ics importabile in qualunque calendario"
          >
            Esporta ICS
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = active.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                isActive
                  ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-100'
                  : 'border-night-700 bg-night-900/60 text-night-300 hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
        {latitude !== undefined && (
          <label className="ml-auto flex items-center gap-1.5 text-[11px] text-night-300">
            <input
              type="checkbox"
              checked={onlyVisible}
              onChange={(e) => setOnlyVisible(e.target.checked)}
              className="accent-emerald-400"
            />
            Solo visibili da qui
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-night-300">
          Nessun evento per i filtri selezionati.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((event) => (
            <li
              key={event.key}
              className="rounded-md border border-night-800/70 bg-night-950/45 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${eventToneClass(event)}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-50">
                    {event.label}
                  </div>
                  <div className="mt-0.5 text-xs text-night-300">
                    {event.detail}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-semibold text-amber-100">
                      {formatDate(event.at)}, {formatTime(event.at)}
                    </span>
                    <span className="text-night-300">
                      · {relativeDays(reference, event.at)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {events.length > visible.length && (
        <div className="mt-3 text-right text-[11px] text-night-300">
          {events.length - visible.length} altri eventi nel file ICS
        </div>
      )}
    </section>
  );
}
