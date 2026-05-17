import { describe, expect, it } from 'vitest';
import { auroraVisibility, kpLabel } from './swpc';

describe('auroraVisibility', () => {
  it('Reykjavík con Kp basso (2) → comunque overhead/low-north', () => {
    const v = auroraVisibility(2, 64.1466, -21.9426);
    expect(['overhead', 'low-north']).toContain(v.label);
  });

  it('Roma con Kp 3 (tranquillo) → unlikely', () => {
    const v = auroraVisibility(3, 41.9028, 12.4964);
    expect(v.label).toBe('unlikely');
  });

  it('Roma con Kp 9 (estrema) → almeno bagliore', () => {
    const v = auroraVisibility(9, 41.9028, 12.4964);
    expect(['low-north', 'horizon-glow', 'overhead']).toContain(v.label);
  });

  it('Tromsø con Kp 0 → overhead (è in piena zona aurorale)', () => {
    const v = auroraVisibility(0, 69.6492, 18.9553);
    expect(v.label).toBe('overhead');
  });

  it('Milano con Kp 5 → improbabile o bagliore', () => {
    const v = auroraVisibility(5, 45.4642, 9.19);
    expect(['unlikely', 'horizon-glow']).toContain(v.label);
  });
});

describe('kpLabel', () => {
  it('classifica le soglie principali', () => {
    expect(kpLabel(2)).toBe('Calmo');
    expect(kpLabel(4)).toBe('Attivo');
    expect(kpLabel(5)).toBe('Tempesta lieve (G1)');
    expect(kpLabel(7)).toBe('Tempesta forte (G3)');
    expect(kpLabel(9)).toBe('Tempesta estrema (G5)');
  });
});
