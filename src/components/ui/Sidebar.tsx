const panels = [
  { key: 'now', label: 'Adesso', hint: 'Sole, Luna, finestre locali', ready: true },
  { key: 'tonight', label: 'Stasera', hint: 'Timeline osservativa', ready: true },
  { key: 'moon', label: 'Luna', hint: 'Fase, altezza, distanza', ready: true },
  { key: 'planets', label: 'Pianeti', hint: 'Visibili ora', ready: true },
  { key: 'sky', label: 'Mappa cielo', hint: 'Orizzonte, stelle, costellazioni', ready: false },
  { key: 'events', label: 'Eventi', hint: 'Eclissi, congiunzioni', ready: false },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-night-800/60 bg-night-950/40 p-3 md:block">
      <nav className="flex flex-col gap-1">
        {panels.map((p) => (
          <button
            key={p.key}
            disabled={!p.ready}
            className="group flex flex-col rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-night-700 hover:bg-night-900/60 disabled:opacity-45 disabled:hover:border-transparent disabled:hover:bg-transparent"
          >
            <span className="flex items-center justify-between gap-2 text-sm font-medium text-slate-100">
              {p.label}
              {p.ready && (
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.7)]" />
              )}
            </span>
            <span className="text-xs text-night-300">{p.hint}</span>
          </button>
        ))}
      </nav>
      <p className="mt-6 px-3 text-[10px] uppercase tracking-wider text-night-400">
        v0.1 · Osservazione locale
      </p>
    </aside>
  );
}
