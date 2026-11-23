import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../test/render.tsx';
import { AboutScreen } from './AboutScreen.tsx';

function renderAbout(onBack = vi.fn()) {
  const { container } = renderWithI18n(<AboutScreen onBack={onBack} />);
  return { onBack, container };
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

  it('DATA-05 D39 under "Banderas": Wikimedia Commons, public domain or CC0 but for the flags named below', () => {
    renderAbout();

    const commons = item(section('Banderas'), 'Wikimedia Commons');
    expect(commons).toHaveTextContent(
      'Todas las banderas. Dominio público o CC0, salvo las que se citan aquí debajo.',
    );
    expect(commons).toHaveTextContent('https://commons.wikimedia.org/');
    expect(section('Banderas')).not.toHaveTextContent('flag-icons');
  });

  it('DATA-05 D39 the three flags whose licence asks for it are named, with licence, author and addresses', () => {
    renderAbout();

    const flags = section('Banderas');
    expect(within(flags).getAllByRole('listitem')).toHaveLength(4);
    const oman = item(flags, 'Omán');
    expect(oman).toHaveTextContent('Open Government Licence – Oman 1.0');
    expect(oman).toHaveTextContent('https://commons.wikimedia.org/wiki/File:Flag_of_Oman.svg');
    expect(oman).toHaveTextContent(
      'https://www.oman.om/en/home-footer-level/faq/open-government-licence-oman',
    );
    const sintEustatius = item(flags, 'San Eustaquio');
    expect(sintEustatius).toHaveTextContent('CC BY-SA 4.0');
    expect(sintEustatius).toHaveTextContent('Autor: Andrwsc');
    expect(sintEustatius).toHaveTextContent(
      'https://commons.wikimedia.org/wiki/File:Flag_of_Sint_Eustatius.svg',
    );
    expect(sintEustatius).toHaveTextContent('https://creativecommons.org/licenses/by-sa/4.0/');
    const saba = item(flags, 'Saba');
    expect(saba).toHaveTextContent('CC BY-SA 3.0');
    expect(saba).toHaveTextContent('Autor: Mysid');
    expect(saba).toHaveTextContent('https://creativecommons.org/licenses/by-sa/3.0/');
  });

  it('DATA-05 the named flags are in alphabetical order, after Wikimedia Commons', () => {
    renderAbout();

    const names = within(section('Banderas'))
      .getAllByRole('listitem')
      .map((li) => li.querySelector('p')?.textContent ?? '');
    expect(names).toEqual(['Wikimedia Commons', 'Omán', 'Saba', 'San Eustaquio']);
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

  it('NFR-04 nothing on the screen is fetched: no image, no link, every address is text', () => {
    const { container } = renderAbout();

    expect(container.querySelectorAll('img, iframe, link, script, a')).toHaveLength(0);
  });

  it("NFR-06 DATA-08 in English, with the licensors' credit lines in their original wording", () => {
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
    expect(item(section('Flags'), 'Wikimedia Commons')).toHaveTextContent(
      'Every flag. Public domain or CC0, except the ones credited below.',
    );
    expect(item(section('Flags'), 'Sint Eustatius')).toHaveTextContent('Author: Andrwsc');
    expect(item(section('Flags'), 'Oman')).toHaveTextContent('Open Government Licence – Oman 1.0');
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});
