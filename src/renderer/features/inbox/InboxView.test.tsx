import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InboxView } from './InboxView';

vi.mock('../../hooks/useIpc', () => ({
  useIpc: () => ({
    invoke: vi.fn().mockResolvedValue([]),
  }),
}));

describe('InboxView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the inbox heading', async () => {
    render(<InboxView />);
    expect(await screen.findByText(/inbox/i)).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    render(<InboxView />);
    expect(await screen.findByText(/all clear/i)).toBeInTheDocument();
  });
});
