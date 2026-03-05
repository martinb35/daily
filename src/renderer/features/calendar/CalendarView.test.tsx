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
  it('renders toolbar with day/week toggle and today button', async () => {
    render(<CalendarView />);
    expect(await screen.findByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
  });
});
