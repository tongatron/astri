import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingModal from './OnboardingModal';
import { useStore } from '@/state/store';

const INITIAL_STATE = useStore.getState();

function resetStore() {
  useStore.setState({
    ...INITIAL_STATE,
    location: null,
    hasOnboarded: false,
  });
}

describe('<OnboardingModal>', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the welcome step when not onboarded and no location is set', () => {
    render(<OnboardingModal />);
    expect(screen.getByRole('heading', { name: /benvenuto in astri/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniziamo/i })).toBeInTheDocument();
  });

  it('hides itself once the user is onboarded with a location', () => {
    useStore.setState({
      location: { lat: 41.9, lon: 12.5, name: 'Roma', source: 'manual' },
      hasOnboarded: true,
    });
    const { container } = render(<OnboardingModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it('walks through welcome → location → tour using the default location', async () => {
    const user = userEvent.setup();
    render(<OnboardingModal />);

    await user.click(screen.getByRole('button', { name: /iniziamo/i }));
    expect(screen.getByRole('heading', { name: /dove ti trovi/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /usa roma per ora/i }));
    expect(screen.getByRole('heading', { name: /tutto pronto/i })).toBeInTheDocument();
    expect(useStore.getState().location?.name).toBe('Roma');
  });

  it('"Salta" on welcome marks the user as onboarded', async () => {
    const user = userEvent.setup();
    render(<OnboardingModal />);
    expect(useStore.getState().hasOnboarded).toBe(false);

    await user.click(screen.getByRole('button', { name: /^salta$/i }));
    expect(useStore.getState().hasOnboarded).toBe(true);
  });
});
