import { create } from 'zustand';

export const useMenuStore = create((set) => ({
  currentPage: 0,
  selectedCategory: '',
  activeProduct: null,
  viewportMode: 'mobile',
  animationsEnabled: true,
  recommendations: [],
  uiState: {
    isCheckoutOpen: false,
    isBranchPickerOpen: false,
    isCustomizerOpen: false,
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setActiveProduct: (prod) => set({ activeProduct: prod }),
  setViewportMode: (mode) => set({ viewportMode: mode }),
  setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setUiState: (updater) => set((state) => ({ 
    uiState: { ...state.uiState, ...updater } 
  })),
}));
