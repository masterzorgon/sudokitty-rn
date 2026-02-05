// Dynamic step templates for technique demonstrations
// These interpolate solver TechniqueResult data to create puzzle-specific instructions
//
// Each technique has a series of StepTemplates that are evaluated with the
// actual TechniqueResult to produce step text and highlights.

import { Position } from '../engine/types';
import { TechniqueResult } from '../engine/solver/types';

// ============================================
// Types
// ============================================

export interface StepTemplate {
  /** Generate step text from the solver result */
  getText: (result: TechniqueResult) => string;
  /** Which cells to highlight for this step */
  getHighlightCells: (result: TechniqueResult) => Position[];
  /** Optional mascot hint for this step */
  getMascotHint?: (result: TechniqueResult) => string;
}

export interface RenderedStep {
  text: string;
  highlightCells: Position[];
  mascotHint?: string;
}

// ============================================
// Helpers for Parsing TechniqueResult
// ============================================

function formatPos(pos: Position): string {
  return `R${pos.row + 1}C${pos.col + 1}`;
}

function formatPositions(positions: Position[]): string {
  return positions.map(formatPos).join(', ');
}

/** Extract unit name from explanation (e.g., "in row 3", "in box 5") */
function extractUnit(explanation: string): string | null {
  const match = explanation.match(/in (row|column|box) (\d+)/);
  if (match) return `${match[1]} ${match[2]}`;
  return null;
}

/** Extract candidate numbers from explanation */
function extractCandidates(explanation: string): number[] {
  // Match patterns like "candidates 1, 8" or "with candidates 2, 5"
  const match = explanation.match(/candidates? ([\d, ]+)/);
  if (match) {
    return match[1].split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
  }
  // Match patterns like "can only be 5"
  const singleMatch = explanation.match(/can only be (\d)/);
  if (singleMatch) return [parseInt(singleMatch[1], 10)];
  return [];
}

/** Extract a single number from explanation */
function extractNumber(explanation: string): number | null {
  // Match "5 can only go" or "5 in box"
  const match = explanation.match(/^(\d)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

// ============================================
// Step Templates per Technique
// ============================================

const nakedSingleSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const cell = result.highlightCells[0];
      return `Look at cell ${formatPos(cell)}. Let's figure out what value belongs here.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*squints* that cell looks lonely~',
  },
  {
    getText: (result) => {
      const cell = result.highlightCells[0];
      return `Check the row, column, and box that ${formatPos(cell)} belongs to. What numbers are already placed?`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const value = result.placements[0]?.value;
      const cell = result.highlightCells[0];
      return `After eliminating all other possibilities, only ${value} can go in ${formatPos(cell)}. This is a Naked Single!`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => 'purrfect! only one choice left~',
  },
];

const hiddenSingleSteps: StepTemplate[] = [
  {
    getText: (result) => {
      const unit = extractUnit(result.explanation) ?? 'this unit';
      return `Look at ${unit}. One number has only one possible home here.`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => '*ears perk up* where can that number go?',
  },
  {
    getText: (result) => {
      const value = result.placements[0]?.value;
      const unit = extractUnit(result.explanation) ?? 'this unit';
      return `The number ${value} can only fit in one cell in ${unit}. Even though other candidates exist there, ${value} has no other home.`;
    },
    getHighlightCells: (result) => result.highlightCells,
  },
  {
    getText: (result) => {
      const value = result.placements[0]?.value;
      const cell = result.highlightCells[0];
      return `Place ${value} in ${formatPos(cell)}. This is a Hidden Single — the number was "hidden" among other candidates!`;
    },
    getHighlightCells: (result) => result.highlightCells,
    getMascotHint: () => "*happy purr* found its hiding spot!",
  },
];

const nakedPairSteps: StepTemplate[] = [
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

const hiddenPairSteps: StepTemplate[] = [
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

const pointingPairSteps: StepTemplate[] = [
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

const boxLineReductionSteps: StepTemplate[] = [
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

const nakedTripleSteps: StepTemplate[] = [
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

const xWingSteps: StepTemplate[] = [
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

const swordfishSteps: StepTemplate[] = [
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

const xyWingSteps: StepTemplate[] = [
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

// ============================================
// Step Template Registry
// ============================================

/** Map from technique name to step templates */
export const TECHNIQUE_STEP_TEMPLATES: Record<string, StepTemplate[]> = {
  'Naked Single': nakedSingleSteps,
  'Hidden Single': hiddenSingleSteps,
  'Naked Pair': nakedPairSteps,
  'Hidden Pair': hiddenPairSteps,
  'Pointing Pair': pointingPairSteps,
  'Box/Line Reduction': boxLineReductionSteps,
  'Naked Triple': nakedTripleSteps,
  'X-Wing': xWingSteps,
  'Swordfish': swordfishSteps,
  'XY-Wing': xyWingSteps,
};

// ============================================
// Step Rendering
// ============================================

/**
 * Render all steps for a technique given a solver result.
 * Falls back to a generic explanation if no template exists.
 */
export function renderSteps(result: TechniqueResult): RenderedStep[] {
  const templates = TECHNIQUE_STEP_TEMPLATES[result.techniqueName];

  if (!templates || templates.length === 0) {
    // Fallback: single step with the solver's explanation
    return [
      {
        text: result.explanation,
        highlightCells: result.highlightCells,
        mascotHint: 'hmm, let me think about this one~',
      },
    ];
  }

  return templates.map((template) => {
    try {
      return {
        text: template.getText(result),
        highlightCells: template.getHighlightCells(result),
        mascotHint: template.getMascotHint?.(result),
      };
    } catch {
      // Fallback if template fails (e.g., missing data in result)
      return {
        text: result.explanation,
        highlightCells: result.highlightCells,
        mascotHint: 'hmm, let me think about this one~',
      };
    }
  });
}

/**
 * Get the number of steps for a technique.
 */
export function getStepCount(techniqueName: string): number {
  return TECHNIQUE_STEP_TEMPLATES[techniqueName]?.length ?? 1;
}
