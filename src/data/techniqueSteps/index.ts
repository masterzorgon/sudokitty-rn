// Barrel export for technique step templates
// Re-exports the same public API as the old single-file module

import { TechniqueResult } from '../../engine/solver/types';
import { StepTemplate, RenderedStep } from './types';

// Level 1
import { nakedSingleSteps, hiddenSingleSteps } from './level1';
// Level 2
import { nakedPairSteps, hiddenPairSteps, pointingPairSteps, boxLineReductionSteps } from './level2';
// Level 3
import { nakedTripleSteps, hiddenTripleSteps, xWingSteps, finnedFishSteps } from './level3';
// Level 4
import {
  swordfishSteps, jellyfishSteps, xyWingSteps, xyzWingSteps, wxyzWingSteps,
  uniqueRectangleSteps, avoidableRectangleSteps, bugSteps, almostLockedSetsSteps, aicSteps,
} from './level4';

// Re-export types
export type { StepTemplate, RenderedStep } from './types';

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
  'Hidden Triple': hiddenTripleSteps,
  'X-Wing': xWingSteps,
  'Finned Fish': finnedFishSteps,
  'Swordfish': swordfishSteps,
  'Jellyfish': jellyfishSteps,
  'XY-Wing': xyWingSteps,
  'XYZ-Wing': xyzWingSteps,
  'WXYZ-Wing': wxyzWingSteps,
  'Unique Rectangle': uniqueRectangleSteps,
  'Avoidable Rectangle': avoidableRectangleSteps,
  'BUG': bugSteps,
  'Almost Locked Sets': almostLockedSetsSteps,
  'Alternating Inference Chains': aicSteps,
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
