import { StepTemplate } from './types';
import { formatPos, formatPositions, extractUnit, extractCandidates, extractNumber } from './helpers';

export const nakedTripleSteps: StepTemplate[] = [
  {
    getText: (result) => {
      return `Look at cells ${formatPositions(result.highlightCells)}. These three cells share a special relationship.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*counts on paws* one, two, three!',
  },
  {
    getText: (result) => {
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(', ') : 'three numbers';
      return `Together, they contain at most three candidates: ${candidateStr}. This is a Naked Triple!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(', ') : 'these values';
      return `Since ${candidateStr} are locked into these three cells, they can be eliminated from other cells in the unit.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*focused stare* triple threat!',
  },
];

export const hiddenTripleSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const unit = extractUnit(result.explanation) ?? 'this unit';
      return `Look at ${unit}. Three numbers are hiding together in exactly three cells.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*curious meow* three numbers, three cells~',
  },
  {
    getText: (result) => {
      const candidates = extractCandidates(result.explanation);
      const candidateStr = candidates.length > 0 ? candidates.join(', ') : 'three numbers';
      return `${candidateStr} only appear in ${formatPositions(result.highlightCells)}. This is a Hidden Triple!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      return `Since these three values are locked into these cells, all OTHER candidates in these cells can be removed.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*stretches* clear out the extras~',
  },
];

export const xWingSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Look for where ${num ?? 'a number'} appears across two rows (or two columns).`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*stretches into X shape* see the pattern?',
  },
  {
    getText: (result) => {
      return `The candidate appears in exactly two cells in each row, and they share the same two columns. This forms an X pattern!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `The number must occupy one diagonal pair. So ${num ?? 'it'} can be eliminated from all other cells in those columns.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*crosses paws* X marks the spot!',
  },
];

export const finnedFishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Look for an X-Wing pattern with ${num ?? 'a number'}, but one row has an extra cell — the "fin."`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*squints* almost an X-Wing, but with a fin~',
  },
  {
    getText: () => `The fin breaks the regular X-Wing, but it restricts where eliminations can happen — only cells that see both the X-Wing column and the fin.`,
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractNumber(result.explanation);
      return `Eliminate ${num ?? 'this candidate'} from cells that see the fin and lie in the X-Wing columns.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*flicks tail* the fin narrows it down!',
  },
];
