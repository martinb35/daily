import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarView } from './CalendarView';

vi.mock('../../hooks/useIpc', () => ({
  useIpc: () => ({
    invoke: vi.fn().mockResolvedValue([]),
  }),
}));

describe('CalendarView', () => {
  it('renders the calendar heading', async () => {
    render(<CalendarView />);
    expect(await screen.findByText(/calendar/i)).toBeInTheDocument();
  });
});
