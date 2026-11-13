import { create } from 'zustand';
import { FilterState } from '../types';

interface FilterStore extends FilterState {
  setSearchQuery: (query: string) => void;
  setSelectedCuisine: (cuisine: string | null) => void;
  setIsVegOnly: (vegOnly: boolean) => void;
  toggleVegOnly: () => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  setMinRating: (rating: number | null) => void;
  setHasOffersOnly: (hasOffers: boolean) => void;
  toggleOffersOnly: () => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  searchQuery: '',
  selectedCuisine: null,
  isVegOnly: false,
  sortBy: 'relevance',
  minRating: null,
  hasOffersOnly: false,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCuisine: (selectedCuisine) => set({ selectedCuisine }),
  setIsVegOnly: (isVegOnly) => set({ isVegOnly }),
  toggleVegOnly: () => set((state) => ({ isVegOnly: !state.isVegOnly })),
  setSortBy: (sortBy) => set({ sortBy }),
  setMinRating: (minRating) => set({ minRating }),
  setHasOffersOnly: (hasOffersOnly) => set({ hasOffersOnly }),
  toggleOffersOnly: () => set((state) => ({ hasOffersOnly: !state.hasOffersOnly })),
  resetFilters: () => set(initialState),
}));
