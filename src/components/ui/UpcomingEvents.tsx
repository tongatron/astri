import { useMemo } from 'react';
import { upcomingPlanetEvents, type PlanetEvent } from '@/core/astronomy/events';
import { formatDate, formatTime } from '@/core/time/format';

function relativeDays(from: Date, to: Date): string {
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  if (days <= 0) return 'oggi';
  if (days === 1) return 'domani';
  if (days < 30) return `tra ${days} giorni`;
  const months = Math.round(days / 30);
  return months === 1 ? 'tra 1 mese' : `tra ${months} mesi`;
}

function eventToneClass(kind: PlanetEvent['kind']): string {
  switch (kind) {
    case 'opposition':
      return 'bg-emerald-300';
    case 'max-elongation-evening':
      return 'bg-sky-300';
    case 'max-elongation-morning':
      return 'bg-amber-200';
  }
}

export default function UpcomingEvents({ reference }: { reference: Date }) {
  const events = useMemo(
    () => upcomingPlanetEvents(reference, 12).slice(0, 8),
    [reference],
  );

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0f1a18]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">
          Prossimi eventi planetari
        </h3>
        <span className="text-xs text-night-300">12 mesi</span>
      </div>
      {events.length === 0 ? (
        <p className="mt-4 text-sm text-night-300">
          Nessun evento principale nei prossimi 12 mesi.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li
              key={event.key}
              className="rounded-md border border-night-800/70 bg-night-950/45 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${eventToneClass(event.kind)}`}
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
    </section>
  );
}
