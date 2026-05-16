import * as A from 'astronomy-engine';
import { STARS } from '@/data/stars';
import { CONSTELLATIONS } from '@/data/constellations';
import { equatorialToHorizontal, eclipticLongitudeToEquatorial } from '@/core/coords/equatorial';
import { sunState } from './sun';
import { moonState } from './moon';
import { planetStates } from './planets';

export type SkyChartOptions = {
  locationName?: string;
  showTime?: boolean;
};

const PLANET_COLORS: Record<string, string> = {
  mercury: '#b0c4de',
  venus:   '#fffacd',
  mars:    '#ff6b4a',
  jupiter: '#ffd580',
  saturn:  '#e8c97a',
  uranus:  '#7fffd4',
  neptune: '#8080ff',
};

/**
 * Azimuthal equidistant projection.
 * altitude 90° → r=0 (zenith/center), altitude 0° → r=R (horizon edge).
 * North at top.
 */
function altAzToXY(
  alt: number,
  az: number,
  cx: number,
  cy: number,
  R: number,
): [number, number] {
  const r = ((90 - alt) / 90) * R;
  const rad = (az * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

function magToRadius(mag: number): number {
  // Brightest (-1.5) → 4px, faintest plotted (3.5) → 0.8px
  const clamped = Math.max(-1.5, Math.min(3.5, mag));
  return 4 - (clamped + 1.5) * (3.2 / 5);
}

export function drawSkyChart(
  ctx: CanvasRenderingContext2D,
  at: Date,
  observer: A.Observer,
  w: number,
  h: number,
  opts: SkyChartOptions = {},
): void {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(cx, cy) * 0.88;

  // ── Background ──────────────────────────────────────────────────────────
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, w, h);

  // Sky dome gradient
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  const grad = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, R);
  grad.addColorStop(0, '#0d1b4b');
  grad.addColorStop(0.6, '#060e2e');
  grad.addColorStop(1, '#03061a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ── Altitude grid ────────────────────────────────────────────────────────
  ctx.lineWidth = 0.5;
  for (const alt of [30, 60]) {
    const r = ((90 - alt) / 90) * R;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100,116,139,0.25)';
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    // label
    ctx.fillStyle = 'rgba(100,116,139,0.55)';
    ctx.font = `${Math.round(w * 0.016)}px system-ui,sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${alt}°`, cx + r + 3, cy);
  }

  // Azimuth spokes every 30°
  for (let az = 0; az < 360; az += 30) {
    const [x2, y2] = altAzToXY(0, az, cx, cy, R);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(100,116,139,0.12)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // ── Compute star positions ───────────────────────────────────────────────
  const starPositions: Record<string, { altitude: number; azimuth: number }> = {};
  for (const star of STARS) {
    const pos = equatorialToHorizontal(star.raHours, star.decDeg, at, observer);
    starPositions[star.id] = pos;
  }

  // ── Constellation lines ──────────────────────────────────────────────────
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(96,120,160,0.45)';
  ctx.setLineDash([]);
  for (const con of CONSTELLATIONS) {
    for (const [aId, bId] of con.segments) {
      const a = starPositions[aId];
      const b = starPositions[bId];
      if (!a || !b) continue;
      if (a.altitude < -8 && b.altitude < -8) continue;
      const [ax, ay] = altAzToXY(a.altitude, a.azimuth, cx, cy, R);
      const [bx, by] = altAzToXY(b.altitude, b.azimuth, cx, cy, R);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
  }

  // ── Ecliptic ─────────────────────────────────────────────────────────────
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(251,146,60,0.55)';
  ctx.lineWidth = 1;
  const eclPts: [number, number][] = [];
  for (let lon = 0; lon <= 360; lon += 5) {
    const { raHours, decDeg } = eclipticLongitudeToEquatorial(lon);
    const { altitude, azimuth } = equatorialToHorizontal(raHours, decDeg, at, observer);
    eclPts.push(altAzToXY(altitude, azimuth, cx, cy, R));
  }
  // draw ecliptic as segments (skip large jumps that wrap around)
  ctx.beginPath();
  let penDown = false;
  for (let i = 0; i < eclPts.length; i++) {
    const [x, y] = eclPts[i];
    const r = Math.hypot(x - cx, y - cy);
    if (r > R * 1.05) { penDown = false; continue; }
    if (!penDown) { ctx.moveTo(x, y); penDown = true; } else { ctx.lineTo(x, y); }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Stars ────────────────────────────────────────────────────────────────
  for (const star of STARS) {
    const { altitude, azimuth } = starPositions[star.id];
    const [x, y] = altAzToXY(altitude, azimuth, cx, cy, R);
    const r = Math.hypot(x - cx, y - cy);
    if (r > R + 2) continue;
    const opacity = altitude > 0 ? 1 : Math.max(0, 1 + altitude / 10) * 0.3;
    if (opacity <= 0) continue;
    const dotR = magToRadius(star.magnitude);
    // glow for bright stars
    if (star.magnitude < 1.5) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, dotR * 3.5);
      glow.addColorStop(0, `rgba(255,250,230,${opacity * 0.5})`);
      glow.addColorStop(1, 'rgba(255,250,230,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, dotR * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(240,245,255,${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, dotR), 0, Math.PI * 2);
    ctx.fill();
    // name for bright stars
    if (star.magnitude < 1.2 && altitude > 5) {
      ctx.fillStyle = `rgba(180,200,230,${opacity})`;
      ctx.font = `${Math.round(w * 0.014)}px system-ui,sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(star.name, x + dotR + 2, y - 2);
    }
  }

  // ── Planets ──────────────────────────────────────────────────────────────
  const planets = planetStates(at, observer);
  for (const p of planets) {
    const [x, y] = altAzToXY(p.altitude, p.azimuth, cx, cy, R);
    if (Math.hypot(x - cx, y - cy) > R + 4) continue;
    const opacity = p.altitude > 0 ? 1 : 0.25;
    const color = PLANET_COLORS[p.key] ?? '#a3e635';
    const dotR = Math.max(2.5, 5 - p.magnitude * 0.6);
    // glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, dotR * 3);
    glow.addColorStop(0, color.replace(')', `,${opacity * 0.4})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace('rgba(', 'rgba('));
    // simpler glow:
    ctx.beginPath();
    ctx.arc(x, y, dotR * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,200,${opacity * 0.1})`;
    ctx.fill();
    ctx.fillStyle = opacity < 1 ? `rgba(150,150,150,0.4)` : color;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
    if (p.altitude > -5) {
      const fs = Math.round(w * 0.016);
      ctx.fillStyle = `rgba(220,230,255,${opacity})`;
      ctx.font = `bold ${fs}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(p.name, x, y - dotR - 2);
    }
  }

  // ── Moon ─────────────────────────────────────────────────────────────────
  const moon = moonState(at, observer);
  {
    const [x, y] = altAzToXY(moon.altitude, moon.azimuth, cx, cy, R);
    if (Math.hypot(x - cx, y - cy) <= R + 4) {
      const opacity = moon.altitude > 0 ? 1 : 0.3;
      const mR = Math.round(w * 0.022);
      // glow
      const moonGlow = ctx.createRadialGradient(x, y, 0, x, y, mR * 3);
      moonGlow.addColorStop(0, `rgba(210,225,245,${opacity * 0.35})`);
      moonGlow.addColorStop(1, 'rgba(210,225,245,0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(x, y, mR * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,215,240,${opacity})`;
      ctx.beginPath();
      ctx.arc(x, y, mR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(180,200,230,${opacity})`;
      ctx.font = `${Math.round(w * 0.016)}px system-ui,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`Luna ${Math.round(moon.illumination * 100)}%`, x, y - mR - 3);
    }
  }

  // ── Sun ──────────────────────────────────────────────────────────────────
  const sun = sunState(at, observer);
  {
    const [x, y] = altAzToXY(sun.altitude, sun.azimuth, cx, cy, R);
    if (Math.hypot(x - cx, y - cy) <= R + 4) {
      const opacity = sun.altitude > -12 ? Math.max(0.15, 1 - Math.abs(Math.min(sun.altitude, 0)) / 12) : 0;
      if (opacity > 0) {
        const sR = Math.round(w * 0.025);
        const sunGlow = ctx.createRadialGradient(x, y, 0, x, y, sR * 4);
        sunGlow.addColorStop(0, `rgba(255,220,50,${opacity * 0.5})`);
        sunGlow.addColorStop(1, 'rgba(255,220,50,0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(x, y, sR * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,210,30,${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, sR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,230,100,${opacity})`;
        ctx.font = `${Math.round(w * 0.016)}px system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Sole', x, y - sR - 3);
      }
    }
  }

  ctx.restore(); // end clip

  // ── Horizon circle ───────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(251,191,36,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Cardinal labels ──────────────────────────────────────────────────────
  const cardinals = [
    { label: 'N', az: 0 }, { label: 'NE', az: 45 },
    { label: 'E', az: 90 }, { label: 'SE', az: 135 },
    { label: 'S', az: 180 }, { label: 'SO', az: 225 },
    { label: 'O', az: 270 }, { label: 'NO', az: 315 },
  ];
  const cardFontSize = Math.round(w * 0.018);
  for (const { label, az } of cardinals) {
    const rad = (az * Math.PI) / 180;
    const isMain = label.length === 1;
    const offset = R + (isMain ? 18 : 14);
    const x = cx + offset * Math.sin(rad);
    const y = cy - offset * Math.cos(rad);
    ctx.fillStyle = isMain ? '#fbbf24' : 'rgba(251,191,36,0.55)';
    ctx.font = `${isMain ? 'bold ' : ''}${isMain ? cardFontSize : cardFontSize - 2}px system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  // Zenith label
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.font = `${Math.round(w * 0.014)}px system-ui,sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Z', cx, cy - 6);

  // ── Info strip ───────────────────────────────────────────────────────────
  if (opts.showTime !== false) {
    const infoY = h - Math.round(h * 0.04);
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = `${Math.round(w * 0.014)}px system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const timeStr = at.toLocaleString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    ctx.fillText(
      opts.locationName ? `${opts.locationName} · ${timeStr}` : timeStr,
      cx, infoY,
    );
  }
}
