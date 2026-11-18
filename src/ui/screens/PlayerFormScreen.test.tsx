import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Player, PlayerData } from '../../storage/store.ts';
import { renderWithI18n } from '../../test/render.tsx';
import { PlayerFormScreen } from './PlayerFormScreen.tsx';

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
  onSave?: Create;
}

function renderNewPlayer({ players = [LUCIA], onBack = vi.fn(), onSave = creator() }: Shown = {}) {
  return renderWithI18n(<PlayerFormScreen players={players} onBack={onBack} onSave={onSave} />);
}

const nickname = () => screen.getByRole('textbox', { name: 'Nombre' });
const avatars = () => screen.getByRole('group', { name: 'Elige un animal' });
const create = () => screen.getByRole('button', { name: 'Crear' });

describe('PlayerFormScreen', () => {
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
    const onSave = creator();
    renderNewPlayer({ onSave });

    await userEvent.type(nickname(), 'Pablo');
    await userEvent.click(screen.getByRole('radio', { name: 'Rana' }));
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'frog' });
  });

  it('PRF-02 spaces at both ends of the nickname are not kept', async () => {
    const onSave = creator();
    renderNewPlayer({ onSave });

    await userEvent.type(nickname(), '  Pablo ');
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'panda' });
  });

  it('PRF-02 Enter on the keyboard creates the player too', async () => {
    const onSave = creator();
    renderNewPlayer({ onSave });

    await userEvent.type(nickname(), 'Pablo{Enter}');

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('PRF-02 an avatar another player already has can be chosen too (D21)', async () => {
    const onSave = creator();
    renderNewPlayer({ onSave });

    await userEvent.type(nickname(), 'Pablo');
    await userEvent.click(screen.getByRole('radio', { name: 'Zorro' }));
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Pablo', avatar: 'fox' });
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
      const onSave = creator();
      renderNewPlayer({ onSave });

      if (typed !== '') await userEvent.type(nickname(), typed);
      await userEvent.click(create());

      expect(screen.getByText(message)).toBeVisible();
      // With a ✗, not only colour (NFR-05).
      expect(screen.getByText('✗')).toBeVisible();
      expect(nickname()).toHaveAccessibleDescription(message);
      expect(nickname()).toBeInvalid();
      expect(nickname()).toHaveFocus();
      expect(onSave).not.toHaveBeenCalled();
    },
  );

  it('PRF-02 a double tap on "Crear" creates the player only once', async () => {
    // Saving takes a moment, as on the phone: the form is still there when the second tap comes.
    const onSave = creator(() => new Promise(() => undefined));
    renderNewPlayer({ onSave });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.dblClick(create());
    await userEvent.type(nickname(), '{Enter}');

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('PRF-02 when saving fails, "Crear" can be tapped again', async () => {
    const onSave = creator(() => Promise.reject(new Error('Storage is full')));
    renderNewPlayer({ onSave });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.click(create());
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('PRF-02 once the nickname is fixed, the player is created', async () => {
    const onSave = creator();
    renderNewPlayer({ onSave });
    await userEvent.type(nickname(), 'lucia');
    await userEvent.click(create());
    expect(onSave).not.toHaveBeenCalled();

    await userEvent.clear(nickname());
    await userEvent.type(nickname(), 'Lucas');
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Lucas', avatar: 'panda' });
  });

  it('PRF-02 a nickname of 12 letters is accepted', async () => {
    const onSave = creator();
    renderNewPlayer({ onSave });

    await userEvent.type(nickname(), 'Mariaisabela');
    await userEvent.click(create());

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.queryByText('Como mucho 12 letras')).not.toBeInTheDocument();
  });

  it('NAV-01 "Volver" goes back without creating anybody', async () => {
    const onBack = vi.fn();
    const onSave = creator();
    renderNewPlayer({ onBack, onSave });
    await userEvent.type(nickname(), 'Pablo');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
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

const PABLO: Player = { id: 2, nickname: 'Pablo', avatar: 'owl' };

type Delete = () => Promise<void>;

interface Editing {
  onBack?: () => void;
  onSave?: Create;
  onDelete?: Delete;
}

/** "Editar jugador" for Lucía, with Pablo also on the device. */
function renderEditLucia({
  onBack = vi.fn(),
  onSave = creator(),
  onDelete = vi.fn<Delete>(() => Promise.resolve()),
}: Editing = {}) {
  return renderWithI18n(
    <PlayerFormScreen
      players={[LUCIA, PABLO]}
      editing={LUCIA}
      onBack={onBack}
      onSave={onSave}
      onDelete={onDelete}
    />,
  );
}

const deleteButton = () => screen.getByRole('button', { name: 'Borrar jugador' });

describe('PlayerFormScreen · edit a player', () => {
  it('PRF-04 opens with the nickname and the avatar of the player, and "Guardar"', () => {
    renderEditLucia();

    expect(screen.getByRole('heading', { level: 1, name: 'Editar jugador' })).toBeVisible();
    expect(nickname()).toHaveValue('Lucía');
    expect(screen.getByRole('radio', { name: 'Zorro' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Crear' })).not.toBeInTheDocument();
    expect(deleteButton()).toBeVisible();
  });

  it('PRF-04 saves the new nickname and avatar', async () => {
    const onSave = creator();
    renderEditLucia({ onSave });

    await userEvent.clear(nickname());
    await userEvent.type(nickname(), 'Lu');
    await userEvent.click(screen.getByRole('radio', { name: 'Panda' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Lu', avatar: 'panda' });
  });

  it('PRF-04 the player may keep their own nickname: it is not taken by themselves', async () => {
    const onSave = creator();
    renderEditLucia({ onSave });

    await userEvent.click(screen.getByRole('radio', { name: 'Gato' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.queryByText('Ya hay un jugador que se llama así')).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'Lucía', avatar: 'cat' });
  });

  it('PRF-04 the player may change only the capitals of their own nickname', async () => {
    const onSave = creator();
    renderEditLucia({ onSave });

    await userEvent.clear(nickname());
    await userEvent.type(nickname(), 'LUCÍA');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.queryByText('Ya hay un jugador que se llama así')).not.toBeInTheDocument();
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ nickname: 'LUCÍA', avatar: 'fox' });
  });

  it('PRF-04 when saving fails, "Guardar" can be tapped again', async () => {
    const onSave = creator(() => Promise.reject(new Error('Storage is full')));
    renderEditLucia({ onSave });

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('PRF-04 when deleting fails, the question stays open and "Sí, borrar" can be tapped again', async () => {
    const onDelete = vi.fn<Delete>(() => Promise.reject(new Error('Storage is blocked')));
    renderEditLucia({ onDelete });
    await userEvent.click(deleteButton());

    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));

    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('dialog', { name: '¿Borrar a Lucía?' })).toBeVisible();
  });

  it.each([
    ['pablo', 'Ya hay un jugador que se llama así'],
    ['', 'Escribe un nombre'],
    ['Superlucianita', 'Como mucho 12 letras'],
  ])(
    'PRF-04 PRF-02 the new nickname "%s" says "%s" and nothing is saved',
    async (typed, message) => {
      const onSave = creator();
      renderEditLucia({ onSave });

      await userEvent.clear(nickname());
      if (typed !== '') await userEvent.type(nickname(), typed);
      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

      expect(screen.getByText(message)).toBeVisible();
      expect(screen.getByText('✗')).toBeVisible();
      expect(nickname()).toHaveAccessibleDescription(message);
      expect(onSave).not.toHaveBeenCalled();
    },
  );

  it('PRF-04 "Borrar jugador" asks "¿Borrar a Lucía?", which says her history is deleted too', async () => {
    const onDelete = vi.fn<Delete>(() => Promise.resolve());
    renderEditLucia({ onDelete });

    await userEvent.click(deleteButton());

    const dialog = screen.getByRole('dialog', { name: '¿Borrar a Lucía?' });
    expect(dialog).toHaveAccessibleDescription('También se borra el historial de Lucía.');
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['No, volver', 'Sí, borrar']);
    expect(within(dialog).getByRole('button', { name: 'No, volver' })).toHaveFocus();
    expect(deleteButton().closest('[inert]')).not.toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('PRF-04 "Sí, borrar" deletes the player, once even after a double tap', async () => {
    const onDelete = vi.fn<Delete>(() => new Promise(() => undefined));
    renderEditLucia({ onDelete });
    await userEvent.click(deleteButton());

    await userEvent.dblClick(screen.getByRole('button', { name: 'Sí, borrar' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('PRF-04 "No, volver" closes the question without deleting, and the focus goes back to "Borrar jugador"', async () => {
    const onDelete = vi.fn<Delete>(() => Promise.resolve());
    renderEditLucia({ onDelete });
    await userEvent.click(deleteButton());

    await userEvent.click(screen.getByRole('button', { name: 'No, volver' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteButton()).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('PRF-04 Escape closes the question without deleting', async () => {
    const onDelete = vi.fn<Delete>(() => Promise.resolve());
    renderEditLucia({ onDelete });
    await userEvent.click(deleteButton());

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteButton()).toHaveFocus();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('PRF-04 a new player has no "Borrar jugador"', () => {
    renderNewPlayer();

    expect(screen.queryByRole('button', { name: 'Borrar jugador' })).not.toBeInTheDocument();
  });

  it('PRF-04 NFR-06 editing and deleting speak English when English is chosen', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderEditLucia();

    expect(screen.getByRole('heading', { level: 1, name: 'Edit player' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Delete player' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Lucía?' });
    expect(dialog).toHaveAccessibleDescription("Lucía's history is deleted too.");
    expect(
      within(dialog)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['No, go back', 'Yes, delete']);
  });
});
