import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { useStore } from '@/state/store';

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

describe('<Header>', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('switches view when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    expect(useStore.getState().view).toBe('dashboard');
    await user.click(screen.getByRole('tab', { name: /sfera 3d/i }));
    expect(useStore.getState().view).toBe('sky3d');
  });

  it('copies a shareable URL to the clipboard on Condividi click', async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard stub on navigator; override
    // it after setup so our spy captures the share-URL write.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<Header />);

    await user.click(screen.getByRole('button', { name: /condividi/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    const url = writeText.mock.calls[0][0] as string;
    expect(url).toContain('lat=41.9000');
    expect(url).toContain('lon=12.5000');
    expect(url).toContain('v=dashboard');
    expect(await screen.findByRole('button', { name: /copiato/i })).toBeInTheDocument();
  });

  it('shows the current location label', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: /roma/i })).toBeInTheDocument();
  });
});
