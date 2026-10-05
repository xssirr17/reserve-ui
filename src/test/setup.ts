import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Automatically clean up React DOM after each test
afterEach(() => {
  cleanup();
});

// Polyfill window.crypto.randomUUID in jsdom if needed
if (!globalThis.crypto) {
  // @ts-expect-error test polyfill
  globalThis.crypto = {};
}

if (!globalThis.crypto.randomUUID) {
  let counter = 0;
  globalThis.crypto.randomUUID = () => {
    counter++;
    return `12345678-1234-4000-8000-${String(counter).padStart(12, '0')}`;
  };
}
