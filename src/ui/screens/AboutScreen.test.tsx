import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../test/render.tsx';
import { AboutScreen } from './AboutScreen.tsx';

function renderAbout(onBack = vi.fn()) {
  renderWithI18n(<AboutScreen onBack={onBack} />);
  return { onBack };
}

/** A section of the screen, by its heading. */
function section(name: string) {
  return screen.getByRole('region', { name });
}

/** The item of a list in `region` whose text starts with `title`. */
function item(region: HTMLElement, title: string) {
  const found = within(region)
    .getAllByRole('listitem')
    .find((li) => li.textContent.startsWith(title));
  if (!found) throw new Error(`No item ${title}`);
  return found;
}

/** Opens the list of Commons flags and returns it. */
async function openCommonsList() {
  await userEvent.click(screen.getByRole('button', { name: /^Banderas de Wikimedia Commons/ }));
  return screen.getByRole('list', { name: 'Banderas de Wikimedia Commons' });
}

describe('AboutScreen', () => {
  it('DATA-05 NFR-05 has the heading "Acerca de" and a heading for each section', () => {
    renderAbout();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Acerca de');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Banderas',
      'Siluetas',
      'Animales',
      'Territorios y nombres',
    ]);
  });

  it('NAV-01 "Volver" goes back', async () => {
    const { onBack } = renderAbout();

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('DATA-05 under "Banderas": flag-icons, MIT and © 2013 Panayiotis Lipiridis, with its address', () => {
    renderAbout();

    const flagIcons = item(section('Banderas'), 'flag-icons');
    expect(flagIcons).toHaveTextContent('MIT');
    expect(flagIcons).toHaveTextContent('© 2013 Panayiotis Lipiridis');
    expect(flagIcons).toHaveTextContent('https://github.com/lipis/flag-icons');
  });

  it('DATA-05 D13 the 15 Commons flags, each with its entity, licence and the address of its file', async () => {
    renderAbout();

    const list = await openCommonsList();

    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(15);
    for (const name of ['Afganistán', 'Abjasia', 'Puntland', 'Zanzíbar']) {
      expect(item(list, name)).toHaveTextContent('https://commons.wikimedia.org/wiki/File:');
    }
    expect(item(list, 'Afganistán')).toHaveTextContent('Flag_of_the_Taliban.svg');
    const sintEustatius = item(list, 'San Eustaquio');
    expect(sintEustatius).toHaveTextContent('CC BY-SA 4.0');
    expect(sintEustatius).toHaveTextContent('Autor: Andrwsc');
    expect(sintEustatius).toHaveTextContent('https://creativecommons.org/licenses/by-sa/4.0/');
    const saba = item(list, 'Saba');
    expect(saba).toHaveTextContent('CC BY-SA 3.0');
    expect(saba).toHaveTextContent('Autor: Mysid');
    const publicDomain = items.filter((li) => li.textContent.includes('Dominio público'));
    expect(publicDomain).toHaveLength(13);
    expect(publicDomain.every((li) => !li.textContent.includes('Autor'))).toBe(true);
  });

  it('DATA-05 the Commons flags are listed in alphabetical order', async () => {
    renderAbout();

    const list = await openCommonsList();

    const names = within(list)
      .getAllByRole('listitem')
      .map((li) => li.querySelector('p')?.textContent ?? '');
    expect(names).toEqual([...names].sort(new Intl.Collator('es').compare));
    expect(names[0]).toBe('Abjasia');
  });

  it('NFR-05 the list of Commons flags opens and closes, and says whether it is open', async () => {
    renderAbout();
    const toggle = screen.getByRole('button', { name: 'Banderas de Wikimedia Commons (15)' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Banderas de Wikimedia Commons' })).toBeNull();

    toggle.focus();
    await userEvent.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Banderas de Wikimedia Commons' })).toBeVisible();

    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Banderas de Wikimedia Commons' })).toBeNull();
  });

  it('DATA-05 D25 under "Siluetas": Natural Earth in the public domain, and Ciudad del Vaticano from OpenStreetMap', () => {
    renderAbout();

    const shapes = section('Siluetas');
    const naturalEarth = item(shapes, 'Natural Earth');
    expect(naturalEarth).toHaveTextContent('Dominio público');
    expect(naturalEarth).toHaveTextContent('https://www.naturalearthdata.com/');
    const vatican = item(shapes, 'Ciudad del Vaticano');
    expect(vatican).toHaveTextContent('OpenStreetMap');
    expect(vatican).toHaveTextContent('© OpenStreetMap contributors');
    expect(vatican).toHaveTextContent('ODbL');
    expect(vatican).toHaveTextContent('https://www.openstreetmap.org/copyright');
  });

  it('DATA-05 D21 under "Animales": OpenMoji, CC BY-SA 4.0 and its credit line', () => {
    renderAbout();

    const openMoji = item(section('Animales'), 'OpenMoji');
    expect(openMoji).toHaveTextContent('CC BY-SA 4.0');
    expect(openMoji).toHaveTextContent(
      'All emojis designed by OpenMoji – the open-source emoji and icon project',
    );
    expect(openMoji).toHaveTextContent('https://openmoji.org/');
  });

  it('DATA-08 under "Territorios y nombres": the neutrality statement', () => {
    renderAbout();

    const territories = section('Territorios y nombres');
    expect(territories).toHaveTextContent(
      'Incluir un territorio, un estado con reconocimiento limitado o una región autónoma refleja su geografía y su bandera, no una posición política.',
    );
    expect(territories).toHaveTextContent('Los nombres son las formas neutras más usadas.');
  });

  it('NFR-04 nothing on the screen is fetched: no image, no link, every address is text', async () => {
    renderAbout();
    await openCommonsList();

    expect(document.querySelectorAll('img, iframe, link, script, a')).toHaveLength(0);
  });

  it("NFR-06 DATA-08 in English, with the licensors' credit lines in their original wording", async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderAbout();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Flags',
      'Silhouettes',
      'Animals',
      'Territories and names',
    ]);
    expect(item(section('Silhouettes'), 'Natural Earth')).toHaveTextContent('Public domain');
    expect(item(section('Silhouettes'), 'Vatican City')).toHaveTextContent(
      '© OpenStreetMap contributors',
    );
    expect(item(section('Animals'), 'OpenMoji')).toHaveTextContent(
      'All emojis designed by OpenMoji – the open-source emoji and icon project',
    );
    expect(section('Territories and names')).toHaveTextContent(
      'Including a territory, a state with limited recognition or an autonomous region reflects its geography and its flag, not a political position.',
    );
    expect(section('Territories and names')).toHaveTextContent(
      'Names are the most widely used neutral forms.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Flags from Wikimedia Commons (15)' }),
    );
    const list = screen.getByRole('list', { name: 'Flags from Wikimedia Commons' });
    expect(item(list, 'Sint Eustatius')).toHaveTextContent('Author: Andrwsc');
    expect(item(list, 'Abkhazia')).toHaveTextContent('Public domain');
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});
