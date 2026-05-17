import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';

const quantize = (t: number, stepMs: number): number =>
  Math.floor(t / stepMs) * stepMs;

/**
 * Returns the time currently being displayed (as a Date).
 * - In 'real' mode: ticks every second from the system clock.
 * - In 'simulated' mode while playing: advances simulatedTime by `speed * dt`.
 * - In 'simulated' mode while paused: returns the frozen simulatedTime.
 */
export function useDisplayTime(): Date {
  const timeMode = useStore((s) => s.timeMode);
  const simulatedTime = useStore((s) => s.simulatedTime);
  const isPlaying = useStore((s) => s.isPlaying);
  const speed = useStore((s) => s.speed);
  const setSimulatedTime = useStore((s) => s.setSimulatedTime);

  const [now, setNow] = useState(() => Date.now());
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    if (timeMode === 'real') {
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }
    if (!isPlaying) return;

    let raf: number;
    lastTickRef.current = performance.now();
    const loop = () => {
      const t = performance.now();
      const dtMs = t - lastTickRef.current;
      lastTickRef.current = t;
      setSimulatedTime(
        useStore.getState().simulatedTime + dtMs * speed,
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timeMode, isPlaying, speed, setSimulatedTime]);

  return new Date(timeMode === 'real' ? now : simulatedTime);
}

/**
 * Like {@link useDisplayTime} but snapped to a `stepMs` grid so consumers
 * doing heavy astronomy work don't recompute every second. Real-mode ticks
 * are aligned to wall-clock boundaries (e.g. :00 / :15 / :30 / :45 for a
 * 15-minute step). In simulated mode the value snaps every time the user
 * crosses a step boundary by scrubbing or playback.
 */
export function useQuantizedDisplayTime(stepMs: number): Date {
  const timeMode = useStore((s) => s.timeMode);
  const isPlaying = useStore((s) => s.isPlaying);
  const speed = useStore((s) => s.speed);
  const setSimulatedTime = useStore((s) => s.setSimulatedTime);
  // Subscribe to the quantized simulated time so this component only
  // re-renders when crossing a step boundary in simulated mode.
  const simQuantized = useStore((s) => quantize(s.simulatedTime, stepMs));

  const [realNow, setRealNow] = useState(() => quantize(Date.now(), stepMs));
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    if (timeMode === 'real') {
      // Align the first refresh to the next step boundary, then tick at stepMs.
      const align = stepMs - (Date.now() % stepMs);
      let interval: ReturnType<typeof setInterval> | undefined;
      const timeout = setTimeout(() => {
        setRealNow(quantize(Date.now(), stepMs));
        interval = setInterval(
          () => setRealNow(quantize(Date.now(), stepMs)),
          stepMs,
        );
      }, align);
      return () => {
        clearTimeout(timeout);
        if (interval) clearInterval(interval);
      };
    }
    if (!isPlaying) return;
    // Simulated playback: keep advancing the store at RAF rate so the
    // underlying simulatedTime is fresh; the selector above filters it.
    let raf: number;
    lastTickRef.current = performance.now();
    const loop = () => {
      const t = performance.now();
      const dtMs = t - lastTickRef.current;
      lastTickRef.current = t;
      setSimulatedTime(useStore.getState().simulatedTime + dtMs * speed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [timeMode, isPlaying, speed, setSimulatedTime, stepMs]);

  return new Date(timeMode === 'real' ? realNow : simQuantized);
}
