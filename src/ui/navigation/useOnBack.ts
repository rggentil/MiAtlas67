import { useContext, useEffect, useRef } from 'react';
import { BackContext, type BackHandler } from './backContext.ts';

/** What the back button does on the current screen (NAV-01): the same as the screen's own way back. */
export function useOnBack(onBack: BackHandler): void {
  const register = useContext(BackContext);
  const latest = useRef(onBack);

  useEffect(() => {
    latest.current = onBack;
  });

  useEffect(() => {
    register(() => {
      latest.current();
    });
    return () => {
      register(null);
    };
  }, [register]);
}
