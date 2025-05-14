import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handlePlaceResource, placeBuilding, checkPatterns } from '../src/App.jsx';

// Mock window.alert
const originalAlert = window.alert;
beforeEach(() => {
  window.alert = vi.fn();
});
afterEach(() => {
  window.alert = originalAlert;
  vi.restoreAllMocks();
});

describe('Tiny Towns UI Functionality - Resource and Building Placement', () => {
  describe('Resource Placement', () => {
    const resources = ['wheat', 'stone', 'wood', 'brick', 'glass'];

    resources.forEach((resource, index) => {
      it(`Places ${resource} on an empty grid cell`, () => {
        const grid = Array(4).fill().map(() => Array(4).fill('none'));
        const setGrid = vi.fn();
        const displayedResources = [resource, 'stone', 'brick'];
        const setDisplayedResources = vi.fn();
        const deck = ['glass', 'wood'];
        const setDeck = vi.fn();
        const placementHistory = [];
        const setPlacementHistory = vi.fn();
        const selectedResourceIndex = 0;
        const setSelectedResourceIndex = vi.fn();

        handlePlaceResource({
          row: index % 4, // Use unique position for each resource
          col: 0,
          grid,
          setGrid,
          displayedResources,
          setDisplayedResources,
          deck,
          setDeck,
          placementHistory,
          setPlacementHistory,
          selectedResourceIndex,
          setSelectedResourceIndex,
          selectedFactory: null,
          factoryResources: {},
          setFactoryResources: vi.fn(),
          setSelectedFactory: vi.fn(),
        });

        // Verify grid updated with the resource
        expect(setGrid).toHaveBeenCalledWith(expect.any(Array));
        expect(setGrid.mock.calls[0][0][index % 4][0]).toBe(resource);

        // Verify displayedResources updated
        expect(setDisplayedResources).toHaveBeenCalledWith(['stone', 'brick', 'glass']);

        // Verify deck updated
        expect(setDeck).toHaveBeenCalledWith(['wood', resource]);

        // Verify placement history updated
        expect(setPlacementHistory).toHaveBeenCalledWith([
          { type: 'resource', cell: { row: index % 4, col: 0 }, resource, cardIndex: 0 },
        ]);

        // Verify resource index reset
        expect(setSelectedResourceIndex).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('Building Placement', () => {
    const buildings = [
      {
        id: 'cottage',
        pattern: { cells: [[0,1], [1,0], [1,1]], resources: ['wheat', 'brick', 'glass'] },
      },
      {
        id: 'well',
        pattern: { cells: [[0,0], [0,1]], resources: ['wood', 'stone'] },
      },
      {
        id: 'cathedral',
        pattern: { cells: [[0,1], [1,0], [1,1]], resources: ['wheat', 'stone', 'glass'] },
      },
      {
        id: 'farm',
        pattern: { cells: [[0,0], [0,1], [1,0], [1,1]], resources: ['wheat', 'wheat', 'wood', 'wood'] },
      },
      {
        id: 'chapel',
        pattern: { cells: [[0,2], [1,0], [1,1], [1,2]], resources: ['glass', 'stone', 'glass', 'stone'] },
      },
      {
        id: 'tavern',
        pattern: { cells: [[0,0], [0,1], [0,2]], resources: ['brick', 'brick', 'glass'] },
      },
      {
        id: 'theater',
        pattern: { cells: [[0,1], [1,0], [1,1], [1,2]], resources: ['stone', 'wood', 'glass', 'wood'] },
      },
      {
        id: 'factory',
        pattern: { cells: [[0,0], [1,0], [1,1], [1,2], [1,3]], resources: ['wood', 'brick', 'stone', 'stone', 'brick'] },
      },
    ];

    buildings.forEach(({ id, pattern }) => {
      it(`Places ${id} with valid resource pattern`, () => {
        const grid = Array(4).fill().map(() => Array(4).fill('none'));
        pattern.cells.forEach(([r, c], i) => {
          grid[r][c] = pattern.resources[i];
        });
        const setGrid = vi.fn();
        const selectedCells = new Set(pattern.cells.map(([r, c]) => `${r}-${c}`));
        const setSelectedCells = vi.fn();
        const selectedBuilding = id;
        const placementHistory = [];
        const setPlacementHistory = vi.fn();
        const setSelectedBuilding = vi.fn();

        // Verify pattern is valid
        expect(checkPatterns(grid, selectedCells)[id]).toBe(true);

        // Place building on the last cell
        const [placeRow, placeCol] = pattern.cells[pattern.cells.length - 1];
        placeBuilding({
          building: id,
          row: placeRow,
          col: placeCol,
          selectedBuilding,
          selectedCells,
          grid,
          setGrid,
          setSelectedCells,
          placementHistory,
          setPlacementHistory,
          setSelectedBuilding,
        });

        // Verify grid updated
        expect(setGrid).toHaveBeenCalledWith(expect.any(Array));
        expect(setGrid.mock.calls[0][0][placeRow][placeCol]).toBe(id);
        pattern.cells.slice(0, -1).forEach(([r, c]) => {
          expect(setGrid.mock.calls[0][0][r][c]).toBe('none');
        });

        // Verify selectedCells cleared
        expect(setSelectedCells).toHaveBeenCalledWith(new Set());

        // Verify placement history updated
        expect(setPlacementHistory).toHaveBeenCalledWith([
          {
            type: 'building',
            cell: { row: placeRow, col: placeCol },
            cells: Array.from(selectedCells),
            building: id,
          },
        ]);

        // Verify selectedBuilding reset
        expect(setSelectedBuilding).toHaveBeenCalledWith(null);
      });
    });
  });
});