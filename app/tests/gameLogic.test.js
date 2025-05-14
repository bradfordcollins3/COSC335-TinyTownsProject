import { describe, it, expect } from 'vitest';
import { calculateScore, checkPatterns, BUILDING_PATTERNS } from '../src/App.jsx';

const createGrid = (initial = 'none') => Array(4).fill().map(() => Array(4).fill(initial));

// Helper to set up selected cells for pattern matching
const createSelectedCells = (cells) => {
  const selectedCells = new Set();
  cells.forEach(([row, col]) => selectedCells.add(`${row}-${col}`));
  return selectedCells;
};

describe('Tiny Towns Logic Tests', () => {
  describe('Scoring Logic', () => {
    describe('Cottage Scoring', () => {
      it('Cottage is worth 3 points if fed by a Farm', () => {
        const grid = createGrid();
        grid[0][0] = 'cottage';
        grid[1][1] = 'farm';
        expect(calculateScore(grid)).toBe(3 - 14); // 3 VP - 14 empty
      });

      it('Cottage is worth 0 points if not fed', () => {
        const grid = createGrid();
        grid[2][2] = 'cottage';
        expect(calculateScore(grid)).toBe(0 - 15); // 0 VP - 15 empty
      });
    });

    describe('Well Scoring', () => {
      it('Well gets 1 point per adjacent Cottage', () => {
        const grid = createGrid();
        grid[1][1] = 'well';
        grid[0][1] = 'cottage';
        grid[1][2] = 'cottage';
        expect(calculateScore(grid)).toBe(2 - 13); // 2 VP - 13 empty
      });

      it('Well gets 0 points if no adjacent Cottages', () => {
        const grid = createGrid();
        grid[0][0] = 'well';
        expect(calculateScore(grid)).toBe(0 - 15); // 0 VP - 15 empty
      });
    });

    describe('Cathedral Scoring', () => {
      it('Cathedral scores 2 VP and nullifies empty/resource penalties', () => {
        const grid = createGrid('wheat');
        grid[0][0] = 'cathedral';
        expect(calculateScore(grid)).toBe(2); // 2 VP + 15 × 0
      });

      it('Cathedral scores 2 VP with mixed empty/resources', () => {
        const grid = createGrid();
        grid[0][0] = 'cathedral';
        grid[1][1] = 'wheat';
        grid[2][2] = 'stone';
        expect(calculateScore(grid)).toBe(2); // 2 VP + 13 × 0
      });
    });

    describe('Chapel Scoring', () => {
      it('Chapel scores 1 point for each fed Cottage', () => {
        const grid = createGrid();
        grid[0][0] = 'chapel';
        grid[1][1] = 'cottage';
        grid[2][2] = 'cottage';
        grid[3][3] = 'farm';
        expect(calculateScore(grid)).toBe(6 + 2 - 12); // 6 VP (2 fed cottages) + 2 VP (chapel) - 12 empty
      });

      it('Chapel scores 0 if no fed Cottages', () => {
        const grid = createGrid();
        grid[0][0] = 'chapel';
        grid[1][1] = 'cottage';
        expect(calculateScore(grid)).toBe(0 - 14); // 0 VP - 14 empty
      });
    });

    describe('Tavern Scoring', () => {
      it('Scores 9 VP for 3 Taverns', () => {
        const grid = createGrid();
        grid[0][0] = 'tavern';
        grid[0][1] = 'tavern';
        grid[0][2] = 'tavern';
        expect(calculateScore(grid)).toBe(9 - 13); // 9 VP - 13 empty
      });

      it('Scores 20 VP for 6 Taverns (caps at 5)', () => {
        const grid = createGrid();
        grid[0][0] = 'tavern';
        grid[0][1] = 'tavern';
        grid[0][2] = 'tavern';
        grid[0][3] = 'tavern';
        grid[1][0] = 'tavern';
        grid[1][1] = 'tavern';
        expect(calculateScore(grid)).toBe(20 - 10); // 20 VP - 10 empty
      });
    });

    describe('Empty and Resource Scoring', () => {
      it('All resources score -16 VP', () => {
        const grid = createGrid('wheat');
        expect(calculateScore(grid)).toBe(-16); // 16 × -1 VP
      });

      it('Mixed empty and resources score -1 VP each without Cathedral', () => {
        const grid = createGrid();
        grid[0][0] = 'wheat';
        grid[0][1] = 'stone';
        expect(calculateScore(grid)).toBe(-16); // 14 empty + 2 resources = -16 VP
      });
    });
  });

  describe('Pattern Matching', () => {
    describe('Cottage Pattern', () => {
      it('Valid Cottage pattern matches', () => {
        const grid = createGrid();
        grid[0][1] = 'wheat';
        grid[1][0] = 'brick';
        grid[1][1] = 'glass';
        const selectedCells = createSelectedCells([[0,1], [1,0], [1,1]]);
        expect(checkPatterns(grid, selectedCells).cottage).toBe(true);
      });

      it('Invalid Cottage pattern fails', () => {
        const grid = createGrid();
        grid[0][0] = 'wheat';
        grid[1][0] = 'stone';
        grid[1][1] = 'glass';
        const selectedCells = createSelectedCells([[0,0], [1,0], [1,1]]);
        expect(checkPatterns(grid, selectedCells).cottage).toBe(false);
      });
    });

    describe('Well Pattern', () => {
      it('Valid Well pattern matches', () => {
        const grid = createGrid();
        grid[0][0] = 'wood';
        grid[0][1] = 'stone';
        const selectedCells = createSelectedCells([[0,0], [0,1]]);
        expect(checkPatterns(grid, selectedCells).well).toBe(true);
      });

      it('Invalid Well pattern fails', () => {
        const grid = createGrid();
        grid[0][0] = 'wood';
        grid[0][1] = 'wheat';
        const selectedCells = createSelectedCells([[0,0], [0,1]]);
        expect(checkPatterns(grid, selectedCells).well).toBe(false);
      });
    });

    describe('Cathedral Pattern', () => {
      it('Valid Cathedral pattern matches', () => {
        const grid = createGrid();
        grid[0][1] = 'wheat';
        grid[1][0] = 'stone';
        grid[1][1] = 'glass';
        const selectedCells = createSelectedCells([[0,1], [1,0], [1,1]]);
        expect(checkPatterns(grid, selectedCells).cathedral).toBe(true);
      });

      it('Invalid Cathedral pattern fails', () => {
        const grid = createGrid();
        grid[0][0] = 'wheat';
        grid[1][0] = 'brick';
        grid[1][1] = 'glass';
        const selectedCells = createSelectedCells([[0,0], [1,0], [1,1]]);
        expect(checkPatterns(grid, selectedCells).cathedral).toBe(false);
      });
    });
  });
});