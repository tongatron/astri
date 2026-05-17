import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useStore } from './state/store';

const INITIAL_STATE = useStore.getState();

function resetStore() {
  useStore.setState({
    ...INITIAL_STATE,
    location: { lat: 41.9, lon: 12.5, name: 'Roma', source: 'manual' },
    hasOnboarded: true,
    view: 'dashboard',
    timeMode: 'real',
    isPlaying: false,
  });
}

describe('<App>', () => {
  beforeEach(() => {
    // ObservingDashboard fetches weather; stub fetch to a pending promise so
    // the hook stays in `loading` without throwing.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the header and the dashboard by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /astri/i, level: 1 })).toBeInTheDocument();
    // Tab list with all four views.
    expect(screen.getByRole('tab', { name: /dashboard/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /sfera 3d/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sistema solare/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mappa 2d/i })).toBeInTheDocument();
  });

  it('hides the onboarding modal once onboarded with a location', () => {
    render(<App />);
    expect(screen.queryByRole('heading', { name: /benvenuto in astri/i })).not.toBeInTheDocument();
  });

  it('shows the share button in the header', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /condividi/i })).toBeInTheDocument();
  });
});
