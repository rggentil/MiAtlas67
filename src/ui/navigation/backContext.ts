import { createContext } from 'react';

/** What the back button does on the current screen. */
export type BackHandler = () => void;

/** Lets the current screen register its back handler with `BackButtonProvider` (NAV-01). */
export const BackContext = createContext<(handler: BackHandler | null) => void>(() => undefined);
