import { useEffect } from 'react';
import { useStore } from './store';
import { buildCandidates, fireNotification } from '@/core/notifications/scheduler';
import { estimateBortle } from '@/core/light-pollution/bortle';
import { moonState } from '@/core/astronomy/moon';
import { toObserver } from '@/core/astronomy/observer';
import { upcomingPlanetEvents } from '@/core/astronomy/events';
import { fetchAuroraForecast, auroraVisibility } from '@/core/aurora/swpc';

/**
 * Runs once per app open + on visibility-change back to "visible".
 * Builds candidate notifications from current context and fires only the ones
 * the user has opted into and that aren't throttled by category.
 */
export function useNotificationScheduler() {
  const location = useStore((s) => s.location);
  const prefs = useStore((s) => s.notifications);
  const markFired = useStore((s) => s.markNotificationFired);

  useEffect(() => {
    if (!prefs.enabled || !location) return;

    const check = async () => {
      const now = new Date();
      const observer = toObserver(location);
      const moon = moonState(now, observer);
      const bortle = estimateBortle(location.lat, location.lon);

      // Aurora forecast (best-effort, swallow network errors)
      let auroraInput: Parameters<typeof buildCandidates>[0]['aurora'] = null;
      try {
        const f = await fetchAuroraForecast();
        const vis = auroraVisibility(f.currentKp, location.lat, location.lon);
        auroraInput = { currentKp: f.currentKp, visibility: vis.label };
      } catch {
        auroraInput = null;
      }

      // Next astronomical event in the next ~7 days (one month lookahead capped)
      let nextEventTitle: string | null = null;
      try {
        const events = upcomingPlanetEvents(now, 1);
        const soon = events.find(
          (e) => e.at.getTime() - now.getTime() < 7 * 24 * 3600_000,
        );
        if (soon) nextEventTitle = `${soon.label} il ${soon.at.toLocaleDateString('it-IT')}`;
      } catch {
        nextEventTitle = null;
      }

      const candidates = buildCandidates({
        location,
        tonightScore: null, // computed inside the Dashboard; skip here for simplicity
        tonightCloud: null,
        bortleClass: bortle.class,
        moonPhaseName: moon.phaseName ?? null,
        moonIllumination: moon.illumination,
        upcomingEventTitle: nextEventTitle,
        aurora: auroraInput,
      });

      for (const c of candidates) {
        if (!prefs.categories[c.category]) continue;
        const fired = await fireNotification(
          c.payload,
          prefs.lastFired[c.category],
        );
        if (fired) markFired(c.category, Date.now());
      }
    };

    // Initial check (small delay to let the page settle)
    const t = setTimeout(check, 1500);
    const onVis = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [prefs, location, markFired]);
}
