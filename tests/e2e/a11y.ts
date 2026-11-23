import type { Page } from '@playwright/test';
import { dictionaries, type MessageKey } from '../../src/i18n/dictionaries.ts';
import { formatMessage, type MessageParams } from '../../src/i18n/format.ts';
import type { Language } from '../../src/i18n/languages.ts';

/** The UI text of `key` in `language`, as the game writes it (NFR-06). */
export function text(language: Language, key: MessageKey, params?: MessageParams): string {
  return formatMessage(dictionaries[language][key], params);
}

/** Waits until the fonts are loaded and a frame is drawn, so sizes are final. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });
}

/** What the accessibility sweep found on one screen; every list is empty on a good screen. */
export interface ScreenReport {
  /** Buttons, radios, switches and links smaller than 48 × 48 px (NFR-05, §15). */
  smallTargets: string[];
  /** Problems of structure for a screen reader: h1, headings, main, images, page language. */
  structure: string[];
}

/**
 * Checks the structure and the touch targets of the screen on show. A radio drawn as a chip is measured by its
 * label, which is what the finger taps.
 */
export async function inspectScreen(page: Page, language: Language): Promise<ScreenReport> {
  await settle(page);
  return page.evaluate((lang) => {
    const visible = (element: Element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
    };
    const nameOf = (element: Element) =>
      (element.getAttribute('aria-label') ?? element.textContent).trim().slice(0, 40);
    const inDialog = document.querySelector('[role="dialog"]');
    const scope: ParentNode = inDialog ?? document;

    const smallTargets: string[] = [];
    const targets = scope.querySelectorAll(
      'button, a[href], [role="switch"], [role="radio"], input[type="radio"]',
    );
    for (const target of targets) {
      const measured = target.matches('input[type="radio"]') ? target.closest('label') : target;
      if (!measured || !visible(measured)) continue;
      const box = measured.getBoundingClientRect();
      if (box.width < 47.5 || box.height < 47.5) {
        smallTargets.push(
          `${nameOf(measured)} ${String(Math.round(box.width))}×${String(Math.round(box.height))}`,
        );
      }
    }

    const structure: string[] = [];
    if (document.documentElement.lang !== lang) {
      structure.push(`page language "${document.documentElement.lang}"`);
    }
    if (!inDialog) {
      const h1s = [...document.querySelectorAll('h1')].filter(visible);
      if (h1s.length !== 1) structure.push(`${String(h1s.length)} h1`);
      const mains = document.querySelectorAll('main');
      if (mains.length !== 1) structure.push(`${String(mains.length)} main`);
      const levels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
        .filter(visible)
        .map((heading) => Number(heading.tagName[1]));
      levels.forEach((level, index) => {
        const before = index === 0 ? 0 : (levels[index - 1] ?? 0);
        if (level > before + 1)
          structure.push(`heading h${String(level)} after h${String(before)}`);
      });
    }
    for (const image of document.querySelectorAll('img')) {
      if (!image.hasAttribute('alt') && !image.hasAttribute('aria-label')) {
        structure.push(`image without alt: ${image.getAttribute('src') ?? ''}`);
      }
    }
    for (const svg of document.querySelectorAll('svg[role="img"]')) {
      if (!svg.getAttribute('aria-label') && !svg.querySelector('title')) {
        structure.push('svg image without a name');
      }
    }
    return { smallTargets, structure };
  }, language);
}

/** The text at 200 %: the game sizes everything in rem, so 200 % on the root is the user's larger text. */
export async function useBigText(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = ':root { font-size: 200% !important; }';
      document.head.append(style);
    });
  });
}

/**
 * What scrolls sideways or is cut off on the screen on show (NFR-01, NFR-05): run on a 360 px phone with the
 * text at 200 % ({@link useBigText}).
 */
export async function findOverflow(page: Page): Promise<string[]> {
  await settle(page);
  return page.evaluate(() => {
    const problems: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > window.innerWidth + 1) {
      problems.push(`page ${String(root.scrollWidth)} px wide`);
    }
    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      const clips =
        ['hidden', 'clip'].includes(style.overflowX) || style.textOverflow === 'ellipsis';
      // Text hidden for screen readers only (sr-only) is 1 px wide on purpose.
      // A nickname that ends in "…" by design carries its whole text in its title.
      const whole = element.getAttribute('title') === element.textContent.trim();
      if (
        clips &&
        !whole &&
        element.scrollWidth > element.clientWidth + 1 &&
        element.clientWidth > 2
      ) {
        problems.push(`cut off: ${element.textContent.trim().slice(0, 40)}`);
      }
      const box = element.getBoundingClientRect();
      // Only a data table may scroll sideways inside its box (WCAG 1.4.10); any other box must fit.
      const inTableBox = element.closest('table') !== null;
      const scroller = ['auto', 'scroll'].includes(style.overflowX);
      if (
        scroller &&
        !element.querySelector('table') &&
        element.scrollWidth > element.clientWidth + 1
      ) {
        problems.push(`scrolls sideways: ${element.textContent.trim().slice(0, 40)}`);
      }
      // A box pinned to the screen (the answer panel, a dialog) must fit its height, or scroll.
      const pinned = style.position === 'fixed';
      if (pinned && box.top < -1 && !['auto', 'scroll'].includes(style.overflowY)) {
        problems.push(`taller than the screen: ${element.textContent.trim().slice(0, 40)}`);
      }
      if (box.width > 0 && box.right > window.innerWidth + 1 && !inTableBox) {
        problems.push(
          `past the edge: <${element.tagName.toLowerCase()}> ${element.textContent.trim().slice(0, 30)}`,
        );
      }
    }
    return [...new Set(problems)].slice(0, 15);
  });
}
