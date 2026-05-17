import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { reverse, search, type NominatimResult } from '@/core/location/nominatim';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LocationPicker({ open, onClose }: Props) {
  const setLocation = useStore((s) => s.setLocation);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const rows = await search(query.trim(), ctrl.signal);
        setResults(rows);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Ricerca non riuscita');
        }
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(id);
    };
  }, [query, open]);

  if (!open) return null;

  const useGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation non disponibile in questo browser');
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const rev = await reverse(lat, lon).catch(() => null);
        setLocation({
          lat,
          lon,
          name: rev?.shortName ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
          source: 'geolocation',
        });
        setBusy(false);
        onClose();
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Permesso negato. Sblocca la posizione nelle impostazioni del browser e riprova.',
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Posizione non disponibile. Controlla il GPS o la rete.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timeout: la posizione ha impiegato troppo. Riprova.');
        } else {
          setError(err.message || 'Errore sconosciuto');
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const pick = (r: NominatimResult) => {
    setLocation({
      lat: r.lat,
      lon: r.lon,
      name: r.shortName,
      source: 'search',
    });
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-night-950/70 p-4 pt-24 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-night-700 bg-night-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-night-800 p-4">
          <h2 className="text-sm font-semibold">Scegli la tua posizione</h2>
          <p className="mt-1 text-xs text-night-300">
            Usata per calcolare cosa è visibile dal tuo cielo.
          </p>
        </div>
        <div className="space-y-3 p-4">
          <button
            onClick={useGeolocation}
            disabled={busy}
            className="w-full rounded-lg border border-night-700 bg-night-800 px-3 py-2 text-sm font-medium transition hover:bg-night-700 disabled:opacity-50"
          >
            📍 Usa la mia posizione
          </button>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca una città…"
              className="w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-sm placeholder-night-400 outline-none focus:border-night-500"
            />
            {busy && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night-400">
                …
              </span>
            )}
          </div>
          {error && <p className="text-xs text-red-300">{error}</p>}
          {results.length > 0 && (
            <ul className="max-h-64 overflow-y-auto rounded-lg border border-night-800">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => pick(r)}
                    className="block w-full px-3 py-2 text-left text-sm transition hover:bg-night-800"
                  >
                    <div className="font-medium">{r.shortName}</div>
                    <div className="truncate text-xs text-night-400">
                      {r.displayName}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end border-t border-night-800 p-3">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs text-night-300 transition hover:text-slate-100"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
