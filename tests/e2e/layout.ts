import type { Locator } from '@playwright/test';

/**
 * True when the element is on screen and nothing covers its centre, as it is now: without scrolling it
 * first, which is what Playwright's actions (even a trial click) would do.
 */
export async function isOnTop(element: Locator): Promise<boolean> {
  return element.evaluate((target) => {
    const box = target.getBoundingClientRect();
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return hit !== null && target.contains(hit);
  });
}

/**
 * How many of the elements `locator` matches have content wider than their box: text that does not fit its
 * cell, or a table wider than the box that clips it. The page is fine when it is 0.
 */
export async function countOverflowing(locator: Locator): Promise<number> {
  return locator.evaluateAll(
    (elements) => elements.filter((element) => element.scrollWidth > element.clientWidth).length,
  );
}
