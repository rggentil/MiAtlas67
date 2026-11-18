import { useContext, useEffect } from 'react';
import { BackContext } from './backContext.ts';

/**
 * While `held`, the game adds no history entries, even after a tap: with "¿Salir del juego?" open, a tap
 * anywhere but "Seguir jugando" must not stop Back from leaving (NAV-02).
 */
export function useHoldEntries(held: boolean): void {
  const { hold } = useContext(BackContext);

  useEffect(() => {
    hold(held);
    return () => {
      hold(false);
    };
  }, [hold, held]);
}
