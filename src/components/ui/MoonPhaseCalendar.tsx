import { useMemo } from 'react';
import { principalPhasesInMonth, type PrincipalPhase } from '@/core/astronomy/phases';
import { formatDate, formatTime } from '@/core/time/format';

const monthFmt = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });

function PhaseGlyph({ kind }: { kind: PrincipalPhase['key'] }) {
  const base = 'inline-block size-7 rounded-full border border-night-600';
  switch (kind) {
    case 'new':
      return <span className={`${base} bg-night-900`} aria-hidden />;
    case 'full':
      return <span className={`${base} bg-moon`} aria-hidden />;
    case 'first':
      return (
        <span
          className={`${base} bg-gradient-to-r from-night-900 from-50% to-moon to-50%`}
          aria-hidden
        />
      );
    case 'last':
      return (
        <span
          className={`${base} bg-gradient-to-r from-moon from-50% to-night-900 to-50%`}
          aria-hidden
        />
      );
  }
}

export default function MoonPhaseCalendar({ reference }: { reference: Date }) {
  const phases = useMemo(() => principalPhasesInMonth(reference), [reference]);
  const title = useMemo(() => monthFmt.format(reference), [reference]);

  return (
    <section className="rounded-lg border border-night-800/80 bg-[#0d1226]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-50">Fasi lunari</h3>
        <span className="text-xs capitalize text-night-300">{title}</span>
      </div>
      <ul className="mt-4 space-y-2">
        {phases.map((phase) => (
          <li
            key={phase.key + phase.at.toISOString()}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border border-night-800/70 bg-night-950/40 px-3 py-2"
          >
            <PhaseGlyph kind={phase.key} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-50">{phase.name}</div>
              <div className="text-xs text-night-300">{formatDate(phase.at)}</div>
            </div>
            <div className="text-xs font-semibold text-amber-100">
              {formatTime(phase.at)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
