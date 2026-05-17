import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Location = {
  lat: number;
  lon: number;
  name: string;
  source: 'geolocation' | 'search' | 'manual';
};

export type TimeMode = 'real' | 'simulated';
export type View = 'dashboard' | 'sky3d' | 'solar3d' | 'chart2d';

export type NotificationCategory =
  | 'bestNight'
  | 'issPass'
  | 'moonPhase'
  | 'astroEvent'
  | 'aurora';

export type NotificationPrefs = {
  /** Master switch — false until user has explicitly enabled and granted permission. */
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  /** Per-category last-fired timestamp (ms epoch), used to avoid spamming. */
  lastFired: Partial<Record<NotificationCategory, number>>;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  categories: {
    bestNight: true,
    issPass: false,
    moonPhase: true,
    astroEvent: true,
    aurora: true,
  },
  lastFired: {},
};

type Store = {
  location: Location | null;
  setLocation: (loc: Location | null) => void;

  view: View;
  setView: (v: View) => void;

  /** True once the user has completed the first-launch onboarding. */
  hasOnboarded: boolean;
  setHasOnboarded: (b: boolean) => void;

  /** Red-only theme that preserves scotopic (dark-adapted) night vision. */
  nightRedMode: boolean;
  setNightRedMode: (b: boolean) => void;

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

  notifications: NotificationPrefs;
  setNotificationsEnabled: (b: boolean) => void;
  setNotificationCategory: (c: NotificationCategory, b: boolean) => void;
  markNotificationFired: (c: NotificationCategory, at: number) => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      location: null,
      setLocation: (loc) => set({ location: loc }),

      view: 'dashboard',
      setView: (v) => set({ view: v }),

      hasOnboarded: false,
      setHasOnboarded: (b) => set({ hasOnboarded: b }),

      nightRedMode: false,
      setNightRedMode: (b) => set({ nightRedMode: b }),

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

      notifications: DEFAULT_NOTIFICATION_PREFS,
      setNotificationsEnabled: (b) =>
        set((s) => ({ notifications: { ...s.notifications, enabled: b } })),
      setNotificationCategory: (c, b) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            categories: { ...s.notifications.categories, [c]: b },
          },
        })),
      markNotificationFired: (c, at) =>
        set((s) => ({
          notifications: {
            ...s.notifications,
            lastFired: { ...s.notifications.lastFired, [c]: at },
          },
        })),
    }),
    {
      name: 'astri-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        location: s.location,
        speed: s.speed,
        view: s.view,
        hasOnboarded: s.hasOnboarded,
        timeMode: s.timeMode,
        simulatedTime: s.simulatedTime,
        isPlaying: s.isPlaying,
        nightRedMode: s.nightRedMode,
        notifications: s.notifications,
      }),
    },
  ),
);
