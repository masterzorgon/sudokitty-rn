import { Position } from '../../engine/types';

export function formatPos(pos: Position): string {
  return `R${pos.row + 1}C${pos.col + 1}`;
}

export function formatPositions(positions: Position[]): string {
  return positions.map(formatPos).join(', ');
}

/** Extract unit name from explanation (e.g., "in row 3", "in box 5") */
export function extractUnit(explanation: string): string | null {
  const match = explanation.match(/in (row|column|box) (\d+)/);
  if (match) return `${match[1]} ${match[2]}`;
  return null;
}

/** Extract candidate numbers from explanation */
export function extractCandidates(explanation: string): number[] {
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
export function extractNumber(explanation: string): number | null {
  // Match "5 can only go" or "5 in box"
  const match = explanation.match(/^(\d)/);
  if (match) return parseInt(match[1], 10);
  return null;
}
