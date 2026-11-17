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
