// src/App.jsx
import React, { useState, useEffect } from 'react';
import { getDb } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const RESOURCE_COLORS = {
  wheat: 'bg-yellow-400',
  stone: 'bg-[#D2B48C]',
  wood: 'bg-[#8B4513]',
  brick: 'bg-[#FF4040]',
  glass: 'bg-[#00CCCC]',
  none: 'bg-gray-200',
  cottage: 'bg-[#15bcc3]',
  well: 'bg-[#c3c3c1]',
  cathedral: 'bg-[#d012ff]',
  farm: 'bg-[#e22a06]',
  chapel: 'bg-[#ffbf14]',
  tavern: 'bg-[#1e752e]',
  theater: 'bg-[#ffdf16]',
  factory: 'bg-[#1a1d5f]',
};

export const BUILDING_PATTERNS = {
  cottage: [
    [[null, 'wheat'], ['brick', 'glass']],
    [['glass', 'wheat'], ['brick', null]],
    [['wheat', null], ['glass', 'brick']],
    [['brick', null], ['glass', 'wheat']],
    [['glass', 'brick'], [null, 'wheat']],
    [['wheat', 'glass'], [null, 'brick']],
    [[null, 'brick'], ['wheat', 'glass']],
    [['brick', 'glass'], [null, 'wheat']],
  ],
  well: [
    [['wood', 'stone']],
    [['stone', 'wood']],
    [['wood'], ['stone']],
    [['stone'], ['wood']],
  ],
  cathedral: [
    [[null, 'wheat'], ['stone', 'glass']],
    [['wheat', null], ['glass', 'stone']],
    [['stone', 'glass'], [null, 'wheat']],
    [['glass', 'stone'], ['wheat', null]],
    [['glass', 'wheat'], [null, 'stone']],
    [['wheat', 'glass'], [null, 'stone']],
    [['stone', null], ['glass', 'wheat']],
    [[null, 'stone'], ['wheat', 'glass']],
  ],
  farm: [
    [['wheat', 'wheat'], ['wood', 'wood']],
    [['wood', 'wheat'], ['wood', 'wheat']],
    [['wood', 'wood'], ['wheat', 'wheat']],
    [['wheat', 'wood'], ['wheat', 'wood']],
  ],
  chapel: [
    [[null, null, 'glass'], ['stone', 'glass', 'stone']],
    [['stone', null], ['glass', null], ['stone', 'glass']],
    [['stone', 'glass', 'stone'], ['glass', null, null]],
    [['stone', 'glass'], ['glass', null], ['stone', null]],
    [['glass', null, null], ['stone', 'glass', 'stone']],
    [['glass', 'stone'], [null, 'glass'], [null, 'stone']],
    [['stone', 'glass', 'stone'], [null, null, 'glass']],
    [[null, 'stone'], [null, 'glass'], ['glass', 'stone']],
  ],
  tavern: [
    [['brick', 'brick', 'glass']],
    [['glass', 'brick', 'brick']],
    [['brick'], ['brick'], ['glass']],
    [['glass'], ['brick'], ['brick']],
  ],
  theater: [
    [[null, 'stone', null], ['wood', 'glass', 'wood']],
    [[null, 'wood'], ['stone', 'glass'], [null, 'wood']],
    [['wood', 'glass', 'wood'], [null, 'stone', null]],
    [['wood', null], ['glass', 'stone'], ['wood', null]],
  ],
  factory: [
    [['wood', null, null, null], ['brick', 'stone', 'stone', 'brick']],
    [[null, 'brick'], [null, 'stone'], [null, 'stone'], ['wood', 'brick']],
    [['brick', 'stone', 'stone', 'brick'], [null, null, null, 'wood']],
    [['brick', 'wood'], ['stone', null], ['stone', null], ['brick', null]],
    [[null, null, null, 'wood'], ['brick', 'stone', 'stone', 'brick']],
    [['brick', null], ['stone', null], ['stone', null], ['brick', 'wood']],
    [['brick', 'stone', 'stone', 'brick'], ['wood', null, null, null]],
    [['wood', 'brick'], [null, 'stone'], [null, 'stone'], [null, 'brick']],
  ],
};

const DISPLAY_PATTERNS = {
  cottage: [[null, 'wheat'], ['brick', 'glass']],
  well: [['wood', 'stone']],
  cathedral: [[null, 'wheat'], ['stone', 'glass']],
  farm: [['wheat', 'wheat'], ['wood', 'wood']],
  chapel: [[null, null, 'glass'], ['stone', 'glass', 'stone']],
  tavern: [['brick', 'brick', 'glass']],
  theater: [[null, 'stone', null], ['wood', 'glass', 'wood']],
  factory: [['wood', null, null, null], ['brick', 'stone', 'stone', 'brick']],
};

const createResourceDeck = () => {
  const resources = ['wheat', 'stone', 'wood', 'brick', 'glass'];
  const deck = [];
  resources.forEach(resource => {
    for (let i = 0; i < 3; i++) {
      deck.push(resource);
    }
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

// Export all required functions
export { calculateScore, checkPatterns, handlePlaceResource, placeBuilding };

const calculateScore = (grid) => {
  let vp = 0;
  let fedCottages = 0;
  let farms = 0;
  let taverns = 0;
  let hasCathedral = false;
  const resources = ['wheat', 'stone', 'wood', 'brick', 'glass'];

  console.log('Starting VP calculation'); // Debug

  // Count Farms and check for Cathedral
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 'farm') farms++;
      if (grid[r][c] === 'cathedral') hasCathedral = true;
    }
  }

  // Count fed Cottages (each Farm feeds 4 Cottages)
  let cottages = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 'cottage') cottages.push([r, c]);
    }
  }
  fedCottages = Math.min(cottages.length, farms * 4);
  const fedCottagesForChapel = Math.min(cottages.length, farms * 4);

  // Score buildings
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = grid[r][c];
      console.log(`Processing cell [${r},${c}]: ${cell}, VP so far: ${vp}`); // Debug
      if (cell === 'cottage') {
        const points = cottages.some(([cr, cc]) => cr === r && cc === c && fedCottages > 0) ? 3 : 0;
        vp += points;
        if (fedCottages > 0 && points > 0) fedCottages--;
      } else if (cell === 'well') {
        const adjacentCottages = [
          [r-1, c], [r+1, c], [r, c-1], [r, c+1]
        ].filter(([nr, nc]) => nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && grid[nr][nc] === 'cottage');
        vp += adjacentCottages.length;
      } else if (cell === 'cathedral') {
        vp += 2;
      } else if (cell === 'chapel') {
        vp += fedCottagesForChapel;
      } else if (cell === 'tavern') {
        taverns++;
      } else if (cell === 'theater') {
        const uniqueBuildings = new Set();
        // Row buildings
        for (let col = 0; col < 4; col++) {
          if (col !== c && ['cottage', 'well', 'cathedral', 'farm', 'chapel', 'tavern', 'factory'].includes(grid[r][col])) {
            uniqueBuildings.add(grid[r][col]);
          }
        }
        // Column buildings
        for (let row = 0; row < 4; row++) {
          if (row !== r && ['cottage', 'well', 'cathedral', 'farm', 'chapel', 'tavern', 'factory'].includes(grid[row][c])) {
            uniqueBuildings.add(grid[row][c]);
          }
        }
        console.log('Theater at', r, c, 'Unique buildings:', [...uniqueBuildings], 'Size:', uniqueBuildings.size);
        vp += uniqueBuildings.size;
        console.log('Theater VP added:', uniqueBuildings.size, 'Total VP:', vp);
      }
    }
  }

  // Tavern scoring
  if (taverns === 1) vp += 2;
  else if (taverns === 2) vp += 5;
  else if (taverns === 3) vp += 9;
  else if (taverns === 4) vp += 14;
  else if (taverns >= 5) vp += 20;
  console.log('After tavern scoring, VP:', vp);

  // Empty squares and resources
  if (!hasCathedral) {
    let penaltyCount = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 'none' || resources.includes(grid[r][c])) {
          penaltyCount++;
          vp -= 1;
        }
      }
    }
    console.log('Empty/resource penalties:', penaltyCount, 'Total VP:', vp);
  }

  console.log('Final VP:', vp);
  return vp;
};

const checkPatterns = (grid, selectedCells) => {
  const cells = Array.from(selectedCells).map(id => {
    const [row, col] = id.split('-').map(Number);
    return { row, col, resource: grid[row][col] };
  });

  const checkPattern = (patterns, requiredCells) => {
    if (cells.length !== requiredCells) {
      console.log(`Failed: Expected ${requiredCells} cells, got ${cells.length}`, cells); // Debug
      return false;
    }

    const coords = cells.map(cell => ({
      row: cell.row,
      col: cell.col,
      resource: cell.resource === 'none' ? null : cell.resource,
    }));

    const minRow = Math.min(...coords.map(c => c.row));
    const maxRow = Math.max(...coords.map(c => c.row));
    const minCol = Math.min(...coords.map(c => c.col));
    const maxCol = Math.max(...coords.map(c => c.col));

    return patterns.some(pattern => {
      const patternRows = pattern.length;
      const patternCols = pattern[0].length;

      for (let startRow = minRow - 1; startRow <= minRow; startRow++) {
        for (let startCol = minCol - 1; startCol <= minCol; startCol++) {
          const selectedGrid = Array(patternRows).fill().map(() => Array(patternCols).fill(null));
          let valid = true;
          let cellsPlaced = 0;

          coords.forEach(({ row, col, resource }) => {
            const r = row - startRow;
            const c = col - startCol;
            if (r >= 0 && r < patternRows && c >= 0 && c < patternCols) {
              selectedGrid[r][c] = resource;
              cellsPlaced++;
            } else {
              valid = false;
            }
          });

          if (!valid || cellsPlaced !== requiredCells) continue;

          let matches = true;
          let patternCellsUsed = 0;

          for (let r = 0; r < patternRows; r++) {
            for (let c = 0; c < patternCols; c++) {
              if (pattern[r][c] !== null) {
                patternCellsUsed++;
                if (selectedGrid[r][c] !== pattern[r][c]) {
                  matches = false;
                  break;
                }
              } else if (selectedGrid[r][c] !== null) {
                matches = false;
                break;
              }
            }
            if (!matches) break;
          }

          if (matches && patternCellsUsed === requiredCells) {
            console.log('Pattern matched for', pattern, 'startRow:', startRow, 'startCol:', startCol, 'selectedGrid:', selectedGrid);
            return true;
          }
        }
      }
      return false;
    });
  };

  return {
    cottage: checkPattern(BUILDING_PATTERNS.cottage, 3),
    well: checkPattern(BUILDING_PATTERNS.well, 2),
    cathedral: checkPattern(BUILDING_PATTERNS.cathedral, 3),
    farm: checkPattern(BUILDING_PATTERNS.farm, 4),
    chapel: checkPattern(BUILDING_PATTERNS.chapel, 4),
    tavern: checkPattern(BUILDING_PATTERNS.tavern, 3),
    theater: checkPattern(BUILDING_PATTERNS.theater, 4),
    factory: checkPattern(BUILDING_PATTERNS.factory, 5),
  };
};

const handlePlaceResource = ({
  row,
  col,
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
  selectedFactory,
  factoryResources,
  setFactoryResources,
  setSelectedFactory,
}) => {
  // Validate grid access
  if (!grid?.[row]?.[col]) {
    alert('Invalid grid cell selected!');
    return;
  }

  if (grid[row][col] !== 'none' && grid[row][col] !== 'factory') {
    alert('Cell already occupied!');
    return;
  }

  if (grid[row][col] === 'factory' && selectedResourceIndex !== null) {
    try {
      // Validate displayedResources and selectedResourceIndex
      if (!Array.isArray(displayedResources) || selectedResourceIndex < 0 || selectedResourceIndex >= displayedResources.length) {
        alert('Invalid resource selection!');
        return;
      }

      const selectedResource = displayedResources[selectedResourceIndex];
      if (!selectedResource) {
        alert('Selected resource is not available!');
        return;
      }

      const cellId = `${row}-${col}`;

      // Update factory resources
      setFactoryResources(prev => ({
        ...prev,
        [cellId]: selectedResource,
      }));

      // Update displayed resources
      const newDisplayed = [...displayedResources];
      newDisplayed.splice(selectedResourceIndex, 1);

      // Update deck
      const newDeck = [...deck];
      if (newDeck.length > 0) {
        const newResource = newDeck.shift();
        newDisplayed.push(newResource);
      }
      newDeck.push(selectedResource);

      // Apply state updates
      setDisplayedResources(newDisplayed);
      setDeck(newDeck);
      setPlacementHistory([...placementHistory, { type: 'factory_resource', cell: { row, col }, resource: selectedResource, cardIndex: selectedResourceIndex }]);
      setSelectedResourceIndex(null);
    } catch (error) {
      console.error('Error placing resource in factory:', error);
      alert('Failed to place resource in factory. Please try again.');
    }
    return;
  }

  if (selectedFactory && grid[row][col] === 'none') {
    const [factoryRow, factoryCol] = selectedFactory.split('-').map(Number);
    const resource = factoryResources[selectedFactory];
    if (!resource) {
      alert('Factory has no resource to produce!');
      return;
    }

    const newGrid = [...grid];
    newGrid[row][col] = resource;
    setGrid(newGrid);
    setPlacementHistory([...placementHistory, { type: 'factory_produce', cell: { row, col }, resource, factory: { row: factoryRow, col: factoryCol } }]);
    setSelectedFactory(null);
    return;
  }

  if (selectedResourceIndex === null) {
    alert('Please select a resource first!');
    return;
  }

  const selectedResource = displayedResources[selectedResourceIndex];
  const newGrid = [...grid];
  newGrid[row][col] = selectedResource;
  setGrid(newGrid);

  const newDisplayed = [...displayedResources];
  newDisplayed.splice(selectedResourceIndex, 1);
  const newDeck = [...deck];
  if (newDeck.length > 0) {
    const newResource = newDeck.shift();
    newDisplayed.push(newResource);
  }
  newDeck.push(selectedResource);

  setDisplayedResources(newDisplayed);
  setDeck(newDeck);
  setPlacementHistory([...placementHistory, { type: 'resource', cell: { row, col }, resource: selectedResource, cardIndex: selectedResourceIndex }]);
  setSelectedResourceIndex(null);
};

const placeBuilding = ({
  building,
  row,
  col,
  selectedBuilding,
  selectedCells,
  grid,
  setGrid,
  setSelectedCells,
  placementHistory,
  setPlacementHistory,
  setSelectedBuilding,
}) => {
  if (selectedBuilding !== building || !selectedCells.has(`${row}-${col}`)) return;

  const newGrid = [...grid];
  newGrid[row][col] = building;
  const cellsToRemove = Array.from(selectedCells).filter(cellId => cellId !== `${row}-${col}`);
  cellsToRemove.forEach(cellId => {
    const [r, c] = cellId.split('-').map(Number);
    newGrid[r][c] = 'none';
  });
  setGrid(newGrid);
  setPlacementHistory([...placementHistory, { type: 'building', cell: { row, col }, cells: Array.from(selectedCells), building }]);
  setSelectedCells(new Set());
  setSelectedBuilding(null);
};

function App() {
  const [grid, setGrid] = useState(
    Array(4).fill().map(() => Array(4).fill('none'))
  );
  const [deck, setDeck] = useState(createResourceDeck());
  const [displayedResources, setDisplayedResources] = useState([]);
  const [selectedResourceIndex, setSelectedResourceIndex] = useState(null);
  const [placementHistory, setPlacementHistory] = useState([]);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [factoryResources, setFactoryResources] = useState({});
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [startTimestamp, setStartTimestamp] = useState(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [score, setScore] = useState(null);
  const [user, setUser] = useState(null);
  const [buildingValidity, setBuildingValidity] = useState({});

  useEffect(() => {
    setDisplayedResources(deck.slice(0, 3));
    setDeck(prevDeck => prevDeck.slice(3));
  }, []);

  useEffect(() => {
    getDb()
      .then(() => {
        setIsFirebaseReady(true);
      })
      .catch(error => {
        console.error('Failed to initialize Firebase:', error);
        alert('Failed to initialize Firebase: ' + error.message);
      });

    const unsubscribe = window.firebaseAuth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const validity = checkPatterns(grid, selectedCells);
    setBuildingValidity(validity);
    console.log('Building validity updated:', validity);
  }, [grid, selectedCells]);

  const handleSelectResource = (index) => {
    setSelectedResourceIndex(index);
    setSelectedFactory(null);
    setSelectedBuilding(null);
    setSelectedCells(new Set());
  };

  const handleSelectFactory = (row, col) => {
    const cellId = `${row}-${col}`;
    if (selectedFactory === cellId) {
      setSelectedFactory(null);
    } else {
      setSelectedFactory(cellId);
      setSelectedResourceIndex(null);
      setSelectedCells(new Set());
      setSelectedBuilding(null);
    }
  };

  const undoLastPlacement = () => {
    if (placementHistory.length === 0) return;

    const lastPlacement = placementHistory[placementHistory.length - 1];
    const newHistory = placementHistory.slice(0, -1);
    setPlacementHistory(newHistory);

    if (lastPlacement.type === 'resource') {
      const { row, col } = lastPlacement.cell;
      const newGrid = [...grid];
      newGrid[row][col] = 'none';
      setGrid(newGrid);

      const newDeck = [...deck];
      const usedResource = newDeck.pop();
      const newDisplayed = [...displayedResources];
      const lastDrawn = newDisplayed.pop();
      newDisplayed.splice(lastPlacement.cardIndex, 0, usedResource);
      if (lastDrawn) {
        newDeck.unshift(lastDrawn);
      }

      setDisplayedResources(newDisplayed);
      setDeck(newDeck);
    } else if (lastPlacement.type === 'factory_resource') {
      const { row, col } = lastPlacement.cell;
      const cellId = `${row}-${col}`;

      setFactoryResources(prev => {
        const newResources = { ...prev };
        delete newResources[cellId];
        return newResources;
      });

      const newDeck = [...deck];
      const usedResource = newDeck.pop();
      const newDisplayed = [...displayedResources];
      const lastDrawn = newDisplayed.pop();
      newDisplayed.splice(lastPlacement.cardIndex, 0, usedResource);
      if (lastDrawn) {
        newDeck.unshift(lastDrawn);
      }

      setDisplayedResources(newDisplayed);
      setDeck(newDeck);
    } else if (lastPlacement.type === 'factory_produce') {
      const { row, col } = lastPlacement.cell;
      const newGrid = [...grid];
      newGrid[row][col] = 'none';
      setGrid(newGrid);
    } else if (lastPlacement.type === 'building') {
      const { row, col } = lastPlacement.cell;
      const newGrid = [...grid];
      newGrid[row][col] = 'none';
      setGrid(newGrid);

      const cellsToReselect = lastPlacement.cells || [];
      const newSelectedCells = new Set(cellsToReselect);
      setSelectedCells(newSelectedCells);
      setSelectedBuilding(lastPlacement.building);
    }

    setSelectedFactory(null);
  };

  const toggleCellSelection = (row, col) => {
    const cellId = `${row}-${col}`;
    const newSelectedCells = new Set(selectedCells);
    if (newSelectedCells.has(cellId)) {
      newSelectedCells.delete(cellId);
    } else if (grid[row][col] !== 'none' && !['cottage', 'well', 'cathedral', 'farm', 'chapel', 'tavern', 'theater', 'factory'].includes(grid[row][col])) {
      newSelectedCells.add(cellId);
    }
    setSelectedCells(newSelectedCells);
    setSelectedFactory(null);
  };

  const selectBuilding = (building) => {
    if (selectedBuilding === building) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
      setSelectedFactory(null);
      setSelectedResourceIndex(null);
    }
  };

  const finishGame = async () => {
    if (!isFirebaseReady) {
      alert('Firebase is not yet initialized. Please wait a moment and try again.');
      return;
    }

    const endTimestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    const boardState = grid.flat().map(cell => {
      switch (cell) {
        case 'wood': return '1';
        case 'brick': return '2';
        case 'wheat': return '3';
        case 'glass': return '4';
        case 'stone': return '5';
        case 'cottage': return 'c';
        case 'well': return 'W';
        case 'cathedral': return 'C';
        case 'farm': return 'f';
        case 'chapel': return 'p';
        case 'tavern': return 't';
        case 'theater': return 'T';
        case 'factory': return 'F';
        default: return '0';
      }
    }).join('');

    const score = calculateScore(grid);

    const earnedAchievements = [];

    const emptySpaces = grid.flat().filter(cell => cell === 'none').length;
    if (emptySpaces === 0) {
      earnedAchievements.push('Perfect Town');
    }

    const buildingTypes = new Set(
      grid.flat().filter(cell => 
        ['cottage', 'well', 'cathedral', 'farm', 'chapel', 'tavern', 'theater', 'factory'].includes(cell)
      )
    );
    if (buildingTypes.size >= 5) {
      earnedAchievements.push('Master Builder');
    }

    const factoryCount = grid.flat().filter(cell => cell === 'factory').length;
    if (factoryCount >= 2) {
      earnedAchievements.push('Factory Magnate');
    }

    const chapelCount = grid.flat().filter(cell => cell === 'chapel').length;
    if (chapelCount >= 3) {
      earnedAchievements.push('Spiritual Haven');
    }

    const tavernCount = grid.flat().filter(cell => cell === 'tavern').length;
    if (tavernCount >= 4) {
      earnedAchievements.push('Social Hub');
    }

    const gameData = {
      userId: user ? user.uid : 'anonymous',
      board: boardState,
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      score: score,
      achievements: earnedAchievements,
    };

    try {
      const db = await getDb();
      const docRef = await addDoc(collection(db, 'games'), gameData);

      let message = `Game saved successfully with ID: ${docRef.id}\nScore: ${score} VP`;
      if (earnedAchievements.length > 0) {
        message += '\nAchievements Earned:\n- ' + earnedAchievements.join('\n- ');
      } else {
        message += '\nNo achievements earned this game.';
      }
      alert(message);
      setScore(score);
    } catch (error) {
      console.error('Error saving game to Firestore:', error);
      alert('Error saving game: ' + error.message);
    }
  };

  const resetGame = () => {
    setGrid(Array(4).fill().map(() => Array(4).fill('none')));
    const newDeck = createResourceDeck();
    setDeck(newDeck.slice(3));
    setDisplayedResources(newDeck.slice(0, 3));
    setSelectedResourceIndex(null);
    setPlacementHistory([]);
    setSelectedCells(new Set());
    setSelectedBuilding(null);
    setFactoryResources({});
    setSelectedFactory(null);
    setStartTimestamp(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    setScore(null);
  };

  const getPromptMessage = () => {
    if (score !== null) return `Game Over! Score: ${score} VP`;
    if (selectedResourceIndex !== null) {
      return `Select a Factory to store ${displayedResources[selectedResourceIndex]} or click a grid cell to place it.`;
    }
    if (selectedFactory) {
      const resource = factoryResources[selectedFactory];
      return resource ? `Click an empty grid cell to place ${resource} from the Factory.` : 'Factory is empty. Select a resource card to store in the Factory.';
    }
    if (selectedBuilding) {
      return `Click one of the selected cells to place the ${selectedBuilding}.`;
    }
    if (selectedCells.size > 0) {
      return '';
    }
    return '';
  };

  if (!isFirebaseReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <h1 className="text-4xl font-bold text-white font-sans">Loading Firebase...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 px-6 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-5xl font-extrabold text-white font-sans tracking-tight">
          Tiny Towns
        </h1>
        <div className="text-white font-sans">
          {user ? `Logged in as: ${user.email}` : 'Not logged in (Anonymous)'}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-start w-full lg:w-1/2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-8">
            {[
              { id: 'cottage', name: 'Cottage', pattern: DISPLAY_PATTERNS.cottage, effect: '3 ⛀ if this building is fed.' },
              { id: 'well', name: 'Well', pattern: DISPLAY_PATTERNS.well, effect: 'Provides 1 ⛀ for each adjacent cottage.' },
              { id: 'cathedral', name: 'Cathedral of Caterina', pattern: DISPLAY_PATTERNS.cathedral, effect: '2 ⛀. Empty squares in your town are worth 0 ⛀. (Instead of -1)' },
              { id: 'farm', name: 'Farm', pattern: DISPLAY_PATTERNS.farm, effect: 'Feeds 4 ☼ anywhere in the town.' },
              { id: 'chapel', name: 'Chapel', pattern: DISPLAY_PATTERNS.chapel, effect: 'Each Chapel is worth 1 ⛀ for each fed Cottage in town.' },
              { id: 'tavern', name: 'Tavern', pattern: DISPLAY_PATTERNS.tavern, effect: 'Number of ⛀ per Tavern: 1=2, 2=5, 3=9, 4=14, 5=20' },
              { id: 'theater', name: 'Theater', pattern: DISPLAY_PATTERNS.theater, effect: '1 ⛀ for each other unique building in same row/column' },
              { id: 'factory', name: 'Factory', pattern: DISPLAY_PATTERNS.factory, effect: 'When constructed choose one of the resources to store.' },
            ].map(building => (
              <div
                key={building.id}
                onClick={() => buildingValidity[building.id] && selectBuilding(building.id)}
                className={`w-36 h-48 bg-gradient-to-b from-[#f5e7c7] to-[#e6d7a7] rounded-xl border-4 border-[#6b3a0d] flex flex-col justify-between p-2 text-[#4a2c1a] shadow-lg transition-transform transform hover:scale-102 hover:shadow-2xl ${
                  buildingValidity[building.id] ? 'ring-4 ring-green-400' : ''
                } ${selectedBuilding === building.id ? 'ring-4 ring-yellow-400' : ''}`}
              >
                <div className="bg-[#e6ca77] text-xs font-bold py-2 rounded-t-lg border-b-2 border-[#6b3a0d] flex items-center pl-3 pr-8 w-full relative">
                  <span className="leading-tight">{building.name}</span>
                  <span className={`absolute top-0.5 right-2 w-6 h-6 rounded-full ${RESOURCE_COLORS[building.id]} border-2 border-[#4a2c1a]`}></span>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="grid gap-0.5 place-items-center"
                    style={{
                      gridTemplateColumns: `repeat(${building.pattern[0].length}, 30px)`,
                      gridTemplateRows: `repeat(${building.pattern.length}, 30px)`,
                    }}
                  >
                    {building.pattern.map((row, rIndex) =>
                      row.map((cell, cIndex) => (
                        <div
                          key={`${rIndex}-${cIndex}`}
                          className={`w-7 h-7 rounded-md ${
                            cell ? `border-2 border-[#5a5a5a] ${RESOURCE_COLORS[cell]}` : 'bg-[#f5e7c7]'
                          } transition-all duration-200`}
                        />
                      ))
                    )}
                  </div>
                </div>
                <div className="bg-[#e6ca77] text-[10px] text-center py-0.5 rounded-b-lg border-t-2 border-[#6b3a0d]">
                  {building.effect}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-4 text-white font-sans">Available Resources</h2>
            <div className="flex gap-4 flex-wrap">
              {displayedResources.map((resource, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResource(index)}
                  className={`w-32 h-48 bg-gradient-to-b from-[#f5e7c7] to-[#e6d7a7] rounded-xl border-4 border-[#6b3a0d] flex flex-col items-center justify-between p-3 text-[#4a2c1a] shadow-md transition-transform transform hover:scale-105 hover:shadow-xl ${
                    selectedResourceIndex === index ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  <span className="bg-[#e6ca77] text-lg font-bold w-full text-center py-2 rounded-t-md border-b-2 border-[#6b3a0d]">
                    {resource}
                  </span>
                  <div className={`w-12 h-12 rounded-md ${RESOURCE_COLORS[resource]} border-2 border-[#5a5a5a]`}></div>
                  <div className="bg-[#e6ca77] w-full text-center py-2 rounded-b-md border-t-2 border-[#6b3a0d]">
                     
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full lg:w-1/2">
          <div className="mb-6 text-xl text-white text-center w-full min-h-[2.5rem] font-sans">
            {getPromptMessage()}
          </div>

          <div className="grid grid-cols-4 gap-1 p-3 bg-gray-800 rounded-xl border-2 border-gray-600 shadow-lg">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const storedResource = factoryResources[cellId];
                return (
                  <button
                    key={cellId}
                    onClick={() => {
                      if (selectedBuilding && selectedCells.has(cellId)) {
                        placeBuilding({
                          building: selectedBuilding,
                          row: rowIndex,
                          col: colIndex,
                          selectedBuilding,
                          selectedCells,
                          grid,
                          setGrid,
                          setSelectedCells,
                          placementHistory,
                          setPlacementHistory,
                          setSelectedBuilding,
                        });
                        return;
                      }
                      if (selectedResourceIndex !== null || selectedFactory) {
                        handlePlaceResource({
                          row: rowIndex,
                          col: colIndex,
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
                          selectedFactory,
                          factoryResources,
                          setFactoryResources,
                          setSelectedFactory,
                        });
                        return;
                      }
                      if (grid[rowIndex][colIndex] === 'factory' && selectedResourceIndex === null) {
                        handleSelectFactory(rowIndex, colIndex);
                        return;
                      }
                      toggleCellSelection(rowIndex, colIndex);
                    }}
                    className={`w-24 h-24 flex items-center justify-center text-white font-bold text-lg rounded-md border-2 border-gray-700 ${RESOURCE_COLORS[cell]} hover:bg-opacity-80 transition-all duration-200 disabled:opacity-50 ${
                      selectedCells.has(cellId) ? 'ring-4 ring-yellow-400' : ''
                    } ${
                      selectedFactory === cellId ? 'ring-4 ring-green-400' : ''
                    } ${
                      grid[rowIndex][colIndex] === 'factory' && selectedResourceIndex !== null && !factoryResources[cellId]
                        ? 'ring-4 ring-cyan-400'
                        : ''
                    } relative overflow-hidden shadow-sm`}
                  >
                    {cell === 'none' ? '' : (
                      ['cottage', 'well', 'cathedral', 'farm', 'chapel', 'tavern', 'theater', 'factory'].includes(cell) ? (
                        <div
                          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full border-4 border-white ${RESOURCE_COLORS[cell]} transition-transform duration-200`}
                        >
                          {cell === 'factory' && storedResource && (
                            <div
                              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded ${RESOURCE_COLORS[storedResource]}`}
                            />
                          )}
                        </div>
                      ) : (
                        <div className={`w-[70%] h-[70%] rounded-md ${RESOURCE_COLORS[cell]} border-2 border-[#5a5a5a] transition-transform duration-200`} />
                      )
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md"
            >
              Reset Game
            </button>
            <button
              onClick={undoLastPlacement}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md"
            >
              Undo Last Placement
            </button>
            <button
              onClick={finishGame}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
            >
              Finish Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;