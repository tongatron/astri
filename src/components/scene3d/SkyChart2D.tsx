import { useCallback, useEffect, useRef, useState } from 'react';
import GIF from 'gif.js';
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url';
import { toObserver } from '@/core/astronomy/observer';
import { sunTrajectory } from '@/core/astronomy/sun';
import { drawSkyChart, type SkyChartHitTest } from '@/core/astronomy/sky-chart-draw';
import { useDisplayTime } from '@/state/useDisplayTime';
import { useStore } from '@/state/store';
import {
  MESSIER,
  MESSIER_NOTES,
  MESSIER_TYPE_LABEL,
  messierInstrument,
} from '@/data/messier';
import MessierLegend from '@/components/ui/MessierLegend';

type CompassState = 'unsupported' | 'idle' | 'active';

function useCompass(): { state: CompassState; heading: number; toggle: () => void } {
  const [state, setState] = useState<CompassState>(() =>
    typeof DeviceOrientationEvent !== 'undefined' ? 'idle' : 'unsupported',
  );
  const [heading, setHeading] = useState(0);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    // iOS: webkitCompassHeading; Android: derive from alpha
    const h =
      (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ??
      (e.alpha != null ? (360 - e.alpha) % 360 : null);
    if (h != null) setHeading(Math.round(h));
  }, []);

  const toggle = useCallback(async () => {
    if (state === 'unsupported') return;
    if (state === 'active') {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
      setState('idle');
      setHeading(0);
      return;
    }
    // Request permission on iOS 13+
    const DOEP = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOEP.requestPermission === 'function') {
      const perm = await DOEP.requestPermission();
      if (perm !== 'granted') return;
    }
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    setState('active');
  }, [state, handleOrientation]);

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
    };
  }, [handleOrientation]);

  return { state, heading, toggle };
}

const CHART_SIZE = 700;
const GIF_SIZE = 640;

type GifPhase = 'idle' | 'capturing' | 'encoding';

export default function SkyChart2D() {
  const location = useStore((s) => s.location);
  const displayed = useDisplayTime();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gifPhase, setGifPhase] = useState<GifPhase>('idle');
  const [gifProgress, setGifProgress] = useState({ frame: 0, total: 0, encoding: 0 });
  const compass = useCompass();
  const [showMessier, setShowMessier] = useState(false);
  const [messierMagLimit, setMessierMagLimit] = useState(7);
  const [messierLegendOpen, setMessierLegendOpen] = useState(false);
  const [selectedMessier, setSelectedMessier] = useState<string | null>(null);
  const hitTestRef = useRef<SkyChartHitTest>({ messier: [] });

  // Draw on every time/location/compass change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !location) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const observer = toObserver(location);
      hitTestRef.current = drawSkyChart(ctx, displayed, observer, CHART_SIZE, CHART_SIZE, {
        locationName: location.name,
        showTime: true,
        compassHeading: compass.state === 'active' ? compass.heading : undefined,
        messierMagLimit: showMessier ? messierMagLimit : undefined,
      });
    } catch (err) {
      console.error('[SkyChart2D] draw error:', err);
    }
  }, [displayed, location, compass.state, compass.heading, showMessier, messierMagLimit]);

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showMessier) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CHART_SIZE / rect.width;
    const scaleY = CHART_SIZE / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    let best: { id: string; d: number } | null = null;
    for (const mark of hitTestRef.current.messier) {
      const d = Math.hypot(mark.x - px, mark.y - py);
      const threshold = Math.max(mark.r + 6, 10);
      if (d <= threshold && (!best || d < best.d)) {
        best = { id: mark.id, d };
      }
    }
    setSelectedMessier(best ? best.id : null);
  }, [showMessier]);

  const selectedObj = selectedMessier
    ? MESSIER.find((m) => m.id === selectedMessier) ?? null
    : null;

  const startGif = useCallback(async () => {
    if (!location) return;

    const observer = toObserver(location);
    const dayStart = new Date(displayed);
    dayStart.setHours(0, 0, 0, 0);
    const sunTrack = sunTrajectory(dayStart, observer, 30);
    const nightFrames = sunTrack.filter((s) => s.altitude < -12).map((s) => s.t);

    if (nightFrames.length === 0) {
      alert('Nessuna oscurità astronomica in questa data.');
      return;
    }

    setGifPhase('capturing');
    setGifProgress({ frame: 0, total: nightFrames.length, encoding: 0 });

    // Render each frame to an offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = GIF_SIZE;
    offscreen.height = GIF_SIZE;
    const ctx = offscreen.getContext('2d')!;

    const dataURLs: string[] = [];
    for (let i = 0; i < nightFrames.length; i++) {
      drawSkyChart(ctx, nightFrames[i], observer, GIF_SIZE, GIF_SIZE, {
        locationName: location.name,
        showTime: true,
      });
      dataURLs.push(offscreen.toDataURL('image/png'));
      setGifProgress({ frame: i + 1, total: nightFrames.length, encoding: 0 });
      await new Promise((r) => setTimeout(r, 0));
    }

    setGifPhase('encoding');

    await new Promise<void>((resolve) => {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: GIF_SIZE,
        height: GIF_SIZE,
        workerScript: gifWorkerUrl,
      });

      const enc = document.createElement('canvas');
      enc.width = GIF_SIZE;
      enc.height = GIF_SIZE;
      const encCtx = enc.getContext('2d')!;

      let loaded = 0;
      for (const url of dataURLs) {
        const img = new Image();
        img.onload = () => {
          encCtx.clearRect(0, 0, GIF_SIZE, GIF_SIZE);
          encCtx.drawImage(img, 0, 0);
          gif.addFrame(enc, { delay: 350, copy: true });
          loaded++;
          if (loaded === dataURLs.length) {
            gif.on('progress', (p) =>
              setGifProgress((prev) => ({ ...prev, encoding: Math.round(p * 100) })),
            );
            gif.on('finished', (blob) => {
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `astri-mappa-${location.name.toLowerCase().replace(/\s+/g, '-')}.gif`;
              a.click();
              URL.revokeObjectURL(a.href);
              setGifPhase('idle');
              resolve();
            });
            gif.render();
          }
        };
        img.src = url;
      }
    });
  }, [location, displayed]);

  if (!location) {
    return (
      <div className="grid h-full place-items-center text-center text-night-300">
        Seleziona una posizione per vedere la mappa del cielo.
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(6,12,35,0.9),rgba(2,6,23,1))]">
      <canvas
        ref={canvasRef}
        width={CHART_SIZE}
        height={CHART_SIZE}
        onClick={onCanvasClick}
        className={`max-h-full max-w-full ${showMessier ? 'cursor-crosshair' : ''}`}
        style={{ imageRendering: 'crisp-edges' }}
      />

      {selectedObj && (
        <div className="pointer-events-auto absolute top-4 left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-night-700 bg-night-950/95 px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-50">
                {selectedObj.name ? `${selectedObj.id} · ${selectedObj.name}` : selectedObj.id}
              </div>
              <div className="mt-0.5 truncate text-xs text-night-300">
                {MESSIER_TYPE_LABEL[selectedObj.type]} · {selectedObj.constellation}
              </div>
            </div>
            <button
              onClick={() => setSelectedMessier(null)}
              className="rounded-full border border-night-700 px-2 py-0.5 text-xs text-night-300 transition hover:border-night-500 hover:text-slate-100"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-night-200">
            <li>Magnitudine {selectedObj.magnitude.toFixed(1)} · {messierInstrument(selectedObj.magnitude)}</li>
            <li>Coordinate equatoriali {selectedObj.raHours.toFixed(2)}h, {selectedObj.decDeg.toFixed(2)}°</li>
            {MESSIER_NOTES[selectedObj.id] && (
              <li className="pt-1 text-night-300">{MESSIER_NOTES[selectedObj.id]}</li>
            )}
          </ul>
        </div>
      )}

      {/* Compass active — facing direction hint */}
      {compass.state === 'active' && (
        <div className="pointer-events-none absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 rounded-md border border-sky-700/50 bg-night-950/80 px-3 py-1.5 text-center text-[11px] text-sky-300 backdrop-blur">
          Stai guardando verso <span className="font-semibold">{compass.heading}°</span>
          {' · '}tieni il telefono orizzontale puntato verso il cielo
        </div>
      )}

      {/* GIF overlay */}
      {gifPhase !== 'idle' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-night-950/70 backdrop-blur-sm">
          <div className="rounded-xl border border-night-700 bg-night-950/90 px-8 py-6 text-center shadow-2xl">
            {gifPhase === 'capturing' ? (
              <>
                <div className="text-sm font-semibold text-slate-100">Rendering frame</div>
                <div className="mt-2 text-2xl font-bold text-emerald-300">
                  {gifProgress.frame} / {gifProgress.total}
                </div>
                <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-night-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(gifProgress.frame / gifProgress.total) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-100">Codifica GIF</div>
                <div className="mt-2 text-2xl font-bold text-sky-300">{gifProgress.encoding}%</div>
                <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-night-800">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all"
                    style={{ width: `${gifProgress.encoding}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Messier panel */}
      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowMessier((v) => !v)}
            className={[
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur transition',
              showMessier
                ? 'border-fuchsia-500 bg-fuchsia-900/40 text-fuchsia-200 hover:bg-fuchsia-900/60'
                : 'border-night-700 bg-night-950/80 text-slate-200 hover:border-fuchsia-700 hover:bg-fuchsia-900/30 hover:text-fuchsia-200',
            ].join(' ')}
            title="Mostra il catalogo Messier (M1–M110): nebulose, ammassi, galassie"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            </svg>
            Messier {showMessier ? '(on)' : '(off)'}
          </button>
          <button
            onClick={() => setMessierLegendOpen(true)}
            title="Legenda e spiegazioni del catalogo Messier"
            aria-label="Apri legenda Messier"
            className="flex size-9 items-center justify-center rounded-lg border border-night-700 bg-night-950/80 text-xs font-bold text-night-300 shadow-lg backdrop-blur transition hover:border-fuchsia-700 hover:bg-fuchsia-900/30 hover:text-fuchsia-200"
          >
            ?
          </button>
        </div>
        {showMessier && (
          <div className="rounded-lg border border-night-700 bg-night-950/85 px-3 py-2 text-[10px] text-night-300 shadow-lg backdrop-blur">
            <label className="flex items-center gap-2">
              <span>Mag ≤</span>
              <input
                type="range"
                min={3}
                max={10}
                step={0.5}
                value={messierMagLimit}
                onChange={(e) => setMessierMagLimit(parseFloat(e.target.value))}
                className="accent-fuchsia-400"
              />
              <span className="w-6 text-right font-semibold text-slate-200">
                {messierMagLimit.toFixed(1)}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="pointer-events-auto absolute bottom-4 right-4 flex gap-2">
        {/* Compass toggle */}
        <button
          onClick={compass.toggle}
          disabled={compass.state === 'unsupported'}
          title={
            compass.state === 'unsupported'
              ? 'Bussola non disponibile su questo dispositivo'
              : compass.state === 'active'
                ? `Bussola attiva — stai guardando verso ${compass.heading}°`
                : 'Ruota la mappa in base alla direzione che stai guardando'
          }
          className={[
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur transition',
            compass.state === 'active'
              ? 'border-sky-500 bg-sky-900/50 text-sky-200 hover:bg-sky-900/70'
              : 'border-night-700 bg-night-950/80 text-slate-200 hover:border-sky-700 hover:bg-sky-900/30 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-40',
          ].join(' ')}
        >
          {/* Compass icon */}
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
            <path
              d="M12 2v4M12 18v4M2 12h4M18 12h4"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <path d="M12 12l-3-5 3 2 3-2-3 5z" fill="currentColor" stroke="none" />
          </svg>
          {compass.state === 'active' ? `${compass.heading}° ` : ''}Bussola
        </button>

        <button
          onClick={startGif}
          disabled={gifPhase !== 'idle'}
          className="flex items-center gap-2 rounded-lg border border-night-700 bg-night-950/80 px-3 py-2 text-xs font-medium text-slate-200 shadow-lg backdrop-blur transition hover:border-emerald-700 hover:bg-emerald-900/40 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
          title="Genera GIF animata della notte corrente"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.258a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          GIF notte
        </button>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-night-800/70 bg-night-950/75 px-2.5 py-2 text-[10px] leading-snug text-night-300">
        <div className="font-semibold text-slate-200">Legenda</div>
        <div className="mt-1 space-y-0.5">
          <div><span className="text-amber-400">●</span> orizzonte / cardinali</div>
          <div><span className="text-orange-400">- -</span> eclittica</div>
          <div><span className="text-slate-300">●</span> stelle</div>
          <div><span className="text-sky-300">- -</span> linee costellazioni</div>
          {showMessier && (
            <>
              <div className="mt-1 border-t border-night-800 pt-1 font-semibold text-slate-200">Messier</div>
              <div><span className="text-amber-300">◌</span> ammasso aperto/globulare</div>
              <div><span className="text-fuchsia-300">▢</span> nebulosa</div>
              <div><span className="text-violet-300">◇</span> planetaria / SNR</div>
              <div><span className="text-cyan-300">○</span> galassia</div>
            </>
          )}
        </div>
      </div>
      <MessierLegend open={messierLegendOpen} onClose={() => setMessierLegendOpen(false)} />
    </div>
  );
}
