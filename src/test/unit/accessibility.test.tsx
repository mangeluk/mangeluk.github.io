// Unit tests for accessibility attributes
// Requirements: 8.2, 9.2, 22.1, 22.2, 22.4

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InputLine from '@/components/Terminal/InputLine';
import MobileKeyboard from '@/components/MobileKeyboard';
import WelcomeBanner from '@/components/Terminal/WelcomeBanner';

describe('Accessibility: InputLine', () => {
  it('has aria-label identifying the command input (Req. 22.1)', () => {
    render(
      <InputLine
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        onArrowUp={() => {}}
        onArrowDown={() => {}}
        disabled={false}
        prompt="visitor@portfolio:~$"
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label', 'Entrada de comandos de la terminal');
  });
});

describe('Accessibility: MobileKeyboard', () => {
  it('each button has role="button" and a non-empty aria-label (Req. 22.4)', () => {
    render(<MobileKeyboard onCommand={() => {}} disabled={false} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((btn: HTMLElement) => {
      const ariaLabel = btn.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    });
  });

  it('renders all 5 shortcut commands', () => {
    render(<MobileKeyboard onCommand={() => {}} disabled={false} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });
});

describe('Accessibility: WelcomeBanner', () => {
  it('renders the welcome message in Spanish (Req. 9.2)', () => {
    render(<WelcomeBanner lang="es" />);
    expect(screen.getByText(/help/i)).toBeTruthy();
  });

  it('renders the welcome message in English', () => {
    render(<WelcomeBanner lang="en" />);
    expect(screen.getByText(/help/i)).toBeTruthy();
  });
});
