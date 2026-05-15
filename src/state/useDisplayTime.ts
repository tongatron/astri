import { useEffect, useRef, useState } from 'react';
import { useStore } from './store';

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
