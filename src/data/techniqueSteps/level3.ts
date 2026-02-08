import { StepTemplate } from './types';
import { formatPos, formatPositions, extractUnit, extractCandidates, extractNumber } from './helpers';

// Helper to extract candidate number from SDP explanation strings like "Skyscraper: 5 in rows..."
function extractSDPCandidate(explanation: string): number | null {
  // Match patterns like "Skyscraper: 5 in" or "2-String Kite: 9 in" or "Turbot Fish: 3 chain" or "Empty Rectangle: 7 in"
  const match = explanation.match(/:\s*(\d)\s/);
  if (match) return parseInt(match[1], 10);
  return null;
}

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

// ============================================
// Single Digit Patterns
// ============================================

export const skyscraperSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `Focus on candidate ${num ?? 'a number'}. Find two rows (or columns) where it appears in exactly two cells each.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*looks up* two towers rising from a shared base~',
  },
  {
    getText: (result) => {
      return `Two of these cells share the same column — that's the "base" of the skyscraper. The other two cells are the "endpoints." One endpoint must be true!`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `Since one endpoint must contain ${num ?? 'this number'}, any cell that sees both endpoints can have it eliminated.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*stretches tall* the skyscraper reveals the truth!',
  },
];

export const twoStringKiteSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `Focus on candidate ${num ?? 'a number'}. Find a row and a column where it appears in exactly two cells each — these are the "strings."`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*bats at string* two strings, one connection~',
  },
  {
    getText: (result) => {
      return `One cell from the row and one from the column share the same box — that's the kite's connection. The other two cells are the "endpoints."`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `One endpoint must contain ${num ?? 'this number'}. Eliminate it from any cell that sees both endpoints.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*playful swat* the kite string pulls the answer!',
  },
];

export const turbotFishSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `Focus on candidate ${num ?? 'a number'}. Find two conjugate pairs (units with exactly two cells for this number).`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*alert eyes* two strong links for the same number~',
  },
  {
    getText: (result) => {
      return `The pairs are connected by a weak link — two cells that see each other. This forms a chain of four cells where one end must be true.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `The chain endpoints tell us: ${num ?? 'this number'} can be eliminated from any cell that sees both ends.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*splashes* caught by the turbot fish!',
  },
];

export const emptyRectangleSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      return `Focus on candidate ${num ?? 'a number'} in a box. Its positions form an L-shape — restricted to one row and one column within the box.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*draws L in the air* see the shape in the box?',
  },
  {
    getText: (result) => {
      return `This is an Empty Rectangle! Now find a conjugate pair in a crossing row or column. One end of the pair lines up with the ER pattern.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const num = extractSDPCandidate(result.explanation);
      const target = result.eliminations[0]?.position;
      const targetStr = target ? ` at ${formatPos(target)}` : '';
      return `The ER and the conjugate pair work together: ${num ?? 'this number'} can be eliminated${targetStr}.`;
    },
    getHighlightCells: (result) => result.eliminations.map((e) => e.position),
    getMascotHint: () => '*tilts head* the rectangle reveals the answer!',
  },
];
