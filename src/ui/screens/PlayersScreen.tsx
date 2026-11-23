import { useEffect, useId, useRef, useState } from 'react';
import { canAddPlayer, MAX_PLAYERS } from '../../domain/players.ts';
import { useI18n } from '../../i18n/context.ts';
import type { Player } from '../../storage/store.ts';
import { AvatarImage } from '../components/AvatarImage.tsx';
import { Button } from '../components/Button.tsx';
import { ExitDialog } from '../components/ExitDialog.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { EditIcon } from '../components/icons.tsx';
import { Logo } from '../components/Logo.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { SettingsFooter } from '../components/SettingsFooter.tsx';
import { useHoldEntries } from '../navigation/useHoldEntries.ts';
import { useOnBack } from '../navigation/useOnBack.ts';

interface PlayersScreenProps {
  /** The players of the device, or `null` while they are being read. */
  players: readonly Player[] | null;
  /** Who played last on this device (PRF-01). */
  lastPlayerId: number | null;
  onChoose: (player: Player) => void;
  onNewPlayer: () => void;
  /** "Editar a Lucía": change the nickname or avatar, or delete the player (PRF-04). */
  onEdit: (player: Player) => void;
  /** "Acerca de", which opens without choosing a player (D33). */
  onOpenAbout: () => void;
}

/**
 * "¿Quién juega?" (PRF-01): the first screen. A tap on a player chooses who plays, and the pencil next to it
 * edits them (PRF-04); "Nuevo jugador" creates one while fewer than 8 fit (PRF-05). Back asks "¿Salir del
 * juego?" first, and Back again leaves the game (NAV-02, D22).
 */
export function PlayersScreen({
  players,
  lastPlayerId,
  onChoose,
  onNewPlayer,
  onEdit,
  onOpenAbout,
}: PlayersScreenProps) {
  const { t } = useI18n();
  const titleId = useId();
  const [exiting, setExiting] = useState(false);
  // Closing the question gives the focus back to the title, once the page is no longer inert: focus() on
  // inert content does nothing.
  const backFromDialog = useRef(false);

  useOnBack(() => {
    setExiting(true);
  });
  // With the question open, Back always leaves: only "Seguir jugando" brings the entry back.
  useHoldEntries(exiting);

  useEffect(() => {
    if (exiting || !backFromDialog.current) return;
    backFromDialog.current = false;
    document.getElementById(titleId)?.focus();
  }, [exiting, titleId]);

  function stay() {
    backFromDialog.current = true;
    setExiting(false);
  }

  return (
    <>
      <div
        inert={exiting}
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-5 pb-6"
      >
        <header>
          <Logo />
        </header>
        <main className="flex flex-col gap-4">
          <ScreenTitle id={titleId} className="mt-2 text-3xl">
            {t('players.title')}
          </ScreenTitle>
          {players && (
            <>
              {players.length > 0 && (
                <ul aria-label={t('players.list')} className="flex flex-col gap-3">
                  {players.map((player) => (
                    <li key={player.id} className="flex items-center gap-2">
                      <PlayerButton
                        player={player}
                        last={player.id === lastPlayerId}
                        onChoose={onChoose}
                      />
                      <IconButton
                        label={t('players.edit', { name: player.nickname })}
                        icon={<EditIcon />}
                        onClick={() => {
                          onEdit(player);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {canAddPlayer(players.length) ? (
                <Button
                  variant={players.length > 0 ? 'secondary' : 'primary'}
                  onClick={onNewPlayer}
                  className="w-full"
                >
                  <span aria-hidden="true">+</span>
                  {t('players.new')}
                </Button>
              ) : (
                <p className="text-center font-extrabold text-ink-muted">
                  {t('players.full', { n: MAX_PLAYERS })}
                </p>
              )}
            </>
          )}
        </main>
        <SettingsFooter onOpenAbout={onOpenAbout} />
      </div>
      {exiting && <ExitDialog onStay={stay} />}
    </>
  );
}

interface PlayerButtonProps {
  player: Player;
  last: boolean;
  onChoose: (player: Player) => void;
}

/**
 * A player: avatar and nickname, which is its accessible name. The last player also gets the label "Jugó la
 * última vez", a sticker on the button's corner, so it does not stand out by colour alone (PRF-01, NFR-05).
 * The label is the button's description and sits outside it, so the name stays the nickname that is
 * written on the button (WCAG 2.5.3); taps on the label go through to the button.
 */
function PlayerButton({ player, last, onChoose }: PlayerButtonProps) {
  const { t } = useI18n();
  const labelId = useId();

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-describedby={last ? labelId : undefined}
        onClick={() => {
          onChoose(player);
        }}
        className={[
          'flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left',
          'rounded-block border-3 border-ink shadow-block',
          'motion-safe:transition-[translate,box-shadow] motion-safe:duration-75',
          'active:translate-x-1 active:translate-y-1 active:shadow-none',
          'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
          last ? 'bg-sun' : 'bg-paper',
        ].join(' ')}
      >
        <AvatarImage avatar={player.avatar} size={48} decorative />
        <span className="min-w-0 flex-1 font-display text-2xl leading-tight break-words">
          {player.nickname}
        </span>
      </button>
      {last && (
        <span
          id={labelId}
          className="pointer-events-none absolute -top-2.5 right-3 rounded-full border-2 border-ink bg-paper px-2 text-xs font-black"
        >
          {t('players.last')}
        </span>
      )}
    </div>
  );
}
