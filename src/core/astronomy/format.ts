import { formatTime } from '@/core/time/format';

export function formatAngle(value: number, digits = 1): string {
  return `${value.toFixed(digits)}°`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatKm(value: number): string {
  return `${Math.round(value).toLocaleString('it-IT')} km`;
}

export function formatMagnitude(value: number): string {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export function formatOptionalTime(value: Date | null): string {
  return value ? formatTime(value) : 'Non avviene';
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return 'Non disponibile';
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export function compassDirection(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round((((azimuth % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

export function visibilityLabel(altitude: number): string {
  if (altitude >= 45) return 'Alta';
  if (altitude >= 20) return 'Buona';
  if (altitude >= 5) return 'Bassa';
  if (altitude >= 0) return 'All orizzonte';
  return 'Sotto orizzonte';
}
