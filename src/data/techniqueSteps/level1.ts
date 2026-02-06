import { StepTemplate } from './types';
import { formatPos, extractUnit } from './helpers';

export const nakedSingleSteps: StepTemplate[] = [
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

export const hiddenSingleSteps: StepTemplate[] = [
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
