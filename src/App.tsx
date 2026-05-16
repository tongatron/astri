import { lazy, Suspense } from 'react';
import Header from './components/ui/Header';
import ObservingDashboard from './components/ui/ObservingDashboard';
import Sidebar from './components/ui/Sidebar';
import TimeControls from './components/ui/TimeControls';
import { useStore } from './state/store';
import { useApplyShareUrlOnMount } from './state/shareUrl';

const SkySphere3D = lazy(() => import('./components/scene3d/SkySphere3D'));
const SolarSystem3D = lazy(() => import('./components/scene3d/SolarSystem3D'));

function SceneFallback({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center text-sm text-night-300">
      Caricamento {label}…
    </div>
  );
}

export default function App() {
  useApplyShareUrlOnMount();
  const view = useStore((s) => s.view);
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-hidden">
          {view === 'sky3d' ? (
            <Suspense fallback={<SceneFallback label="sfera celeste" />}>
              <SkySphere3D />
            </Suspense>
          ) : view === 'solar3d' ? (
            <Suspense fallback={<SceneFallback label="sistema solare" />}>
              <SolarSystem3D />
            </Suspense>
          ) : (
            <ObservingDashboard />
          )}
        </main>
      </div>
      <TimeControls />
    </div>
  );
}
