import AxeBuilder from '@axe-core/playwright';
import { test as base } from '@playwright/test';

interface Fixtures {
  /** Axe scanner preconfigured for WCAG 2.2 A/AA (NFR-05). */
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<Fixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']),
    );
  },
});

export { expect } from '@playwright/test';
