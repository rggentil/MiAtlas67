import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';
import {
  AVATARS,
  cleanNickname,
  firstFreeAvatar,
  MAX_NICKNAME_LETTERS,
  nicknameProblem,
  type AvatarId,
  type NicknameProblem,
} from '../../domain/players.ts';
import { useI18n } from '../../i18n/context.ts';
import type { MessageKey } from '../../i18n/dictionaries.ts';
import type { Player, PlayerData } from '../../storage/store.ts';
import { shownAvatar } from '../avatars.ts';
import { AvatarImage } from '../components/AvatarImage.tsx';
import { Button } from '../components/Button.tsx';
import { DeletePlayerDialog } from '../components/DeletePlayerDialog.tsx';
import { IconButton } from '../components/IconButton.tsx';
import { BackIcon } from '../components/icons.tsx';
import { ScreenTitle } from '../components/ScreenTitle.tsx';
import { useOnBack } from '../navigation/useOnBack.ts';

interface PlayerFormScreenProps {
  /** The players of the device: the nicknames of the others are taken (PRF-02). */
  players: readonly Player[];
  /** The player being edited (PRF-04); without it, the form creates a new one (PRF-02). */
  editing?: Player;
  onBack: () => void;
  /** Saves the player; it settles once saved, or rejects when saving failed. */
  onSave: (data: PlayerData) => Promise<void>;
  /** Deletes the player being edited, with its rounds; only called after "Sí, borrar" (PRF-04). */
  onDelete?: () => Promise<void>;
}

const PROBLEM_MESSAGES: Record<NicknameProblem, MessageKey> = {
  empty: 'newPlayer.empty',
  tooLong: 'newPlayer.tooLong',
  taken: 'newPlayer.taken',
};

/**
 * "Nuevo jugador" (PRF-02) or "Editar jugador" (PRF-04): only a nickname and an avatar, nothing else. Saving
 * checks the nickname with the same rules and says what is wrong with it. When editing, "Borrar jugador" asks
 * "¿Borrar a Lucía?" first. "Volver" and the phone's back button go back to "¿Quién juega?" (NAV-01); with the
 * question open, Back closes it, as Escape and "No, volver" do.
 */
export function PlayerFormScreen({
  players,
  editing,
  onBack,
  onSave,
  onDelete,
}: PlayerFormScreenProps) {
  const { t } = useI18n();
  const nicknameId = useId();
  const problemId = useId();
  const input = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const [nickname, setNickname] = useState(editing?.nickname ?? '');
  const [avatar, setAvatar] = useState<AvatarId>(() =>
    editing ? shownAvatar(editing.avatar) : firstFreeAvatar(players.map((player) => player.avatar)),
  );
  const [problem, setProblem] = useState<NicknameProblem | null>(null);
  const [deleting, setDeleting] = useState(false);
  // A player is being saved or deleted: a second tap must not do it twice (PRF-02).
  const busy = useRef(false);
  // Closing the question gives the focus back to "Borrar jugador", once the page is no longer inert.
  const backFromDialog = useRef(false);

  const others = players.filter((player) => player.id !== editing?.id);

  useOnBack(() => {
    if (deleting) keep();
    else onBack();
  });

  useEffect(() => {
    if (deleting || !backFromDialog.current) return;
    backFromDialog.current = false;
    deleteRef.current?.focus();
  }, [deleting]);

  function keep() {
    backFromDialog.current = true;
    setDeleting(false);
  }

  /** Runs `action` unless another one is running; when it fails, the button can be tapped again. */
  function once(action: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    action().catch(() => {
      busy.current = false;
    });
  }

  function save(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (busy.current) return;
    const found = nicknameProblem(
      nickname,
      others.map((player) => player.nickname),
    );
    setProblem(found);
    if (found) {
      input.current?.focus();
      return;
    }
    once(() => onSave({ nickname: cleanNickname(nickname), avatar }));
  }

  return (
    <>
      <div
        inert={deleting}
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pt-5 pb-6"
      >
        <header className="flex items-center gap-3">
          <IconButton label={t('nav.back')} icon={<BackIcon />} onClick={onBack} />
        </header>
        <main className="flex flex-col gap-5">
          <ScreenTitle className="text-4xl">
            {t(editing ? 'editPlayer.title' : 'newPlayer.title')}
          </ScreenTitle>
          <form noValidate onSubmit={save} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor={nicknameId} className="font-display text-2xl">
                {t('newPlayer.nickname')}
              </label>
              <input
                ref={input}
                id={nicknameId}
                type="text"
                value={nickname}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="done"
                aria-invalid={problem !== null}
                aria-describedby={problem ? problemId : undefined}
                onChange={(event) => {
                  setNickname(event.target.value);
                }}
                className={[
                  'min-h-14 w-full rounded-block border-3 border-ink bg-paper px-4',
                  'text-xl font-extrabold text-ink shadow-block-sm',
                  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent',
                ].join(' ')}
              />
              {problem && (
                <p id={problemId} className="flex items-center gap-2 font-black text-ink">
                  <span aria-hidden="true">✗</span>
                  <span>{t(PROBLEM_MESSAGES[problem], { n: MAX_NICKNAME_LETTERS })}</span>
                </p>
              )}
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 font-display text-2xl">{t('newPlayer.avatar')}</legend>
              {/* Four animals per row; with larger text, as many as fit (NFR-05). */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(max(3rem,22%),1fr))] gap-2.5">
                {AVATARS.map((option) => (
                  <label key={option} className="relative block">
                    {/* Transparent over the whole tile: the tap lands on the radio button itself. */}
                    <input
                      type="radio"
                      name="avatar"
                      value={option}
                      checked={avatar === option}
                      aria-label={t(`avatar.${option}`)}
                      onChange={() => {
                        setAvatar(option);
                      }}
                      className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0"
                    />
                    <span
                      className={[
                        'relative flex aspect-square min-h-12 items-center justify-center p-1',
                        'rounded-xl border-3 border-ink bg-paper shadow-block-sm',
                        'peer-checked:bg-sun peer-checked:shadow-none',
                        'peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
                      ].join(' ')}
                    >
                      <AvatarImage avatar={option} size={56} decorative />
                      {/* The chosen one also gets a ✓, so the choice does not rely on colour (NFR-05). */}
                      {avatar === option && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-ink bg-paper text-sm font-black"
                        >
                          ✓
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Button type="submit" className="w-full">
              {t(editing ? 'editPlayer.save' : 'newPlayer.create')}
            </Button>
          </form>
          {editing && onDelete && (
            <Button
              ref={deleteRef}
              variant="secondary"
              className="w-full"
              onClick={() => {
                setDeleting(true);
              }}
            >
              {t('editPlayer.delete')}
            </Button>
          )}
        </main>
      </div>
      {editing && onDelete && deleting && (
        <DeletePlayerDialog
          nickname={editing.nickname}
          onKeep={keep}
          onDelete={() => {
            once(onDelete);
          }}
        />
      )}
    </>
  );
}
