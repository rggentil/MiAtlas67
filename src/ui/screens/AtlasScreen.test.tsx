import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../../test/render.tsx';
import { AtlasScreen } from './AtlasScreen.tsx';

function renderAtlas(onBack = vi.fn()) {
  renderWithI18n(<AtlasScreen onBack={onBack} />);
  return { onBack };
}

async function chooseRegion(name: string) {
  await userEvent.click(screen.getByRole('button', { name }));
}

/** The entries of a section of the Atlas, by its heading ("Oceanía", "Territorios y otros"). */
function entries(section: string) {
  return within(screen.getByRole('region', { name: section })).getAllByRole('listitem');
}

/** The entry whose name, its first line, is `name`. */
function entry(section: string, name: string) {
  const found = entries(section).find((li) => li.querySelector('p')?.textContent === name);
  if (!found) throw new Error(`No entry ${name} in ${section}`);
  return found;
}

const namesOf = (items: HTMLElement[]) =>
  items.map((li) => li.querySelector('p')?.textContent ?? '');

describe('AtlasScreen', () => {
  it('ATL-02 asks "¿Qué región quieres ver?" with "Mundo" and the five regions', () => {
    renderAtlas();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Atlas');
    const regions = screen.getByRole('region', { name: '¿Qué región quieres ver?' });
    expect(
      within(regions)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Mundo', 'Europa', 'África', 'América', 'Asia', 'Oceanía']);
  });

  it('ATL-01 NFR-05 "Oceanía" lists its 14 countries in alphabetical order, and its title takes the focus', async () => {
    renderAtlas();

    await chooseRegion('Oceanía');

    expect(screen.getByRole('heading', { level: 2, name: 'Oceanía' })).toHaveFocus();
    const countries = entries('Oceanía');
    expect(countries).toHaveLength(14);
    const names = namesOf(countries);
    expect(names[0]).toBe('Australia');
    expect(names.at(-1)).toBe('Vanuatu');
    expect(names).toEqual([...names].sort(new Intl.Collator('es').compare));
  });

  it('ATL-01 each entry shows its flag, name, capital and silhouette: "Nueva Zelanda" with "Wellington"', async () => {
    renderAtlas();

    await chooseRegion('Oceanía');

    const newZealand = entry('Oceanía', 'Nueva Zelanda');
    expect(newZealand).toHaveTextContent(/^Nueva ZelandaWellington$/);
    const images = newZealand.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute('src')).toMatch(/\/flags\/nz\.svg/);
    expect(images[1]?.getAttribute('src')).toMatch(/\/shapes\/nz\.svg/);
  });

  it('DATA-08 after the countries, "Territorios y otros" lists 10 entities in alphabetical order, with their status', async () => {
    renderAtlas();

    await chooseRegion('Oceanía');

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Oceanía', 'Territorios y otros']);
    const others = entries('Territorios y otros');
    expect(others).toHaveLength(10);
    expect(namesOf(others)[0]).toBe('Bougainville');
    expect(namesOf(others).at(-1)).toBe('Tokelau');
    expect(entry('Territorios y otros', 'Guam')).toHaveTextContent(
      'Territorio no incorporado de los Estados Unidos',
    );
    expect(entry('Territorios y otros', 'Niue')).toHaveTextContent(
      'Estado en libre asociación con Nueva Zelanda',
    );
  });

  it('ATL-01 "Mundo" lists 195 countries and, under "Territorios y otros", 52 more entities', async () => {
    renderAtlas();

    await chooseRegion('Mundo');

    expect(entries('Mundo')).toHaveLength(195);
    expect(entries('Territorios y otros')).toHaveLength(52);
  });

  it('DATA-03 "Bolivia" shows "Sucre" and "Otras capitales: La Paz"; "México" one capital only', async () => {
    renderAtlas();

    await chooseRegion('América');

    expect(entry('América', 'Bolivia')).toHaveTextContent(/^BoliviaSucreOtras capitales: La Paz$/);
    expect(entry('América', 'México')).toHaveTextContent(/^MéxicoCiudad de México$/);
  });

  it('CAP-02 "Gibraltar" shows its flag, name, silhouette and status, and no capital', async () => {
    renderAtlas();

    await chooseRegion('Europa');

    const gibraltar = entry('Territorios y otros', 'Gibraltar');
    expect(gibraltar).toHaveTextContent(/^GibraltarTerritorio británico de ultramar$/);
    expect(gibraltar.querySelectorAll('img')).toHaveLength(2);
  });

  it('SHAPE-04 "Puntland" shows its flag, name, capital and status, and no silhouette nor empty box', async () => {
    renderAtlas();

    await chooseRegion('África');

    const puntland = entry('Territorios y otros', 'Puntland');
    expect(puntland).toHaveTextContent(/^PuntlandGaroweEstado federado de Somalia$/);
    const images = puntland.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images[0]?.getAttribute('src')).toMatch(/\/flags\/xp\.svg/);
    // The flag and the text, nothing in the place of the silhouette.
    expect(puntland.children).toHaveLength(2);
  });

  it('NAV-01 NFR-05 "Volver" in a region goes back to the regions, and again to the screen the Atlas came from', async () => {
    const { onBack } = renderAtlas();
    await chooseRegion('Oceanía');

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(
      screen.getByRole('heading', { level: 2, name: '¿Qué región quieres ver?' }),
    ).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'Oceanía' })).not.toBeInTheDocument();
    expect(onBack).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('NFR-05 NFR-03 the pictures have empty alt text and load lazily', async () => {
    renderAtlas();

    await chooseRegion('Oceanía');

    const images = [...document.querySelectorAll('main img')];
    expect(images.length).toBeGreaterThan(40);
    for (const image of images) {
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('loading', 'lazy');
    }
  });

  it('NFR-06 in English: names, capitals and statuses in English, in English alphabetical order', async () => {
    localStorage.setItem('miatlas67.language', 'en');
    renderAtlas();

    expect(screen.getByRole('region', { name: 'Which region do you want to see?' })).toBeVisible();
    await chooseRegion('Oceania');

    expect(entry('Oceania', 'New Zealand')).toHaveTextContent(/^New ZealandWellington$/);
    expect(entry('Territories and others', 'Tokelau')).toHaveTextContent(
      'Dependent territory of New Zealand',
    );
    for (const section of ['Oceania', 'Territories and others']) {
      const names = namesOf(entries(section));
      expect(names).toEqual([...names].sort(new Intl.Collator('en').compare));
    }
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});
