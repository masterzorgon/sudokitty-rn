import { Position } from '../../engine/types';
import { TechniqueResult } from '../../engine/solver/types';

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
