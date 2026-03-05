import { create } from 'zustand';
import type { TeamMember } from '@shared/types';

interface TeamState {
  members: TeamMember[];
  loading: boolean;
  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (member: TeamMember) => void;
  removeMember: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  members: [],
  loading: false,
  setMembers: (members) => set({ members }),
  addMember: (member) => set((s) => ({ members: [...s.members, member] })),
  updateMember: (member) =>
    set((s) => ({ members: s.members.map((m) => (m.id === member.id ? member : m)) })),
  removeMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));
