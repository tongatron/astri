import { useState } from 'react';
import { useStore } from '@/state/store';
import { useDisplayTime } from '@/state/useDisplayTime';
import { formatDateTime } from '@/core/time/format';
import LocationPicker from './LocationPicker';

export default function Header() {
  const location = useStore((s) => s.location);
  const [pickerOpen, setPickerOpen] = useState(false);
  const displayed = useDisplayTime();

  return (
    <>
      <header className="flex items-center justify-between border-b border-night-800/60 bg-night-950/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-full bg-gradient-to-br from-sun to-moon shadow-[0_0_20px_rgba(255,209,102,0.5)]" />
          <div>
            <h1 className="text-base font-semibold tracking-tight">Astri</h1>
            <p className="text-xs text-night-300">Cielo notturno interattivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
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
        </div>
      </header>
      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
