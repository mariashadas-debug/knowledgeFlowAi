import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';

import { AppSidebar } from './app-sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/assistant' }));

describe('AppSidebar', () => {
  it('renders the main navigation links', () => {
    render(<AppSidebar />);

    const expectedLinks = [
      ['Dashboard', '/'],
      ['Assistant', '/assistant'],
      ['Documents', '/documents'],
      ['Conversations', '/conversations'],
      ['Analytics', '/analytics'],
      ['Settings', '/settings'],
    ];

    for (const [name, href] of expectedLinks) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
    expect(screen.getByRole('link', { name: 'Assistant' })).toHaveAttribute('aria-current', 'page');
  });
});
