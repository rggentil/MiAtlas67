import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Player, PlayerData } from '../../storage/store.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { NewPlayerScreen } from './NewPlayerScreen.tsx';

const LUCIA: Player = { id: 1, nickname: 'Lucía', avatar: 'fox' };

const AVATAR_NAMES = [
  'Zorro',
  'Panda',
  'Rana',
  'León',
  'Pingüino',
  'Pulpo',
  'Unicornio',
  'Dinosaurio',
  'Gato',
  'Perro',
  'Búho',
];

type Create = (data: PlayerData) => Promise<void>;

/** What "Crear" calls: it saves the player, by default at once. */
function creator(saved: () => Promise<void> = () => Promise.resolve()) {
  return vi.fn<Create>(saved);
}

interface Shown {
  players?: readonly Player[];
  onBack?: () => void;
  onCreate?: Create;
}

function renderNewPlayer({
  players = [LUCIA],
  onBack = vi.fn(),
  onCreate = creator(),
}: Shown = {}) {
  return renderWithI18n(<NewPlayerScreen players={players} onBack={onBack} onCreate={onCreate} />);
}

const nickname = () => screen.getByRole('textbox', { name: 'Nombre' });
const avatars = () => screen.getByRole('group', { name: 'Elige un animal' });
const create = () => screen.getByRole('button', { name: 'Crear' });

describe('NewPlayerScreen', () => {
  it('PRF-02 asks only for a nickname and an avatar: no password, email, age or real name', () => {
    const { container } = renderNewPlayer();

    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo jugador' })).toBeVisible();
    expect(screen.getAllByRole('textbox')).toEqual([nickname()]);
    expect(nickname()).toHaveAttribute('type', 'text');
    const inputs = [...container.querySelectorAll('input, select, textarea')];
    expect(inputs.filter((input) => input.getAttribute('type') !== 'radio')).toEqual([nickname()]);
    expect(within(avatars()).getAllByRole('radio')).toHaveLength(inputs.length - 1);
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('PRF-02 offers 11 animals to choose from', () => {
    renderNewPlayer();

    expect(
      within(avatars())
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('aria-label')),
    ).toEqual(AVATAR_NAMES);
  });

  it('PRF-02 creates the player with the nickname typed and the animal chosen', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });

    await userEvent.type(nickname(), 'Pablo');
    await userEvent.click(screen.getByRole('radio', { name: 'Rana' }));
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'frog' });
  });

  it('PRF-02 spaces at both ends of the nickname are not kept', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });

    await userEvent.type(nickname(), '  Pablo ');
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'panda' });
  });

  it('PRF-02 Enter on the keyboard creates the player too', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });

    await userEvent.type(nickname(), 'Pablo{Enter}');

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('PRF-02 an avatar another player already has can be chosen too (D21)', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });

    await userEvent.type(nickname(), 'Pablo');
    await userEvent.click(screen.getByRole('radio', { name: 'Zorro' }));
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'fox' });
  });

  it('PRF-02 starts with the first animal nobody has yet, marked with ✓ and not only by colour', () => {
    renderNewPlayer();

    const panda = screen.getByRole('radio', { name: 'Panda' });
    expect(panda).toBeChecked();
    expect(within(avatars()).getAllByRole('radio', { checked: true })).toEqual([panda]);
    const tile = panda.closest('label');
    expect(tile).toHaveTextContent('✓');
    expect(screen.getByRole('radio', { name: 'Zorro' }).closest('label')).not.toHaveTextContent(
      '✓',
    );
  });

  it('PRF-02 the ✓ moves to the animal chosen', async () => {
    renderNewPlayer();

    await userEvent.click(screen.getByRole('radio', { name: 'Búho' }));

    expect(screen.getByRole('radio', { name: 'Búho' }).closest('label')).toHaveTextContent('✓');
    expect(screen.getByRole('radio', { name: 'Panda' }).closest('label')).not.toHaveTextContent(
      '✓',
    );
    expect(screen.getAllByText('✓')).toHaveLength(1);
  });

  it.each([
    ['', 'Escribe un nombre'],
    ['   ', 'Escribe un nombre'],
    ['Superlucianita', 'Como mucho 12 letras'],
    ['lucia', 'Ya hay un jugador que se llama así'],
    ['LUCÍA', 'Ya hay un jugador que se llama así'],
  ])(
    'PRF-02 the nickname "%s" cannot be used: it says "%s" and creates nobody',
    async (typed, message) => {
      const onCreate = creator();
      renderNewPlayer({ onCreate });

      if (typed !== '') await userEvent.type(nickname(), typed);
      await userEvent.click(create());

      expect(screen.getByText(message)).toBeVisible();
      // With a ✗, not only colour (NFR-05).
      expect(screen.getByText('✗')).toBeVisible();
      expect(nickname()).toHaveAccessibleDescription(message);
      expect(nickname()).toBeInvalid();
      expect(nickname()).toHaveFocus();
      expect(onCreate).not.toHaveBeenCalled();
    },
  );

  it('PRF-02 a double tap on "Crear" creates the player only once', async () => {
    // Saving takes a moment, as on the phone: the form is still there when the second tap comes.
    const onCreate = creator(() => new Promise(() => undefined));
    renderNewPlayer({ onCreate });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.dblClick(create());
    await userEvent.type(nickname(), '{Enter}');

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('PRF-02 when saving fails, "Crear" can be tapped again', async () => {
    const onCreate = creator(() => Promise.reject(new Error('Storage is full')));
    renderNewPlayer({ onCreate });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.click(create());
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledTimes(2);
  });

  it('PRF-02 once the nickname is fixed, the player is created', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });
    await userEvent.type(nickname(), 'lucia');
    await userEvent.click(create());
    expect(onCreate).not.toHaveBeenCalled();

    await userEvent.clear(nickname());
    await userEvent.type(nickname(), 'Lucas');
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledExactlyOnceWith({ nickname: 'Lucas', avatar: 'panda' });
  });

  it('PRF-02 a nickname of 12 letters is accepted', async () => {
    const onCreate = creator();
    renderNewPlayer({ onCreate });

    await userEvent.type(nickname(), 'Mariaisabela');
    await userEvent.click(create());

    expect(onCreate).toHaveBeenCalledOnce();
    expect(screen.queryByText('Como mucho 12 letras')).not.toBeInTheDocument();
  });

  it('NAV-01 "Volver" goes back without creating anybody', async () => {
    const onBack = vi.fn();
    const onCreate = creator();
    renderNewPlayer({ onBack, onCreate });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('PRF-02 NFR-06 the form speaks English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderNewPlayer();

    expect(screen.getByRole('heading', { level: 1, name: 'New player' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    expect(
      within(screen.getByRole('group', { name: 'Choose an animal' }))
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('aria-label')),
    ).toEqual([
      'Fox',
      'Panda',
      'Frog',
      'Lion',
      'Penguin',
      'Octopus',
      'Unicorn',
      'Dinosaur',
      'Cat',
      'Dog',
      'Owl',
    ]);
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Write a name')).toBeVisible();
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Superlucianita');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('At most 12 letters')).toBeVisible();
    await userEvent.clear(screen.getByRole('textbox', { name: 'Name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'lucia');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('There is already a player with that name')).toBeVisible();
  });
});
