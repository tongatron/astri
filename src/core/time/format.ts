const dateFmt = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('it-IT', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

export function formatDateTime(d: Date): string {
  return `${formatDate(d)} · ${formatTime(d)}`;
}

/** Human-readable label for a speed multiplier (1 = realtime). */
export function formatSpeed(speed: number): string {
  if (speed === 1) return '1×';
  if (speed < 60) return `${speed}×`;
  if (speed < 3600) return `${Math.round(speed / 60)} min/s`;
  if (speed < 86400) return `${Math.round(speed / 3600)} h/s`;
  return `${Math.round(speed / 86400)} g/s`;
}

/** Offset (ms) between two dates, formatted as a short relative string. */
export function formatOffset(deltaMs: number): string {
  const abs = Math.abs(deltaMs);
  const sign = deltaMs < 0 ? '−' : '+';
  if (abs < 60_000) return `${sign}${Math.round(abs / 1000)}s`;
  if (abs < 3_600_000) return `${sign}${Math.round(abs / 60_000)}m`;
  if (abs < 86_400_000) return `${sign}${(abs / 3_600_000).toFixed(1)}h`;
  return `${sign}${(abs / 86_400_000).toFixed(1)}g`;
}
