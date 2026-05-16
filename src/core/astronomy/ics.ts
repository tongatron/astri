import type { NightlyWindow } from './observing-planner';

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeProp(s: string): string {
  return s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
}

export function exportICS(
  windows: NightlyWindow[],
  planetName: string,
  locationName: string,
): void {
  const events = windows.filter((w) => w.windowStart && w.windowEnd);
  if (events.length === 0) return;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Astri//ObservingPlanner//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const w of events) {
    const start = w.windowStart!;
    const end = w.windowEnd!;
    const peakStr = w.peakTime
      ? `Picco: ${w.peakAltitude.toFixed(0)}° alle ${w.peakTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}.`
      : '';
    const moonPct = Math.round(w.moonIllumination * 100);
    const desc = `Finestra osservativa per ${planetName} da ${locationName}. ${peakStr} Luna: ${moonPct}% illuminata. Qualità: ${w.score}/100.`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:astri-${planetName}-${start.toISOString()}`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeProp(`🔭 ${planetName} — ${locationName}`)}`,
      `DESCRIPTION:${escapeProp(desc)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `astri-${planetName.toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
