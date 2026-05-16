import { useCallback, useEffect, useRef, useState } from 'react';
import GIF from 'gif.js';
import gifWorkerUrl from 'gif.js/dist/gif.worker.js?url';
import { toObserver } from '@/core/astronomy/observer';
import { sunTrajectory } from '@/core/astronomy/sun';
import { drawSkyChart } from '@/core/astronomy/sky-chart-draw';
import { useDisplayTime } from '@/state/useDisplayTime';
import { useStore } from '@/state/store';

const CHART_SIZE = 700;
const GIF_SIZE = 640;

type GifPhase = 'idle' | 'capturing' | 'encoding';

export default function SkyChart2D() {
  const location = useStore((s) => s.location);
  const displayed = useDisplayTime();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gifPhase, setGifPhase] = useState<GifPhase>('idle');
  const [gifProgress, setGifProgress] = useState({ frame: 0, total: 0, encoding: 0 });

  // Draw on every time/location change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !location) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const observer = toObserver(location);
    drawSkyChart(ctx, displayed, observer, CHART_SIZE, CHART_SIZE, {
      locationName: location.name,
      showTime: true,
    });
  }, [displayed, location]);

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
        className="max-h-full max-w-full"
        style={{ imageRendering: 'crisp-edges' }}
      />

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

      {/* Buttons */}
      <div className="pointer-events-auto absolute bottom-4 right-4 flex gap-2">
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
        </div>
      </div>
    </div>
  );
}
