import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App', () => {
  it('renders the welcome heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Hola MiAtlas67' })).toBeInTheDocument();
  });
});
