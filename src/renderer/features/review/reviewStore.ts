import { create } from 'zustand';
import type { ReviewSnapshot } from '@shared/types';

interface ReviewState {
  reviews: ReviewSnapshot[];
  loading: boolean;
  setReviews: (reviews: ReviewSnapshot[]) => void;
  addReview: (review: ReviewSnapshot) => void;
  setLoading: (loading: boolean) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  loading: false,
  setReviews: (reviews) => set({ reviews }),
  addReview: (review) => set((s) => ({ reviews: [...s.reviews, review] })),
  setLoading: (loading) => set({ loading }),
}));
