import { StepTemplate } from './types';
import { formatPos, formatPositions, extractNumber } from './helpers';

export const swordfishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `This is an advanced pattern. Look for ${num ?? 'a number'} across three rows.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*focused stare* three rows, three columns~',
  },
  {
    getText: (result) => {
      return `The candidate appears in 2-3 cells per row, and those cells collectively occupy exactly three columns. This is a Swordfish!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Eliminate ${num ?? 'this candidate'} from all other cells in those three columns.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*swishes tail* the swordfish strikes!',
  },
];

export const jellyfishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `This is an expert pattern. Look for ${num ?? 'a number'} across four rows.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*wide eyes* four rows, four columns~',
  },
  {
    getText: (result) => {
      return `The candidate appears in 2-4 cells per row, and those cells collectively occupy exactly four columns. This is a Jellyfish!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Eliminate ${num ?? 'this candidate'} from all other cells in those four columns.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*tentacle wiggle* the jellyfish stings!',
  },
];

export const xyWingSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const [pivot, wing1, wing2] = result.highlightCells;
      return `Find the pivot cell at ${formatPos(pivot)}. It has exactly two candidates.`;
    },
    getHighlightCells: (result) => [result.highlightCells[0]],
    getMascotHint: () => '*thoughtful meow* pivot, wing, wing...',
  },
  {
    getText: (result) => {
      const [pivot, wing1, wing2] = result.highlightCells;
      return `The pivot sees two wing cells: ${formatPos(wing1)} and ${formatPos(wing2)}. Each wing shares one candidate with the pivot and they share a common candidate between them.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      return `No matter which value the pivot takes, the common candidate (Z) is forced into one of the wings. So Z can be eliminated from cells that see both wings.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*proud purr* XY-Wing mastered!',
  },
];

export const xyzWingSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const [pivot] = result.highlightCells;
      return `Find the pivot cell at ${formatPos(pivot)}. It has exactly three candidates.`;
    },
    getHighlightCells: (result) => [result.highlightCells[0]],
    getMascotHint: () => '*thoughtful meow* three candidates in the pivot...',
  },
  {
    getText: (result) => {
      const [pivot, wing1, wing2] = result.highlightCells;
      return `The pivot sees two wing cells: ${formatPos(wing1)} and ${formatPos(wing2)}. Each wing has two candidates, sharing one with the pivot and one common candidate (Z) between them.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      return `Z appears in all three cells. Any cell that sees ALL three (pivot + both wings) can have Z eliminated.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*proud purr* XYZ-Wing mastered!',
  },
];

export const wxyzWingSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const [pivot] = result.highlightCells;
      return `Find the pivot cell at ${formatPos(pivot)}. It has four candidates.`;
    },
    getHighlightCells: (result) => [result.highlightCells[0]],
    getMascotHint: () => '*wide eyes* four candidates, three wings...',
  },
  {
    getText: (result) => `The four cells collectively hold exactly four candidates. One candidate appears in all four cells.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: () => `The shared candidate can be eliminated from any cell that sees ALL four cells in the pattern.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*proud stretch* WXYZ-Wing complete!',
  },
];

export const uniqueRectangleSteps: StepTemplate[] = [
  {
    getText: (result) => `Four cells form a rectangle across two boxes. Three corners have exactly the same two candidates.`,
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*alert ears* a deadly rectangle pattern!',
  },
  {
    getText: () => `If the fourth corner also had only those two candidates, the puzzle would have multiple solutions — which is invalid.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: () => `To prevent the deadly pattern, eliminate the rectangle candidates from the fourth corner.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*swipes paw* uniqueness saved!',
  },
];

export const avoidableRectangleSteps: StepTemplate[] = [
  {
    getText: (result) => `Four cells form a rectangle across two boxes. Two solved corners anchor the pattern.`,
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*tilts head* the solved cells tell a story~',
  },
  {
    getText: () => `One unsolved corner has exactly the two anchor values. To avoid a deadly pattern, the other corner must not complete the rectangle.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: () => `Eliminate the dangerous value from the remaining corner.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*nods* avoidable rectangle blocked!',
  },
];

export const bugSteps: StepTemplate[] = [
  {
    getText: (result) => `Look at the grid. Almost every unsolved cell has exactly two candidates — a near-BUG state.`,
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*ears perk up* bivalue everywhere except one~',
  },
  {
    getText: (result) => `One cell has three candidates instead of two. This breaks the deadly BUG pattern.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => `The extra candidate must be the solution for this cell — eliminate the other two.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*determined meow* BUG squashed!',
  },
];

export const almostLockedSetsSteps: StepTemplate[] = [
  {
    getText: (result) => `Two Almost Locked Sets (ALS) are connected. Each is a group of N cells containing N+1 candidates.`,
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*focused stare* two sets, one connection~',
  },
  {
    getText: () => `The sets share a restricted common candidate (X) and another shared candidate (Z). X links them; Z can be eliminated.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: () => `Eliminate Z from cells that see all Z-positions in both sets.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*proud purr* almost locked, fully solved!',
  },
];

export const aicSteps: StepTemplate[] = [
  {
    getText: (result) => `A chain of alternating strong and weak links connects candidates across cells.`,
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*traces paw along chain* strong, weak, strong...',
  },
  {
    getText: () => `The chain starts and ends with strong links on the same candidate in different cells. Both endpoints must be true or false together.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: () => `Any cell that sees both chain endpoints can have that candidate eliminated.`,
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*satisfied purr* the chain reveals the truth!',
  },
];

// ============================================
// Complex Fish
// ============================================

export const frankenFishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      return `This is a Franken Fish — a fish pattern that uses boxes as base or cover sets alongside rows/columns.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*peers into the box* this fish mixes in boxes~',
  },
  {
    getText: (result) => {
      const hasFins = result.explanation.includes('Finned');
      return hasFins
        ? `The fish has fins — base candidates not covered by cover sets. Eliminations must see all fins.`
        : `All base candidates are covered. Standard fish eliminations apply.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const elimCount = result.eliminations.reduce((sum, e) => sum + e.candidates.length, 0);
      return `Eliminate ${elimCount} candidate${elimCount !== 1 ? 's' : ''} from cells in the cover sets that are not in the base sets.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*swishes tail* the franken fish strikes!',
  },
];

export const mutantFishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      return `This is a Mutant Fish — the most general fish form, with rows and columns mixed in the base or cover sets.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*wide eyes* rows and columns together!',
  },
  {
    getText: (result) => {
      const hasFins = result.explanation.includes('Finned');
      return hasFins
        ? `This mutant fish has fins. Only eliminations that see all fin cells are valid.`
        : `The mutant fish is unfinned — all base candidates are covered.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const elimCount = result.eliminations.reduce((sum, e) => sum + e.candidates.length, 0);
      return `The mutant pattern eliminates ${elimCount} candidate${elimCount !== 1 ? 's' : ''}.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*stretches* the mutant fish is powerful!',
  },
];

export const siameseFishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      return `This is a Siamese Fish — two finned fish sharing the same cells but differing in one cover set.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*sees double* two fish in one!',
  },
  {
    getText: (result) => {
      return `Each fish produces different eliminations. Combined, the Siamese pair eliminates more than either alone.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const elimCount = result.eliminations.reduce((sum, e) => sum + e.candidates.length, 0);
      return `Together, the siamese twins eliminate ${elimCount} candidate${elimCount !== 1 ? 's' : ''}.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*playful pounce* double the fish, double the power!',
  },
];
