import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders the quick add input', async () => {
    render(<InboxView />);
    expect(await screen.findByPlaceholderText(/add a task/i)).toBeInTheDocument();
  });

  it('renders kanban columns', async () => {
    render(<InboxView />);
    expect(await screen.findByText(/📥 Inbox/)).toBeInTheDocument();
    expect(screen.getByText(/🎯 Do/)).toBeInTheDocument();
    expect(screen.getByText(/📤 Delegated/)).toBeInTheDocument();
    expect(screen.getByText(/✅ Done/)).toBeInTheDocument();
  });
});
