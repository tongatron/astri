import { lazy, Suspense, useEffect } from 'react';
import Header from './components/ui/Header';
import ObservingDashboard from './components/ui/ObservingDashboard';
import OnboardingModal from './components/ui/OnboardingModal';
import SceneErrorBoundary from './components/ui/SceneErrorBoundary';
import TimeControls from './components/ui/TimeControls';
import { useStore } from './state/store';
import { parseUrlState } from './state/urlState';

const SkySphere3D = lazy(() => import('./components/scene3d/SkySphere3D'));
const SolarSystem3D = lazy(() => import('./components/scene3d/SolarSystem3D'));
const SkyChart2D = lazy(() => import('./components/scene3d/SkyChart2D'));

function SceneFallback({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center text-sm text-night-300">
      Caricamento {label}…
    </div>
  );
}

export default function App() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const backToDashboard = () => setView('dashboard');

  useEffect(() => {
    const parsed = parseUrlState(window.location.search);
    if (!parsed.location && !parsed.view && !parsed.simulatedTime) return;
    const s = useStore.getState();
    if (parsed.location) s.setLocation(parsed.location);
    if (parsed.view) s.setView(parsed.view);
    if (parsed.simulatedTime) s.setSimulatedTime(parsed.simulatedTime);
    // Strip params from address bar so reloads don't override later edits.
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }, []);
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1 overflow-hidden">
          {view === 'sky3d' ? (
            <SceneErrorBoundary label="sfera celeste" onReset={backToDashboard}>
              <Suspense fallback={<SceneFallback label="sfera celeste" />}>
                <SkySphere3D />
              </Suspense>
            </SceneErrorBoundary>
          ) : view === 'solar3d' ? (
            <SceneErrorBoundary label="sistema solare" onReset={backToDashboard}>
              <Suspense fallback={<SceneFallback label="sistema solare" />}>
                <SolarSystem3D />
              </Suspense>
            </SceneErrorBoundary>
          ) : view === 'chart2d' ? (
            <SceneErrorBoundary label="mappa del cielo" onReset={backToDashboard}>
              <Suspense fallback={<SceneFallback label="mappa del cielo" />}>
                <SkyChart2D />
              </Suspense>
            </SceneErrorBoundary>
          ) : (
            <ObservingDashboard />
          )}
        </main>
      </div>
      <TimeControls />
      <OnboardingModal />
    </div>
  );
}
