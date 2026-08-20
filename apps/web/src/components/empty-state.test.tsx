import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('explains when a feature has no content', () => {
    render(<EmptyState title="No documents" description="Upload is not available yet." />);

    expect(screen.getByRole('heading', { name: 'No documents' })).toBeInTheDocument();
    expect(screen.getByText('Upload is not available yet.')).toBeInTheDocument();
  });
});
