// Validation contract for technique practice
// Defines precisely what "correct" means for each technique type
//
// Two categories:
//   Placement techniques (Level 1): User taps cell + enters number
//   Elimination techniques (Level 2-4): User identifies pattern cells + elimination targets

import { Position, positionKey } from './types';
import { TechniqueResult, TechniqueLevel } from './solver/types';

// ============================================
// Types
// ============================================

export interface ValidationResult {
  correct: boolean;
  patternCorrect: boolean;
  eliminationCorrect: boolean;
  placementCorrect: boolean;
  feedback: string;
}

/** User's selection for placement techniques (Naked/Hidden Single) */
export interface PlacementSelection {
  type: 'placement';
  cell: Position;
  value: number;
}

/** User's selection for elimination techniques (Pairs, X-Wing, etc.) */
export interface EliminationSelection {
  type: 'elimination';
  patternCells: Position[];
  eliminationCells: Position[];
}

export type UserSelection = PlacementSelection | EliminationSelection;

// ============================================
// Helpers
// ============================================

function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function positionSetsEqual(a: Position[], b: Position[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map(positionKey));
  const setB = new Set(b.map(positionKey));
  for (const key of setA) {
    if (!setB.has(key)) return false;
  }
  return true;
}

function positionSetContainsAny(haystack: Position[], needles: Position[]): boolean {
  const haystackSet = new Set(haystack.map(positionKey));
  return needles.some((n) => haystackSet.has(positionKey(n)));
}

// ============================================
// Technique Categories
// ============================================

/** Techniques where the user places a value */
const PLACEMENT_TECHNIQUES = new Set([
  'Naked Single',
  'Hidden Single',
]);

/** Techniques where the user identifies eliminations */
const ELIMINATION_TECHNIQUES = new Set([
  'Naked Pair',
  'Hidden Pair',
  'Pointing Pair',
  'Box/Line Reduction',
  'Naked Triple',
  'X-Wing',
  'Swordfish',
  'XY-Wing',
]);

export function isPlacementTechnique(techniqueName: string): boolean {
  return PLACEMENT_TECHNIQUES.has(techniqueName);
}

export function isEliminationTechnique(techniqueName: string): boolean {
  return ELIMINATION_TECHNIQUES.has(techniqueName);
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a user's selection against a solver's TechniqueResult.
 *
 * For placement techniques:
 *   - User must tap the correct cell and enter the correct value.
 *
 * For elimination techniques:
 *   - User must identify the pattern cells (order-independent).
 *   - User must identify at least one elimination target (lenient mode).
 *   - For strict mode, user must identify ALL elimination targets.
 */
export function validateSelection(
  selection: UserSelection,
  solverResult: TechniqueResult,
  strict: boolean = false,
): ValidationResult {
  if (selection.type === 'placement') {
    return validatePlacement(selection, solverResult);
  } else {
    return validateElimination(selection, solverResult, strict);
  }
}

/**
 * Validate a placement (Naked Single, Hidden Single).
 *
 * Correct if: User places the correct value in the correct cell.
 */
export function validatePlacement(
  selection: PlacementSelection,
  solverResult: TechniqueResult,
): ValidationResult {
  if (solverResult.placements.length === 0) {
    return {
      correct: false,
      patternCorrect: false,
      eliminationCorrect: false,
      placementCorrect: false,
      feedback: 'This technique produces a placement, but the solver found none.',
    };
  }

  const expected = solverResult.placements[0];
  const cellCorrect = positionsEqual(selection.cell, expected.position);
  const valueCorrect = selection.value === expected.value;
  const correct = cellCorrect && valueCorrect;

  let feedback: string;
  if (correct) {
    feedback = 'Correct! You found the right cell and value.';
  } else if (cellCorrect) {
    feedback = `Right cell, but the value should be ${expected.value}.`;
  } else if (valueCorrect) {
    feedback = `Right value (${expected.value}), but it goes in R${expected.position.row + 1}C${expected.position.col + 1}.`;
  } else {
    feedback = `The ${solverResult.techniqueName} places ${expected.value} in R${expected.position.row + 1}C${expected.position.col + 1}.`;
  }

  return {
    correct,
    patternCorrect: cellCorrect,
    eliminationCorrect: false,
    placementCorrect: correct,
    feedback,
  };
}

/**
 * Validate an elimination (Naked Pair, X-Wing, etc.).
 *
 * Phase 1 - Pattern: User must select the cells forming the pattern.
 *   These must match solverResult.highlightCells (order-independent).
 *
 * Phase 2 - Eliminations: User must select cells where candidates are eliminated.
 *   Lenient mode: At least one elimination target must match.
 *   Strict mode: ALL elimination targets must match.
 */
export function validateElimination(
  selection: EliminationSelection,
  solverResult: TechniqueResult,
  strict: boolean = false,
): ValidationResult {
  // Phase 1: Pattern cells
  const patternCorrect = positionSetsEqual(
    selection.patternCells,
    solverResult.highlightCells,
  );

  // Phase 2: Elimination cells
  const expectedEliminationCells = solverResult.eliminations.map((e) => e.position);
  let eliminationCorrect: boolean;

  if (strict) {
    // Strict: user must select ALL elimination targets
    eliminationCorrect = positionSetsEqual(
      selection.eliminationCells,
      expectedEliminationCells,
    );
  } else {
    // Lenient: user must select at least one valid elimination target
    eliminationCorrect =
      selection.eliminationCells.length > 0 &&
      positionSetContainsAny(expectedEliminationCells, selection.eliminationCells);
  }

  const correct = patternCorrect && eliminationCorrect;

  let feedback: string;
  if (correct) {
    feedback = 'Correct! You identified the pattern and eliminations.';
  } else if (patternCorrect && !eliminationCorrect) {
    feedback = 'You found the pattern cells! Now identify where candidates can be eliminated.';
  } else if (!patternCorrect && eliminationCorrect) {
    feedback = 'Good elimination targets, but the pattern cells are not quite right.';
  } else {
    const patternDesc = solverResult.highlightCells
      .map((p) => `R${p.row + 1}C${p.col + 1}`)
      .join(', ');
    feedback = `Look for the ${solverResult.techniqueName} pattern at: ${patternDesc}.`;
  }

  return {
    correct,
    patternCorrect,
    eliminationCorrect,
    placementCorrect: false,
    feedback,
  };
}

/**
 * Validate against multiple possible technique instances in a puzzle.
 * Accepts ANY valid instance the user identifies.
 *
 * @param selection User's selection
 * @param allResults All valid TechniqueResults for this technique in the puzzle
 * @param strict Whether to require ALL eliminations
 */
export function validateAgainstMultipleInstances(
  selection: UserSelection,
  allResults: TechniqueResult[],
  strict: boolean = false,
): ValidationResult {
  if (allResults.length === 0) {
    return {
      correct: false,
      patternCorrect: false,
      eliminationCorrect: false,
      placementCorrect: false,
      feedback: 'No valid technique instances found in this puzzle.',
    };
  }

  // Try validation against each instance, return first match
  for (const result of allResults) {
    const validation = validateSelection(selection, result, strict);
    if (validation.correct) {
      return validation;
    }
  }

  // No match - return the best feedback from the first instance
  return validateSelection(selection, allResults[0], strict);
}
