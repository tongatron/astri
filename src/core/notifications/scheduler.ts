/**
 * Local notification scheduler.
 *
 * On a static PWA (no backend) we can't push real notifications when the app
 * is closed. Instead we check conditions whenever the app is opened (or comes
 * back into focus) and surface alerts via the Notification API. Each category
 * is throttled by a "lastFired" timestamp to avoid spamming.
 */
import type { Location, NotificationCategory } from '@/state/store';

const MIN_FIRE_INTERVAL_MS: Record<NotificationCategory, number> = {
  bestNight: 24 * 60 * 60_000, // once per day
  issPass: 3 * 60 * 60_000, // every 3h
  moonPhase: 12 * 60 * 60_000, // twice per day max
  astroEvent: 24 * 60 * 60_000,
};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionState(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export type NotificationPayload = {
  category: NotificationCategory;
  title: string;
  body: string;
  /** Tag used for de-duplication at the OS level. */
  tag?: string;
};

/**
 * Fire a notification if the user has granted permission and the category
 * isn't throttled. Returns true if the notification was actually shown.
 */
export async function fireNotification(
  payload: NotificationPayload,
  lastFiredAt: number | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  const minInterval = MIN_FIRE_INTERVAL_MS[payload.category];
  if (lastFiredAt && now - lastFiredAt < minInterval) return false;

  try {
    // Prefer Service Worker registration so notifications survive page reloads
    // and look "native" on Android; fall back to the legacy constructor.
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          tag: payload.tag ?? payload.category,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
        return true;
      }
    }
    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag ?? payload.category,
      icon: '/icon.svg',
    });
    return true;
  } catch {
    return false;
  }
}

export type Candidate = {
  category: NotificationCategory;
  payload: NotificationPayload;
};

/**
 * Build candidate notifications from current location and observation context.
 * The caller decides which ones actually fire based on user prefs.
 */
export function buildCandidates(input: {
  location: Location;
  tonightScore: number | null;
  tonightCloud: number | null;
  bortleClass: number | null;
  moonPhaseName: string | null;
  moonIllumination: number;
  upcomingEventTitle: string | null;
}): Candidate[] {
  const out: Candidate[] = [];

  // Best night: high score, low clouds
  if (
    input.tonightScore !== null &&
    input.tonightScore >= 65 &&
    (input.tonightCloud === null || input.tonightCloud < 30)
  ) {
    out.push({
      category: 'bestNight',
      payload: {
        category: 'bestNight',
        title: '✨ Notte ottima stasera',
        body: `Da ${input.location.name}: condizioni favorevoli (Bortle ${input.bortleClass ?? '?'}, cielo ${
          input.tonightCloud !== null ? Math.round(input.tonightCloud) + '%' : 'sereno'
        }).`,
      },
    });
  }

  // Moon phase: full or new moon (illumination ≈ 1 or ≈ 0)
  if (input.moonPhaseName) {
    if (input.moonIllumination >= 0.97) {
      out.push({
        category: 'moonPhase',
        payload: {
          category: 'moonPhase',
          title: '🌕 Luna piena',
          body: 'Stasera la Luna è piena: spettacolare a occhio nudo, difficile per il deep-sky.',
        },
      });
    } else if (input.moonIllumination <= 0.03) {
      out.push({
        category: 'moonPhase',
        payload: {
          category: 'moonPhase',
          title: '🌑 Luna nuova',
          body: 'Notte buia: condizioni ideali per nebulose e galassie.',
        },
      });
    }
  }

  // Upcoming astronomical event
  if (input.upcomingEventTitle) {
    out.push({
      category: 'astroEvent',
      payload: {
        category: 'astroEvent',
        title: '🔭 Evento astronomico',
        body: input.upcomingEventTitle,
      },
    });
  }

  return out;
}
