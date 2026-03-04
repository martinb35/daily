import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamView } from './TeamView';

vi.mock('../../hooks/useIpc', () => ({
  useIpc: () => ({
    invoke: vi.fn().mockResolvedValue([]),
  }),
}));

describe('TeamView', () => {
  it('renders the team heading', async () => {
    render(<TeamView />);
    expect(await screen.findByRole('heading', { name: /team/i })).toBeInTheDocument();
  });
});
