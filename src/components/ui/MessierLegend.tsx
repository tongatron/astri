import { MESSIER_TYPE_COLOR, MESSIER_TYPE_LABEL, type MessierType } from '@/data/messier';

const TYPE_DESCRIPTION: Record<MessierType, string> = {
  OC: 'Stelle giovani nate dalla stessa nube, ancora vicine: il Presepe (M44), le Pleiadi (M45).',
  GC: 'Sfera densa di centinaia di migliaia di stelle vecchie attorno alla galassia: M13, M22.',
  NEB: 'Nubi di gas e polvere illuminate da stelle vicine: la Nebulosa di Orione (M42), la Laguna (M8).',
  PN: 'Inviluppo di gas espulso da una stella morente, illuminato dal nucleo caldo: l\'Anello (M57), il Manubrio (M27).',
  SNR: 'Ciò che resta di una stella esplosa: M1, residuo della supernova del 1054.',
  GAL: 'Sistemi di miliardi di stelle al di fuori della Via Lattea: Andromeda (M31), Vortice (M51).',
  AST: 'Gruppi di stelle che sembrano legate ma sono solo allineamenti prospettici: M40, M73.',
  STR: 'Densa concentrazione di stelle galattiche che appare come una nube: M24, la Nube Stellare del Sagittario.',
};

const TYPE_ORDER: MessierType[] = ['GAL', 'OC', 'GC', 'NEB', 'PN', 'SNR', 'STR', 'AST'];

const HIGHLIGHTS = [
  { id: 'M31', name: 'Andromeda', what: 'galassia più grande visibile a occhio nudo' },
  { id: 'M42', name: 'Nebulosa di Orione', what: 'culla stellare luminosa anche da città' },
  { id: 'M45', name: 'Pleiadi', what: 'ammasso aperto, 7 stelle visibili a occhio nudo' },
  { id: 'M13', name: 'Grande Ammasso di Ercole', what: 'globulare estivo, spettacolare al binocolo' },
  { id: 'M51', name: 'Vortice', what: 'due galassie a spirale interagenti' },
  { id: 'M57', name: 'Nebulosa Anello', what: 'planetaria perfettamente circolare' },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MessierLegend({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-night-700 bg-night-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Catalogo Messier</h2>
            <p className="mt-1 text-xs text-night-400">
              110 oggetti del cielo profondo catalogati da Charles Messier tra il 1771 e il 1781.
              Originariamente una lista di "macchie che non sono comete" per evitare confusione
              durante la caccia ai veri obiettivi: oggi è la migliore tour guidato per chi inizia
              con binocolo o piccolo telescopio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-night-700 px-2 py-0.5 text-xs text-night-300 hover:bg-night-800"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">Tipi di oggetti</h3>
          <p className="mt-1 text-[11px] text-night-400">
            Il colore del puntino sulla mappa indica la categoria.
          </p>
          <ul className="mt-3 space-y-2">
            {TYPE_ORDER.map((t) => (
              <li
                key={t}
                className="flex items-start gap-3 rounded-lg border border-night-800/70 bg-night-950/50 p-2.5 text-xs"
              >
                <span
                  className="mt-0.5 size-4 shrink-0 rounded-full ring-1 ring-night-700"
                  style={{ backgroundColor: MESSIER_TYPE_COLOR[t] }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100">
                    {MESSIER_TYPE_LABEL[t]}{' '}
                    <span className="text-[10px] font-normal text-night-500">({t})</span>
                  </div>
                  <div className="mt-0.5 text-night-400">{TYPE_DESCRIPTION[t]}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">Magnitudine e strumento</h3>
          <p className="mt-1 text-[11px] text-night-400">
            La magnitudine apparente misura la luminosità: numeri bassi = più luminoso.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { mag: '≤ 5', tool: 'Occhio nudo', detail: 'da cielo buio (Bortle ≤ 4)' },
              { mag: '5 – 7', tool: 'Binocolo 10×50', detail: 'la fascia più ricca' },
              { mag: '7 – 9', tool: 'Telescopio 60–100 mm', detail: 'amatoriale base' },
              { mag: '≥ 9', tool: 'Telescopio ≥ 150 mm', detail: 'oggetti deboli' },
            ].map((r) => (
              <li
                key={r.mag}
                className="rounded-lg border border-night-800/70 bg-night-950/50 p-2.5 text-xs"
              >
                <div className="font-semibold text-slate-100">Mag {r.mag}</div>
                <div className="mt-0.5 text-night-300">{r.tool}</div>
                <div className="mt-0.5 text-[10px] text-night-500">{r.detail}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-slate-100">Sei oggetti da non perdere</h3>
          <ul className="mt-3 space-y-1.5">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h.id}
                className="flex items-baseline gap-2 text-xs"
              >
                <span className="w-10 shrink-0 font-mono text-fuchsia-300">{h.id}</span>
                <span className="font-semibold text-slate-100">{h.name}</span>
                <span className="text-night-400">— {h.what}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-5 text-[11px] leading-relaxed text-night-500">
          Sulla mappa 2D puoi limitare la lista per magnitudine usando lo slider, così
          mostri solo gli oggetti adatti al tuo strumento. Clicca su un puntino per
          vedere nome, costellazione, magnitudine e strumento consigliato.
        </p>
      </div>
    </div>
  );
}
