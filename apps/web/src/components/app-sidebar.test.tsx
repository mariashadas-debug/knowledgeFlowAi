import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppSidebar } from './app-sidebar';

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
  });
});
