import Header from './components/ui/Header';
import ObservingDashboard from './components/ui/ObservingDashboard';
import Sidebar from './components/ui/Sidebar';
import TimeControls from './components/ui/TimeControls';

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex-1 overflow-hidden">
          <ObservingDashboard />
        </main>
      </div>
      <TimeControls />
    </div>
  );
}
