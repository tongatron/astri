import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom in vitest sometimes leaves window.localStorage as a malformed shim
// (the `--localstorage-file` Node warning). Reinstall a clean in-memory
// implementation so zustand's persist middleware can read/write it.
function installLocalStorage() {
  const store = new Map<string, string>();
  const impl: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? (store.get(k) as string) : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
  Object.defineProperty(window, 'localStorage', { value: impl, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: impl, configurable: true });
}

installLocalStorage();

afterEach(() => {
  cleanup();
  installLocalStorage();
});
