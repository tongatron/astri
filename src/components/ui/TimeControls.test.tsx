import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import TimeControls from './TimeControls';
import { useStore } from '@/state/store';

const INITIAL_STATE = useStore.getState();

function resetStore() {
  useStore.setState({
    ...INITIAL_STATE,
    location: { lat: 41.9, lon: 12.5, name: 'Roma', source: 'manual' },
    hasOnboarded: true,
    view: 'dashboard',
    timeMode: 'real',
    simulatedTime: Date.UTC(2026, 0, 1, 12, 0, 0),
    isPlaying: false,
    speed: 60,
  });
}

describe('<TimeControls> keyboard shortcuts', () => {
  beforeEach(() => {
    resetStore();
  });

  it('ArrowRight switches to simulated time at now + 1 hour', async () => {
    const user = userEvent.setup();
    render(<TimeControls />);
    const t0 = Date.now();
    await user.keyboard('{ArrowRight}');
    const offset = useStore.getState().simulatedTime - t0;
    expect(useStore.getState().timeMode).toBe('simulated');
    // step() rebases off Date.now() when starting from real mode; allow a
    // small jitter for the ms elapsed during the keypress handling.
    expect(offset).toBeGreaterThanOrEqual(3_600_000);
    expect(offset).toBeLessThan(3_600_000 + 1000);
  });

  it('Shift+ArrowLeft steps simulated time backward by 1 day', async () => {
    const user = userEvent.setup();
    render(<TimeControls />);
    useStore.setState({ timeMode: 'simulated' });
    const before = useStore.getState().simulatedTime;
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    const after = useStore.getState().simulatedTime;
    expect(before - after).toBe(86_400_000);
  });

  it('Space toggles play state', async () => {
    const user = userEvent.setup();
    render(<TimeControls />);
    expect(useStore.getState().isPlaying).toBe(false);
    await user.keyboard(' ');
    expect(useStore.getState().isPlaying).toBe(true);
    await user.keyboard(' ');
    expect(useStore.getState().isPlaying).toBe(false);
  });

  it('N returns to real time', async () => {
    const user = userEvent.setup();
    render(<TimeControls />);
    useStore.setState({ timeMode: 'simulated' });
    await user.keyboard('n');
    expect(useStore.getState().timeMode).toBe('real');
  });

  it('ignores keys when focus is in an input', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input data-testid="probe" />
        <TimeControls />
      </>,
    );
    const before = useStore.getState().simulatedTime;
    const probe = document.querySelector('[data-testid=probe]') as HTMLInputElement;
    probe.focus();
    await user.keyboard('{ArrowRight}');
    expect(useStore.getState().simulatedTime).toBe(before);
  });
});
