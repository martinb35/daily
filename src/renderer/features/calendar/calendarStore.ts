import { create } from 'zustand';
import type { TimeBlock } from '@shared/types';

interface CalendarState {
  timeblocks: TimeBlock[];
  selectedDate: string; // ISO date
  loading: boolean;
  setTimeblocks: (timeblocks: TimeBlock[]) => void;
  addTimeblock: (block: TimeBlock) => void;
  updateTimeblock: (block: TimeBlock) => void;
  removeTimeblock: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  timeblocks: [],
  selectedDate: new Date().toISOString().split('T')[0],
  loading: false,
  setTimeblocks: (timeblocks) => set({ timeblocks }),
  addTimeblock: (block) => set((s) => ({ timeblocks: [...s.timeblocks, block] })),
  updateTimeblock: (block) =>
    set((s) => ({
      timeblocks: s.timeblocks.map((b) => (b.id === block.id ? block : b)),
    })),
  removeTimeblock: (id) =>
    set((s) => ({ timeblocks: s.timeblocks.filter((b) => b.id !== id) })),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setLoading: (loading) => set({ loading }),
}));
