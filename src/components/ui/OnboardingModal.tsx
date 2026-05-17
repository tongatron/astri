import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/state/store';
import { reverse, search, type NominatimResult } from '@/core/location/nominatim';

type Step = 'welcome' | 'location' | 'tour';

const DEFAULT_LOC = { lat: 41.9028, lon: 12.4964, name: 'Roma', source: 'manual' as const };

export default function OnboardingModal() {
  const hasOnboarded = useStore((s) => s.hasOnboarded);
  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const setHasOnboarded = useStore((s) => s.setHasOnboarded);

  const [step, setStep] = useState<Step>(location ? 'tour' : 'welcome');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'location') {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [step]);

  useEffect(() => {
    if (step !== 'location' || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        setResults(await search(query.trim(), ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Ricerca non riuscita');
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(id);
    };
  }, [query, step]);

  if (hasOnboarded && location) return null;

  const useGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalizzazione non disponibile in questo browser');
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
        setStep('tour');
      },
      (err) => {
        setBusy(false);
        setError(err.message || 'Permesso negato');
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const pickResult = (r: NominatimResult) => {
    setLocation({ lat: r.lat, lon: r.lon, name: r.shortName, source: 'search' });
    setStep('tour');
  };

  const useDefault = () => {
    setLocation(DEFAULT_LOC);
    setStep('tour');
  };

  const finish = () => {
    setHasOnboarded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-night-700 bg-night-900 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        {step === 'welcome' && (
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-sun to-moon shadow-[0_0_24px_rgba(255,209,102,0.5)]" />
              <h2 className="text-xl font-semibold text-slate-50">Benvenuto in Astri</h2>
            </div>
            <p className="text-sm leading-relaxed text-night-200">
              Astri ti dice <span className="font-semibold text-slate-100">cosa guardare in cielo stasera</span> dal tuo balcone.
              Calcola in tempo reale posizioni di Sole, Luna, pianeti, ISS e oltre 100 oggetti del cielo profondo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-night-200">
              <li>🌙 <span className="text-slate-200">Questa notte</span> — finestre osservative con meteo reale</li>
              <li>🗺️ <span className="text-slate-200">Mappa del cielo</span> — orizzonte locale con bussola</li>
              <li>🪐 <span className="text-slate-200">Sfera 3D</span> — stelle, costellazioni, ISS in movimento</li>
              <li>📅 <span className="text-slate-200">Pianificatore</span> — la notte migliore nei prossimi 60 giorni</li>
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={finish}
                className="rounded-lg px-3 py-2 text-xs text-night-300 transition hover:text-slate-100"
              >
                Salta
              </button>
              <button
                onClick={() => setStep('location')}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-600"
              >
                Iniziamo
              </button>
            </div>
          </div>
        )}

        {step === 'location' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-50">Dove ti trovi?</h2>
            <p className="mt-1 text-xs text-night-300">
              Serve per calcolare cosa è visibile dal tuo cielo. Non lasciamo niente sul server.
            </p>

            <button
              onClick={useGeolocation}
              disabled={busy}
              className="mt-4 w-full rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-2.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-900/60 disabled:opacity-50"
            >
              📍 Usa la mia posizione
            </button>

            <div className="relative mt-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="oppure cerca una città…"
                className="w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2.5 text-sm placeholder-night-400 outline-none focus:border-night-500"
              />
              {busy && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-night-400">…</span>
              )}
            </div>

            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

            {results.length > 0 && (
              <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-night-800">
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => pickResult(r)}
                      className="block w-full px-3 py-2 text-left text-sm transition hover:bg-night-800"
                    >
                      <div className="font-medium text-slate-100">{r.shortName}</div>
                      <div className="truncate text-xs text-night-400">{r.displayName}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={useDefault}
                className="text-xs text-night-300 underline-offset-2 transition hover:text-slate-100 hover:underline"
              >
                Usa Roma per ora
              </button>
              <button
                onClick={() => setStep('welcome')}
                className="rounded-lg px-3 py-1.5 text-xs text-night-300 transition hover:text-slate-100"
              >
                ← Indietro
              </button>
            </div>
          </div>
        )}

        {step === 'tour' && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-50">Tutto pronto</h2>
            <p className="mt-1 text-xs text-night-300">
              {location ? `Posizione: ${location.name}` : 'Posizione impostata'}. Ecco le 4 viste:
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-night-700 bg-night-950/60 p-3">
                <div className="font-semibold text-slate-100">Dashboard</div>
                <div className="mt-1 text-night-300">Cosa vedere stasera, grafico altezze, prossimi eventi</div>
              </div>
              <div className="rounded-lg border border-night-700 bg-night-950/60 p-3">
                <div className="font-semibold text-slate-100">Sfera 3D</div>
                <div className="mt-1 text-night-300">Stelle, costellazioni, ISS — trascina per ruotare</div>
              </div>
              <div className="rounded-lg border border-night-700 bg-night-950/60 p-3">
                <div className="font-semibold text-slate-100">Sistema solare</div>
                <div className="mt-1 text-night-300">Vista eliocentrica con scrubbing temporale</div>
              </div>
              <div className="rounded-lg border border-night-700 bg-night-950/60 p-3">
                <div className="font-semibold text-slate-100">Mappa 2D</div>
                <div className="mt-1 text-night-300">Carta stellare, bussola da telefono, catalogo Messier</div>
              </div>
            </div>
            <p className="mt-4 text-xs text-night-400">
              Usa i controlli temporali in basso per fare scrubbing nella notte.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={finish}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-600"
              >
                Esplora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
