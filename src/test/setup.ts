// Component-test setup: jest-dom matchers (toBeInTheDocument...) and a clean slate after each test.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no layout, so it does not implement scrollIntoView; the screens call it after answering.
Element.prototype.scrollIntoView = function scrollIntoView() {
  // nothing to scroll in jsdom
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute('lang');
});
