import React from 'react';
import create from 'zustand';

// Define resource types
const RESOURCES = ['Wood', 'Brick', 'Glass', 'Wheat', 'Stone'];

// Predefined widget cycles (3 resources at a time)
const WIDGET_CYCLES = [
  ['Wood', 'Brick', 'Glass'],
  ['Brick', 'Glass', 'Wheat'],
  ['Glass', 'Wheat', 'Stone'],
  ['Wheat', 'Stone', 'Wood'],
  ['Stone', 'Wood', 'Brick'],
];

// Zustand store
const gameStore = create((set) => ({
  grid: Array(16).fill(null), // 4x4 grid
  currentWidgetIndex: 0,
  makeMove: (index) =>
    set((state) => {
      if (state.grid[index]) return state; // Tile occupied
      const grid = [...state.grid];
      const currentResource = WIDGET_CYCLES[state.currentWidgetIndex][0];
      grid[index] = currentResource;
      const nextWidgetIndex = (state.currentWidgetIndex + 1) % WIDGET_CYCLES.length;

      return {
        grid,
        currentWidgetIndex: nextWidgetIndex,
      };
    }),
  resetGame: () => set({ grid: Array(16).fill(null), currentWidgetIndex: 0 }),
}));

// Custom hook for selecting state
export function useGameStore(selector) {
  const getSnapshot = React.useCallback(() => selector(gameStore.getState()), [selector]);
  return React.useSyncExternalStore(gameStore.subscribe, getSnapshot, getSnapshot);
}

export { gameStore, RESOURCES, WIDGET_CYCLES };