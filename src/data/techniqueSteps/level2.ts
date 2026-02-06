import { StepTemplate } from './types';
import { formatPos, extractUnit, extractCandidates, extractNumber } from './helpers';

export const nakedPairSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const [cell1, cell2] = result.highlightCells;
      return `Look at cells ${formatPos(cell1)} and ${formatPos(cell2)}.`;
    },
    getHighlightCells: (result) => result.highlightCells.slice(0, 2),
    getMascotHint: () => '*tilts head* see those two cells?',
  },
  {
    getText: (result) => {
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(' and ') : 'the same two numbers';
      return `Both cells have exactly two candidates: ${candidateStr}. They form a Naked Pair!`;
    },
    getHighlightCells: (result) => result.highlightCells.slice(0, 2),
  },
  {
    getText: (result) => {
      const unit = extractUnit(result.explanation) ?? 'their shared unit';
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(' and ') : 'these values';
      return `Since ${candidateStr} must go in these two cells, they can be eliminated from other cells in ${unit}.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*paw swipe* clear those candidates!',
  },
];

export const hiddenPairSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const unit = extractUnit(result.explanation) ?? 'this unit';
      return `Look at ${unit}. Two numbers are hiding together in exactly two cells.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*curious meow* two numbers, two cells~',
  },
  {
    getText: (result) => {
      const [cell1, cell2] = result.highlightCells;
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(' and ') : 'two numbers';
      return `${candidateStr} only appear in ${formatPos(cell1)} and ${formatPos(cell2)}. This is a Hidden Pair!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      return `Since these two values are locked into these cells, all OTHER candidates in these cells can be removed.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*stretches* clear out the extras~',
  },
];

export const pointingPairSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Look at where ${num ?? 'a number'} can go inside this box.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*paw gesture* look where they line up!',
  },
  {
    getText: (result) => {
      return `The candidates are all aligned in the same row or column. They form a Pointing Pair!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Since ${num ?? 'this number'} must be in one of these cells within the box, it can be eliminated from the rest of the row or column outside the box.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*points paw* the box tells the line!',
  },
];

export const boxLineReductionSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Look at where ${num ?? 'a number'} can go in this row or column.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*stretches* the line tells the box a secret~',
  },
  {
    getText: (result) => {
      return `All candidates for this number in the line fall within a single box. This is a Box/Line Reduction!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Since ${num ?? 'this number'} in the line must be in this box, it can be eliminated from other cells in the box.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => "*nods* the line narrows it down!",
  },
];
