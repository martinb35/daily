import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewView } from './ReviewView';

vi.mock('../../hooks/useIpc', () => ({
  useIpc: () => ({
    invoke: vi.fn().mockResolvedValue([]),
  }),
}));

describe('ReviewView', () => {
  it('renders heading and start review button', async () => {
    render(<ReviewView />);
    expect(await screen.findByRole('heading', { name: /weekly review/i })).toBeInTheDocument();
    expect(screen.getByText(/start this week/i)).toBeInTheDocument();
  });
});
