import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.tsx';

describe('Button', () => {
  it('is a button with its text as accessible name', () => {
    render(<Button>Siguiente</Button>);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
  });

  it('does not submit forms by default', () => {
    render(<Button>Siguiente</Button>);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Siguiente</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('ignores taps when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bloqueado' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
