import type { AstroEvent } from './events';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toICSDate(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/**
 * Serialize a list of astronomical events as an RFC 5545 calendar.
 * Each event is a 1-hour VEVENT centered on its peak time.
 */
export function eventsToICS(events: AstroEvent[], calendarName = 'Astri — eventi astronomici'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Astri//IT',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];

  const now = toICSDate(new Date());
  for (const e of events) {
    const start = e.at;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.key}@astri`,
      `DTSTAMP:${now}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeText(e.label)}`,
      `DESCRIPTION:${escapeText(e.detail)}`,
      `CATEGORIES:${escapeText(e.category)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 expects CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

export function downloadICS(events: AstroEvent[], filename = 'astri-eventi.ics'): void {
  const blob = new Blob([eventsToICS(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
