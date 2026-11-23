import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n/I18nProvider.tsx';
import { SILENT } from '../../sound/sounds.ts';
import { SoundProvider } from '../../sound/SoundProvider.tsx';
import { SoundSwitch } from './SoundSwitch.tsx';

function renderSwitch() {
  render(
    <I18nProvider>
      <SoundProvider player={SILENT}>
        <SoundSwitch />
      </SoundProvider>
    </I18nProvider>,
  );
  return screen.getByRole('switch', { name: 'Sonido' });
}

describe('SoundSwitch', () => {
  it('SET-02 NFR-05 a screen reader hears "Sonido" and whether it is on; the icon changes too, not only the colour', async () => {
    const soundSwitch = renderSwitch();
    const iconWhenOn = soundSwitch.querySelector('svg')?.innerHTML;

    expect(soundSwitch).toBeChecked();
    expect(soundSwitch).toHaveTextContent('Sonido');
    await userEvent.click(soundSwitch);

    expect(soundSwitch).not.toBeChecked();
    expect(soundSwitch).toHaveAccessibleName('Sonido');
    const iconWhenOff = soundSwitch.querySelector('svg')?.innerHTML;
    expect(iconWhenOff).toBeTruthy();
    expect(iconWhenOff).not.toBe(iconWhenOn);
  });

  it('SET-02 NFR-05 it works with the keyboard', async () => {
    const soundSwitch = renderSwitch();

    soundSwitch.focus();
    await userEvent.keyboard(' ');
    expect(soundSwitch).not.toBeChecked();
    await userEvent.keyboard('{Enter}');
    expect(soundSwitch).toBeChecked();
  });
});
