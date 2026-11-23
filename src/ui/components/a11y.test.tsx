import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../test/render.tsx';
import { LanguageSwitch } from './LanguageSwitch.tsx';
import { ModalDialog } from './ModalDialog.tsx';

describe('accessibility of the shared components (NFR-05, D37)', () => {
  it('NFR-05 D37 the chosen language shows a ✓ besides its colour, and the mark moves with the choice', async () => {
    renderWithI18n(<LanguageSwitch />);
    const chip = (name: string) => {
      const label = screen.getByRole('radio', { name }).closest('label');
      if (!label) throw new Error(`No chip ${name}`);
      return label;
    };

    expect(chip('Español').querySelectorAll('svg')).toHaveLength(1);
    expect(chip('English').querySelectorAll('svg')).toHaveLength(0);

    await userEvent.click(screen.getByText('English'));

    expect(chip('English').querySelectorAll('svg')).toHaveLength(1);
    expect(chip('Español').querySelectorAll('svg')).toHaveLength(0);
    // The mark is decorative: the radio's own state is what a screen reader hears.
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
  });

  it('NFR-05 a dialog keeps the focus: Tab and Shift+Tab go round its buttons, and Escape does the safe choice', async () => {
    const onEscape = vi.fn();
    render(
      <>
        <button type="button">Behind</button>
        <ModalDialog title="¿Salir?" text="Seguro." onEscape={onEscape}>
          <button type="button">Seguir</button>
          <button type="button">Salir</button>
        </ModalDialog>
      </>,
    );
    const dialog = screen.getByRole('dialog', { name: '¿Salir?' });
    const [stay, leave] = within(dialog).getAllByRole('button');
    stay?.focus();

    await userEvent.tab();
    expect(leave).toHaveFocus();
    await userEvent.tab();
    expect(stay).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(leave).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Behind' })).not.toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledOnce();
  });
});
