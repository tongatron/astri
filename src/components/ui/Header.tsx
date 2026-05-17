import { useState } from 'react';
import { useStore } from '@/state/store';
import { useDisplayTime } from '@/state/useDisplayTime';
import { formatDateTime } from '@/core/time/format';
import { buildShareUrl } from '@/state/urlState';
import LocationPicker from './LocationPicker';
import SettingsPanel from './SettingsPanel';

export default function Header() {
  const location = useStore((s) => s.location);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const timeMode = useStore((s) => s.timeMode);
  const simulatedTime = useStore((s) => s.simulatedTime);
  const nightRedMode = useStore((s) => s.nightRedMode);
  const setNightRedMode = useStore((s) => s.setNightRedMode);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareLabel, setShareLabel] = useState<'idle' | 'copied' | 'failed'>('idle');
  const displayed = useDisplayTime();

  const onShare = async () => {
    const url = buildShareUrl(window.location.href, {
      location,
      view,
      simulatedTime: timeMode === 'simulated' ? simulatedTime : undefined,
    });
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('copied');
    } catch {
      setShareLabel('failed');
    }
    setTimeout(() => setShareLabel('idle'), 2000);
  };

  return (
    <>
      <header className="flex flex-col gap-2 border-b border-night-800/60 bg-night-950/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-full bg-gradient-to-br from-sun to-moon shadow-[0_0_20px_rgba(255,209,102,0.5)]" />
            <div>
              <h1 className="text-base font-semibold tracking-tight">Astri</h1>
              <p className="text-xs text-night-300">Cielo notturno interattivo</p>
            </div>
          </div>
          <a
            href="https://tongatron.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-sun/70 px-2.5 py-0.5 text-xs font-medium text-slate-100 transition hover:border-sun hover:bg-sun/10"
          >
            <span className="size-2 rounded-full bg-sun shadow-[0_0_5px_rgba(255,209,102,0.8)]" />
            tongatron.org
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div
            className="inline-flex rounded-full border border-night-700 bg-night-900/60 p-0.5"
            role="tablist"
            aria-label="Vista"
          >
            {(
              [
                { value: 'dashboard', label: 'Dashboard' },
                { value: 'sky3d', label: 'Sfera 3D' },
                { value: 'solar3d', label: 'Sistema solare' },
                { value: 'chart2d', label: 'Mappa 2D' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                role="tab"
                aria-selected={view === opt.value}
                onClick={() => setView(opt.value)}
                className={`rounded-full px-3 py-1 transition ${
                  view === opt.value
                    ? 'bg-night-700 text-slate-50'
                    : 'text-night-300 hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPickerOpen(true)}
            className="rounded-full border border-night-700 bg-night-900/60 px-3 py-1 transition hover:border-night-500 hover:bg-night-800"
          >
            {location
              ? `${location.name} · ${location.lat.toFixed(2)}°, ${location.lon.toFixed(2)}°`
              : 'Scegli posizione'}
          </button>
          <span className="rounded-full border border-night-800 bg-night-900/40 px-3 py-1 text-night-300">
            {formatDateTime(displayed)}
          </span>
          <button
            onClick={() => setNightRedMode(!nightRedMode)}
            title={
              nightRedMode
                ? 'Disattiva modalità rossa notturna'
                : 'Attiva modalità rossa (preserva visione scotopica)'
            }
            aria-pressed={nightRedMode}
            className={`rounded-full border px-3 py-1 transition ${
              nightRedMode
                ? 'border-rose-500 bg-rose-900/40 text-rose-200'
                : 'border-night-700 bg-night-900/60 text-night-300 hover:border-night-500 hover:bg-night-800 hover:text-slate-100'
            }`}
          >
            {nightRedMode ? '🔴 Notte' : '🌙 Notte'}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Impostazioni e notifiche"
            aria-label="Impostazioni"
            className="rounded-full border border-night-700 bg-night-900/60 px-3 py-1 text-night-300 transition hover:border-night-500 hover:bg-night-800 hover:text-slate-100"
          >
            ⚙
          </button>
          <button
            onClick={onShare}
            title="Copia link condivisibile con posizione, vista e tempo correnti"
            className={`rounded-full border px-3 py-1 transition ${
              shareLabel === 'copied'
                ? 'border-emerald-500 bg-emerald-900/40 text-emerald-200'
                : shareLabel === 'failed'
                  ? 'border-rose-500 bg-rose-900/40 text-rose-200'
                  : 'border-night-700 bg-night-900/60 text-night-300 hover:border-night-500 hover:bg-night-800 hover:text-slate-100'
            }`}
          >
            {shareLabel === 'copied' ? '✓ Copiato' : shareLabel === 'failed' ? 'Errore' : 'Condividi'}
          </button>

          <span
            className="hidden rounded-full border border-night-800/50 bg-night-900/30 px-2.5 py-1 text-[10px] text-night-500 sm:inline-block"
          >
            V. {new Date(__GIT_DATE__).toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>
      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
