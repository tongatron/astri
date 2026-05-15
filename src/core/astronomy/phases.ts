import * as A from 'astronomy-engine';

export type PrincipalPhase = {
  key: 'new' | 'first' | 'full' | 'last';
  name: string;
  at: Date;
};

const QUARTER_NAMES: Record<number, { key: PrincipalPhase['key']; name: string }> = {
  0: { key: 'new', name: 'Luna nuova' },
  1: { key: 'first', name: 'Primo quarto' },
  2: { key: 'full', name: 'Luna piena' },
  3: { key: 'last', name: 'Ultimo quarto' },
};

/**
 * Principal phases (new, first quarter, full, last quarter) whose timestamp
 * falls within the local calendar month containing `reference`.
 */
export function principalPhasesInMonth(reference: Date): PrincipalPhase[] {
  const monthStart = new Date(reference);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const out: PrincipalPhase[] = [];
  // Start search a few days before the month so we don't miss a phase landing
  // exactly on day 1.
  let quarter = A.SearchMoonQuarter(new Date(monthStart.getTime() - 5 * 86_400_000));

  // A month always contains 4 quarter events; the loop bound is defensive.
  for (let i = 0; i < 8 && quarter; i++) {
    const at = quarter.time.date;
    if (at >= monthEnd) break;
    if (at >= monthStart) {
      const meta = QUARTER_NAMES[quarter.quarter];
      if (meta) out.push({ key: meta.key, name: meta.name, at });
    }
    quarter = A.NextMoonQuarter(quarter);
  }

  return out;
}
