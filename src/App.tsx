import { lazy, Suspense } from 'react';
import Header from './components/ui/Header';
import ObservingDashboard from './components/ui/ObservingDashboard';
import SceneErrorBoundary from './components/ui/SceneErrorBoundary';
import TimeControls from './components/ui/TimeControls';
import { useStore } from './state/store';

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
    </div>
  );
}
