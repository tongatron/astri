import { lazy, Suspense } from 'react';
import Header from './components/ui/Header';
import ObservingDashboard from './components/ui/ObservingDashboard';
import Sidebar from './components/ui/Sidebar';
import TimeControls from './components/ui/TimeControls';
import { useStore } from './state/store';

const SkySphere3D = lazy(() => import('./components/scene3d/SkySphere3D'));

function SkyFallback() {
  return (
    <div className="grid h-full place-items-center text-sm text-night-300">
      Caricamento sfera celeste…
    </div>
  );
}

export default function App() {
  const view = useStore((s) => s.view);
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-hidden">
          {view === 'sky3d' ? (
            <Suspense fallback={<SkyFallback />}>
              <SkySphere3D />
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
