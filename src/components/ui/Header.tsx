import { useState } from 'react';
import { useStore } from '@/state/store';
import { useDisplayTime } from '@/state/useDisplayTime';
import { formatDateTime } from '@/core/time/format';
import LocationPicker from './LocationPicker';
import { buildShareUrl } from '@/state/shareUrl';

export default function Header() {
  const location = useStore((s) => s.location);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const displayed = useDisplayTime();

  const handleShare = async () => {
    const url = buildShareUrl(true);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied('ok');
    } catch {
      setShareCopied('fail');
    } finally {
      setTimeout(() => setShareCopied('idle'), 1800);
    }
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-night-800/60 bg-night-950/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-full bg-gradient-to-br from-sun to-moon shadow-[0_0_20px_rgba(255,209,102,0.5)]" />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Astri</h1>
            <p className="text-xs text-night-300">Cielo notturno interattivo</p>
          </div>
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
            onClick={handleShare}
            className="rounded-full border border-night-700 bg-night-900/60 px-3 py-1 transition hover:border-emerald-400/60 hover:bg-night-800"
            title="Copia un link che riapre Astri con questa posizione, tempo e vista"
          >
            {shareCopied === 'ok'
              ? '✓ Link copiato'
              : shareCopied === 'fail'
                ? 'Errore copia'
                : 'Condividi'}
          </button>
        </div>
      </header>
      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
