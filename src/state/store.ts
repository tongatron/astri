import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Location = {
  lat: number;
  lon: number;
  name: string;
  source: 'geolocation' | 'search' | 'manual';
};

export type TimeMode = 'real' | 'simulated';

type Store = {
  location: Location | null;
  setLocation: (loc: Location | null) => void;

  timeMode: TimeMode;
  /** Epoch ms when in simulated mode. Ignored when mode === 'real'. */
  simulatedTime: number;
  isPlaying: boolean;
  /** Multiplier on real seconds (1 = realtime, 60 = 1 min/s, 86400 = 1 day/s). */
  speed: number;

  setMode: (m: TimeMode) => void;
  setSimulatedTime: (t: number) => void;
  setIsPlaying: (b: boolean) => void;
  setSpeed: (s: number) => void;
  /** Switch to simulated and bump time by deltaMs. */
  step: (deltaMs: number) => void;
  /** Back to real-time. */
  resetToNow: () => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      location: null,
      setLocation: (loc) => set({ location: loc }),

      timeMode: 'real',
      simulatedTime: Date.now(),
      isPlaying: false,
      speed: 60,

      setMode: (m) =>
        set((s) => ({
          timeMode: m,
          simulatedTime: m === 'simulated' ? s.simulatedTime : Date.now(),
        })),
      setSimulatedTime: (t) => set({ simulatedTime: t, timeMode: 'simulated' }),
      setIsPlaying: (b) => set({ isPlaying: b }),
      setSpeed: (s) => set({ speed: s }),

      step: (deltaMs) => {
        const s = get();
        const base = s.timeMode === 'real' ? Date.now() : s.simulatedTime;
        set({ timeMode: 'simulated', simulatedTime: base + deltaMs });
      },

      resetToNow: () =>
        set({ timeMode: 'real', simulatedTime: Date.now(), isPlaying: false }),
    }),
    {
      name: 'astri-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ location: s.location, speed: s.speed }),
    },
  ),
);
