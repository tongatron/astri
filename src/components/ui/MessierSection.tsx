import { useMemo, useState } from 'react';
import * as A from 'astronomy-engine';
import {
  MESSIER,
  MESSIER_TYPE_COLOR,
  MESSIER_TYPE_LABEL,
  type MessierType,
} from '@/data/messier';
import MessierLegend from './MessierLegend';

type VisibleObject = {
  id: string;
  name?: string;
  type: MessierType;
  constellation: string;
  magnitude: number;
  altitude: number;
  azimuth: number;
};

const MIN_ALT_DEG = 10;
const MAX_SHOW = 20;

function computeVisible(observer: A.Observer, date: Date): VisibleObject[] {
  return MESSIER.flatMap((m) => {
    const hor = A.Horizon(date, observer, m.raHours, m.decDeg, 'normal');
    if (hor.altitude < MIN_ALT_DEG) return [];
    return [
      {
        id: m.id,
        name: m.name,
        type: m.type,
        constellation: m.constellation,
        magnitude: m.magnitude,
        altitude: hor.altitude,
        azimuth: hor.azimuth,
      },
    ];
  }).sort((a, b) => b.altitude - a.altitude);
}

function TypeChip({ type }: { type: MessierType }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-night-950"
      style={{ backgroundColor: MESSIER_TYPE_COLOR[type] }}
    >
      {MESSIER_TYPE_LABEL[type]}
    </span>
  );
}

type Props = {
  observer: A.Observer;
  displayed: Date;
};

export default function MessierSection({ observer, displayed }: Props) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(
    () => computeVisible(observer, displayed),
    // quantized to the minute to avoid recomputing on every second tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [observer, Math.floor(displayed.getTime() / 60_000)],
  );

  const shown = showAll ? visible : visible.slice(0, MAX_SHOW);

  return (
    <section className="rounded-lg border border-night-800/80 bg-night-950/55 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">
            Oggetti Messier visibili
          </h3>
          <p className="mt-0.5 text-[11px] text-night-400">
            {visible.length > 0
              ? `${visible.length} oggetti sopra ${MIN_ALT_DEG}° in questo momento`
              : `Nessun oggetto sopra ${MIN_ALT_DEG}° in questo momento`}
          </p>
        </div>
        <button
          onClick={() => setLegendOpen(true)}
          className="shrink-0 rounded-full border border-night-700 px-2.5 py-1 text-[11px] text-night-300 hover:bg-night-800 hover:text-slate-100"
          title="Apri legenda Messier"
        >
          Legenda
        </button>
      </div>

      {visible.length > 0 && (
        <>
          <div className="mt-3 overflow-hidden rounded-lg border border-night-800/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-night-800/60 bg-night-900/60 text-left text-[10px] uppercase tracking-wide text-night-400">
                  <th className="px-3 py-2">Oggetto</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Mag</th>
                  <th className="px-3 py-2 text-right">Alt</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((obj, i) => (
                  <tr
                    key={obj.id}
                    className={`border-b border-night-800/40 transition-colors hover:bg-night-800/40 ${
                      i % 2 === 0 ? 'bg-night-950/30' : ''
                    }`}
                  >
                    <td className="px-3 py-2">
                      <span className="font-mono font-semibold text-fuchsia-300">
                        {obj.id}
                      </span>
                      {obj.name && (
                        <span className="ml-1.5 text-slate-300">{obj.name}</span>
                      )}
                      <div className="text-[10px] text-night-500">
                        {obj.constellation}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <TypeChip type={obj.type} />
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">
                      {obj.magnitude.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">
                      {obj.altitude.toFixed(0)}°
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visible.length > MAX_SHOW && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 w-full rounded-md border border-night-800 py-1.5 text-[11px] text-night-400 hover:bg-night-800 hover:text-slate-100"
            >
              {showAll
                ? 'Mostra meno'
                : `Mostra tutti i ${visible.length} oggetti`}
            </button>
          )}
        </>
      )}

      <MessierLegend open={legendOpen} onClose={() => setLegendOpen(false)} />
    </section>
  );
}
