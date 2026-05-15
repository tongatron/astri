import * as A from 'astronomy-engine';

export type MoonState = {
  altitude: number;
  azimuth: number;
  rightAscension: number;
  declination: number;
  distanceKm: number;
  illumination: number;
  phaseAngle: number;
  phaseName: string;
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
};

function phaseName(phase: number): string {
  if (phase < 22.5 || phase >= 337.5) return 'Luna nuova';
  if (phase < 67.5) return 'Falce crescente';
  if (phase < 112.5) return 'Primo quarto';
  if (phase < 157.5) return 'Gibbosa crescente';
  if (phase < 202.5) return 'Luna piena';
  if (phase < 247.5) return 'Gibbosa calante';
  if (phase < 292.5) return 'Ultimo quarto';
  return 'Falce calante';
}

export function moonState(at: Date, observer: A.Observer): MoonState {
  const equ = A.Equator(A.Body.Moon, at, observer, true, true);
  const hor = A.Horizon(at, observer, equ.ra, equ.dec, 'normal');
  const illumination = A.Illumination(A.Body.Moon, at);
  const phase = A.MoonPhase(at);

  const start = new Date(at.getTime() - 12 * 3600_000);
  const rise = A.SearchRiseSet(A.Body.Moon, observer, +1, start, 2);
  const set = rise
    ? A.SearchRiseSet(A.Body.Moon, observer, -1, rise.date, 2)
    : A.SearchRiseSet(A.Body.Moon, observer, -1, start, 2);
  const transit = A.SearchHourAngle(A.Body.Moon, observer, 0, start);

  return {
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    rightAscension: equ.ra,
    declination: equ.dec,
    distanceKm: illumination.geo_dist * A.KM_PER_AU,
    illumination: illumination.phase_fraction,
    phaseAngle: phase,
    phaseName: phaseName(phase),
    rise: rise?.date ?? null,
    set: set?.date ?? null,
    transit: transit?.time.date ?? null,
  };
}

export function moonTrajectory(
  from: Date,
  observer: A.Observer,
  stepMin = 20,
): { t: Date; altitude: number; azimuth: number }[] {
  const out: { t: Date; altitude: number; azimuth: number }[] = [];
  const stepMs = stepMin * 60_000;
  for (let i = 0; i <= (24 * 60) / stepMin; i++) {
    const t = new Date(from.getTime() + i * stepMs);
    const equ = A.Equator(A.Body.Moon, t, observer, true, true);
    const hor = A.Horizon(t, observer, equ.ra, equ.dec, 'normal');
    out.push({ t, altitude: hor.altitude, azimuth: hor.azimuth });
  }
  return out;
}
