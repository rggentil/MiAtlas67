import { useEffect, useRef } from 'react';

/**
 * A ref that takes the focus when its element appears, so keyboard and screen-reader users start reading
 * the new screen or step from its title (NFR-05). The element needs `tabIndex={-1}`.
 */
export function useFocusOnMount<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (enabled) ref.current?.focus();
  }, [enabled]);

  return ref;
}
