// Technique metadata for display and categorization
// Maps from engine technique names to user-facing display data

import { TechniqueLevel } from '../engine/solver/types';

// ============================================
// Types
// ============================================

export type TechniqueCategory = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type TechniqueType =
  | 'Singles'
  | 'Intersections'
  | 'Hidden Subsets'
  | 'Naked Subsets'
  | 'Basic Fish'
  | 'Finned/Sashimi Fish'
  | 'Complex Fish'
  | 'Single Digit Patterns'
  | 'Uniqueness'
  | 'Wings'
  | 'Miscellaneous'
  | 'Coloring'
  | 'Chains/Loops'
  | 'ALS'
  | 'Last Resort';

export interface TechniqueMetadata {
  id: string;
  name: string;
  level: TechniqueLevel;
  category: TechniqueCategory;
  techniqueType: TechniqueType;
  shortDescription: string;
  longDescription: string;
  icon: string; // Feather icon name
  color: string; // Category accent color
  /** Whether the technique produces a placement (vs elimination) */
  isPlacement: boolean;
  /** Whether this technique has a working solver implementation for interactive practice */
  hasSolver: boolean;
}

// ============================================
// Category Mappings
// ============================================

export const LEVEL_TO_CATEGORY: Record<TechniqueLevel, TechniqueCategory> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
};

export const CATEGORY_COLORS: Record<TechniqueCategory, string> = {
  Beginner: '#4CAF50',     // Green
  Intermediate: '#FF9800', // Orange
  Advanced: '#F44336',     // Red
  Expert: '#9C27B0',       // Purple
};

export const CATEGORY_ICONS: Record<TechniqueCategory, string> = {
  Beginner: 'star',
  Intermediate: 'zap',
  Advanced: 'target',
  Expert: 'award',
};

// ============================================
// Technique Type Mappings
// ============================================

/** Display order matching HoDoKu reference (top-to-bottom) */
export const TECHNIQUE_TYPE_ORDER: TechniqueType[] = [
  'Singles',
  'Intersections',
  'Hidden Subsets',
  'Naked Subsets',
  'Basic Fish',
  'Finned/Sashimi Fish',
  'Complex Fish',
  'Single Digit Patterns',
  'Uniqueness',
  'Wings',
  'Miscellaneous',
  'Coloring',
  'Chains/Loops',
  'ALS',
  'Last Resort',
];

export const TECHNIQUE_TYPE_COLORS: Record<TechniqueType, string> = {
  'Singles':              '#4CAF50', // Green
  'Intersections':        '#66BB6A', // Light Green
  'Hidden Subsets':       '#FF9800', // Orange
  'Naked Subsets':        '#FFA726', // Light Orange
  'Basic Fish':           '#2196F3', // Blue
  'Finned/Sashimi Fish': '#1E88E5', // Dark Blue
  'Complex Fish':         '#1565C0', // Deeper Blue
  'Single Digit Patterns':'#AB47BC', // Purple
  'Uniqueness':           '#F44336', // Red
  'Wings':                '#EC407A', // Pink
  'Miscellaneous':        '#78909C', // Blue Grey
  'Coloring':             '#26A69A', // Teal
  'Chains/Loops':         '#7E57C2', // Deep Purple
  'ALS':                  '#5C6BC0', // Indigo
  'Last Resort':          '#8D6E63', // Brown
};

// ============================================
// All Technique Metadata
// ============================================

export const TECHNIQUE_METADATA: TechniqueMetadata[] = [
  // Level 1 - Beginner
  {
    id: 'naked-single',
    name: 'Naked Single',
    level: 1,
    category: 'Beginner',
    techniqueType: 'Singles',
    shortDescription: 'A cell with only one possible value',
    longDescription:
      'When all other candidates have been eliminated from a cell, only one value remains. ' +
      'This is the most fundamental Sudoku technique. Look for cells where row, column, and box ' +
      'constraints leave only a single possibility.',
    icon: 'star',
    color: CATEGORY_COLORS.Beginner,
    isPlacement: true,
    hasSolver: true,
  },
  {
    id: 'hidden-single',
    name: 'Hidden Single',
    level: 1,
    category: 'Beginner',
    techniqueType: 'Singles',
    shortDescription: 'A value that can only go in one cell of a unit',
    longDescription:
      'When a number can only fit in one cell within a row, column, or box, that cell must contain ' +
      'that number — even if the cell has other candidates. The number is "hidden" among other ' +
      'possibilities, but it has no other home in that unit.',
    icon: 'star',
    color: CATEGORY_COLORS.Beginner,
    isPlacement: true,
    hasSolver: true,
  },

  // Level 2 - Intermediate
  {
    id: 'naked-pair',
    name: 'Naked Pair',
    level: 2,
    category: 'Intermediate',
    techniqueType: 'Naked Subsets',
    shortDescription: 'Two cells sharing exactly two candidates',
    longDescription:
      'When two cells in a unit (row, column, or box) contain exactly the same two candidates, ' +
      'those two numbers are locked into those two cells. This means you can safely eliminate ' +
      'those candidates from all other cells in the same unit.',
    icon: 'zap',
    color: CATEGORY_COLORS.Intermediate,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'hidden-pair',
    name: 'Hidden Pair',
    level: 2,
    category: 'Intermediate',
    techniqueType: 'Hidden Subsets',
    shortDescription: 'Two values restricted to the same two cells',
    longDescription:
      'When two candidates appear only in the same two cells within a unit, those cells must ' +
      'contain those two values. All other candidates in those two cells can be eliminated. ' +
      'The pair is "hidden" because the cells may have additional candidates that obscure the pattern.',
    icon: 'zap',
    color: CATEGORY_COLORS.Intermediate,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'pointing-pair',
    name: 'Pointing Pair',
    level: 2,
    category: 'Intermediate',
    techniqueType: 'Intersections',
    shortDescription: 'Box candidates aligned in a row or column',
    longDescription:
      'When a candidate within a box is confined to a single row or column, it must be in one of those ' +
      'positions. This means the same candidate can be eliminated from the rest of that row or column ' +
      'outside the box. The cells "point" toward where eliminations can happen.',
    icon: 'zap',
    color: CATEGORY_COLORS.Intermediate,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'box-line-reduction',
    name: 'Box/Line Reduction',
    level: 2,
    category: 'Intermediate',
    techniqueType: 'Intersections',
    shortDescription: 'Row/column candidates confined to one box',
    longDescription:
      'The inverse of a Pointing Pair. When a candidate in a row or column is confined to a single box, ' +
      'it can be eliminated from other cells in that box. The row/column tells the box where the ' +
      'number must go, removing it from unrelated cells.',
    icon: 'zap',
    color: CATEGORY_COLORS.Intermediate,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 3 - Advanced
  {
    id: 'naked-triple',
    name: 'Naked Triple',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Naked Subsets',
    shortDescription: 'Three cells sharing at most three candidates',
    longDescription:
      'An extension of the Naked Pair. When three cells in a unit collectively contain at most three ' +
      'distinct candidates, those three values are locked into those cells. Each cell doesn\'t need ' +
      'all three candidates — the union of candidates across the three cells must equal exactly three.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'hidden-triple',
    name: 'Hidden Triple',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Hidden Subsets',
    shortDescription: 'Three values restricted to the same three cells',
    longDescription:
      'When three candidates appear only in the same three cells within a unit, those cells must ' +
      'contain those three values. All other candidates in those three cells can be eliminated. ' +
      'Like Hidden Pair but with three numbers — harder to spot because extra candidates obscure the pattern.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'x-wing',
    name: 'X-Wing',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Basic Fish',
    shortDescription: 'A candidate forming a rectangle across two rows',
    longDescription:
      'When a candidate appears in exactly two cells in each of two rows, and those cells share the ' +
      'same two columns, the candidate forms an X-shaped pattern. It must be in one diagonal pair or ' +
      'the other, so it can be eliminated from all other cells in those two columns.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'finned-fish',
    name: 'Finned Fish',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Finned/Sashimi Fish',
    shortDescription: 'X-Wing with an extra candidate "fin" cell',
    longDescription:
      'A variation of X-Wing where one corner has extra candidate cells (the "fin"). Eliminations ' +
      'are restricted to cells that see both the fin and the regular X-Wing pattern. Covers Finned ' +
      'X-Wing, Sashimi Finned Fish, and Finned Grouped X-Cycles.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 3 - Single Digit Patterns
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Single Digit Patterns',
    shortDescription: 'Two conjugate pairs sharing one end, forming a tower',
    longDescription:
      'Find two rows (or columns) that each contain a candidate in exactly two cells. ' +
      'If two of those cells share the same column (or row), they form the "base" of the skyscraper. ' +
      'The other two cells are the "endpoints." Since one endpoint must be true, any cell that ' +
      'sees both endpoints can have the candidate eliminated.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'two-string-kite',
    name: '2-String Kite',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Single Digit Patterns',
    shortDescription: 'Row and column pairs linked through a shared box',
    longDescription:
      'Find a row and a column that each contain a candidate in exactly two cells (the "strings"). ' +
      'One cell from the row and one from the column must share the same box. The remaining two cells ' +
      'are the "kite endpoints." Since one endpoint must be true, any cell that sees both can ' +
      'have the candidate eliminated.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'turbot-fish',
    name: 'Turbot Fish',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Single Digit Patterns',
    shortDescription: 'A chain of two conjugate pairs connected by a weak link',
    longDescription:
      'A general single-digit pattern: two conjugate pairs (strong links) for the same candidate ' +
      'connected by a weak link. The chain has four cells, and the two endpoints must include the true ' +
      'value. Any cell that sees both endpoints can have the candidate eliminated. Skyscrapers and ' +
      '2-String Kites are special cases of this pattern.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'empty-rectangle',
    name: 'Empty Rectangle',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Single Digit Patterns',
    shortDescription: 'A box pattern combined with a conjugate pair',
    longDescription:
      'When a candidate in a box is restricted to one row and one column (forming an L-shape), ' +
      'it creates an "Empty Rectangle." Combined with a conjugate pair in a crossing row or column, ' +
      'the candidate can be eliminated at the intersection point. The ER acts as a pivot that ' +
      'connects the strong link to the elimination target.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 3 - Miscellaneous
  {
    id: 'sue-de-coq',
    name: 'Sue de Coq',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Miscellaneous',
    shortDescription: 'Overlapping locked sets at a box/line intersection',
    longDescription:
      'Also known as Two-Sector Disjoint Subsets. At the intersection of a box and a row (or column), ' +
      'when the cells have more candidates than cells, companion cells in the row and box can lock ' +
      'subsets of those candidates. This creates two overlapping locked sets, allowing eliminations ' +
      'from both the rest of the row and the rest of the box. Can produce many eliminations at once.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 3 - Coloring
  {
    id: 'simple-colors',
    name: 'Simple Colors',
    level: 3,
    category: 'Advanced',
    techniqueType: 'Coloring',
    shortDescription: 'Two-color conjugate pair chains reveal contradictions',
    longDescription:
      'Color cells along conjugate pair chains with two alternating colors. If two same-colored cells ' +
      'see each other (Color Wrap), all cells with that color are false. If an uncolored cell sees ' +
      'both colors (Color Trap), it cannot contain the candidate. A visual, intuitive approach ' +
      'to chain-based deductions.',
    icon: 'target',
    color: CATEGORY_COLORS.Advanced,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 4 - Expert
  {
    id: 'swordfish',
    name: 'Swordfish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Basic Fish',
    shortDescription: 'X-Wing extended to three rows and columns',
    longDescription:
      'A generalization of X-Wing to three dimensions. When a candidate appears in 2-3 cells in each ' +
      'of three rows, and those cells collectively occupy exactly three columns, the candidate can be ' +
      'eliminated from other cells in those three columns. The pattern resembles a three-pronged fork.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'jellyfish',
    name: 'Jellyfish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Basic Fish',
    shortDescription: 'Fish pattern extended to four rows and columns',
    longDescription:
      'The next step beyond Swordfish. When a candidate appears in 2-4 cells in each of four rows, ' +
      'and those cells collectively occupy exactly four columns, the candidate can be eliminated from ' +
      'other cells in those four columns. Rare in practice but powerful when it appears.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'xy-wing',
    name: 'XY-Wing',
    level: 4,
    category: 'Expert',
    techniqueType: 'Wings',
    shortDescription: 'Three bi-value cells forming a chain',
    longDescription:
      'Three cells with two candidates each form a special chain. The pivot cell (with candidates XY) ' +
      'sees two wing cells — one with XZ and one with YZ. No matter which value the pivot takes, Z ' +
      'is forced into one of the wings. So Z can be eliminated from any cell that sees both wings.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'xyz-wing',
    name: 'XYZ-Wing',
    level: 4,
    category: 'Expert',
    techniqueType: 'Wings',
    shortDescription: 'XY-Wing with a three-candidate pivot cell',
    longDescription:
      'Similar to XY-Wing, but the pivot cell has three candidates (XYZ) instead of two. The pivot ' +
      'sees two wing cells — one with XZ and one with YZ. The common candidate Z can be eliminated ' +
      'from any cell that sees the pivot and both wings simultaneously.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'wxyz-wing',
    name: 'WXYZ-Wing',
    level: 4,
    category: 'Expert',
    techniqueType: 'Wings',
    shortDescription: 'Four-cell wing pattern with shared elimination',
    longDescription:
      'An extension of XYZ-Wing to four cells. A pivot and three wings collectively hold four ' +
      'candidates (WXYZ). Through the chain of relationships, one candidate can be eliminated from ' +
      'cells that see all positions where it could appear. Very rare but satisfying to find.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'unique-rectangle',
    name: 'Unique Rectangle',
    level: 4,
    category: 'Expert',
    techniqueType: 'Uniqueness',
    shortDescription: 'Exploits the uniqueness of a valid puzzle',
    longDescription:
      'If four cells forming a rectangle across two boxes share the same two candidates, the puzzle ' +
      'would have multiple solutions — which is invalid. This lets you eliminate candidates to prevent ' +
      'the deadly pattern. Covers Standard, Hidden, SSCP, and Expanded Rectangle variants.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'avoidable-rectangle',
    name: 'Avoidable Rectangle',
    level: 4,
    category: 'Expert',
    techniqueType: 'Uniqueness',
    shortDescription: 'Unique Rectangle using solved cells as anchors',
    longDescription:
      'A variation of Unique Rectangle where some corner cells are already solved. The placed values ' +
      'anchor the pattern, and you eliminate candidates from the unsolved corners to avoid a deadly ' +
      'rectangle. Covers AR with candidate pairs and conjugate pair variants.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'alternating-inference-chains',
    name: 'Alternating Inference Chains',
    level: 4,
    category: 'Expert',
    techniqueType: 'Chains/Loops',
    shortDescription: 'Chains of strong and weak links between candidates',
    longDescription:
      'A powerful chain-based technique that alternates between strong links (exactly two candidates) ' +
      'and weak links (shared unit). If the chain starts and ends on the same candidate, eliminations ' +
      'follow. Covers basic AIC, AIC with Groups, and AIC with Almost Locked Sets.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'almost-locked-sets',
    name: 'Almost Locked Sets',
    level: 4,
    category: 'Expert',
    techniqueType: 'ALS',
    shortDescription: 'N cells with N+1 candidates linked by shared values',
    longDescription:
      'A group of N cells in a unit containing exactly N+1 distinct candidates. When two ALS groups ' +
      'share a restricted common candidate, eliminations become possible in cells that see both sets. ' +
      'Covers ALS-XZ, ALS-XY, and ALS-Chains.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'bug',
    name: 'BUG',
    level: 4,
    category: 'Expert',
    techniqueType: 'Uniqueness',
    shortDescription: 'Bivalue Universal Grave — prevent an invalid state',
    longDescription:
      'BUG (Bivalue Universal Grave) occurs when all unsolved cells have exactly two candidates ' +
      'except one cell with three. To avoid the deadly BUG state (which implies multiple solutions), ' +
      'the odd candidate in that cell must be the solution. A quick, elegant deduction.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 4 - Coloring
  {
    id: 'multi-colors',
    name: 'Multi Colors',
    level: 4,
    category: 'Expert',
    techniqueType: 'Coloring',
    shortDescription: 'Multiple disconnected color pairs interact to eliminate',
    longDescription:
      'Extends Simple Colors by using two or more disconnected conjugate pair chains, each colored ' +
      'independently. When cells from different color pairs share a house, or when same-colored cells ' +
      'see opposite colors of another pair, contradictions arise. Has the same power as X-Chains.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 4 - Complex Fish
  {
    id: 'franken-fish',
    name: 'Franken Fish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Complex Fish',
    shortDescription: 'Fish with boxes in the base or cover sets',
    longDescription:
      'A Franken Fish extends the basic fish pattern by allowing boxes as base or cover sets. ' +
      'When at least one sector is a box, the fish becomes "Franken." This opens up many more ' +
      'patterns including finned variants with endo fins and cannibalistic eliminations. ' +
      'Covers Franken X-Wing, Franken Swordfish, and Franken Jellyfish.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'mutant-fish',
    name: 'Mutant Fish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Complex Fish',
    shortDescription: 'Fish with rows and columns mixed in base or cover sets',
    longDescription:
      'The most general form of fish. Mutant Fish allow all house types (rows, columns, boxes) ' +
      'freely in both base and cover sets, with rows and columns mixed. Smaller Mutant X-Wings ' +
      'are often known as 2-String Kites or Turbot Fish. Larger variants are rare but powerful.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'siamese-fish',
    name: 'Siamese Fish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Complex Fish',
    shortDescription: 'Two finned fish sharing cells with different eliminations',
    longDescription:
      'When two finned fish of the same type share the same base sets and differ in only one ' +
      'cover set, they can be combined into a Siamese Fish. Each fish contributes different ' +
      'eliminations, making the combined move more powerful than either alone. The simplest ' +
      'Siamese Sashimi X-Wing is better known as a Skyscraper.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },

  // Level 4 - Last Resort
  {
    id: 'templates',
    name: 'Templates',
    level: 4,
    category: 'Expert',
    techniqueType: 'Last Resort',
    shortDescription: 'Enumerate all valid digit placements to find eliminations',
    longDescription:
      'For each digit, calculate all valid ways to place 9 instances in the grid. If a cell is not ' +
      'in any remaining template, the candidate can be eliminated. If a cell is in all remaining ' +
      'templates, the candidate must be placed there. A computational approach not meant for ' +
      'human solving, but a powerful indicator of what is possible.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'forcing-chain',
    name: 'Forcing Chain',
    level: 4,
    category: 'Expert',
    techniqueType: 'Last Resort',
    shortDescription: 'Multiple chains from premises converging on one conclusion',
    longDescription:
      'Assume each candidate of a cell is true and trace the implications. If all candidates lead ' +
      'to the same conclusion (verity), that conclusion is forced. If a candidate leads to a ' +
      'contradiction (impossible state), it must be false. Covers both cell-based and house-based ' +
      'forcing chains.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'forcing-net',
    name: 'Forcing Net',
    level: 4,
    category: 'Expert',
    techniqueType: 'Last Resort',
    shortDescription: 'Branching implication networks that force conclusions',
    longDescription:
      'An extension of Forcing Chains that allows branching. When propagation encounters a cell ' +
      'with two candidates, both branches can be explored. If they agree on a conclusion, it is ' +
      'forced. The branching structure makes these extremely powerful but nearly impossible to ' +
      'find manually.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'kraken-fish',
    name: 'Kraken Fish',
    level: 4,
    category: 'Expert',
    techniqueType: 'Last Resort',
    shortDescription: 'Fish patterns enhanced with chains to prove eliminations',
    longDescription:
      'Combines finned fish with chains. When a finned fish has possible eliminations that can\'t ' +
      'see all fins, chains from each fin can prove the elimination is still valid. If all ' +
      'fin-chains converge, the Kraken Fish produces the elimination. A powerful hybrid technique.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
  {
    id: 'brute-force',
    name: 'Brute Force',
    level: 4,
    category: 'Expert',
    techniqueType: 'Last Resort',
    shortDescription: 'Trial and error — the absolute last resort',
    longDescription:
      'Not really a technique: place a digit in a cell and check if the puzzle is solvable via ' +
      'recursive backtracking. If not, try the next candidate. Guarantees any valid sudoku can ' +
      'be solved, but provides no logical insight into the solution.',
    icon: 'award',
    color: CATEGORY_COLORS.Expert,
    isPlacement: false,
    hasSolver: true,
  },
];

// ============================================
// Lookup Helpers
// ============================================

/** Get metadata by technique ID */
export function getTechniqueMetadata(id: string): TechniqueMetadata | undefined {
  return TECHNIQUE_METADATA.find((t) => t.id === id);
}

/** Get metadata by display name (e.g. "Naked Single") */
export function getTechniqueMetadataByName(name: string): TechniqueMetadata | undefined {
  return TECHNIQUE_METADATA.find((t) => t.name === name);
}

/** Get all techniques for a given category */
export function getTechniquesByCategory(category: TechniqueCategory): TechniqueMetadata[] {
  return TECHNIQUE_METADATA.filter((t) => t.category === category);
}

/** Get all techniques grouped by category (in order) */
export function getTechniquesGroupedByCategory(): Array<{
  category: TechniqueCategory;
  color: string;
  icon: string;
  techniques: TechniqueMetadata[];
}> {
  const categories: TechniqueCategory[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  return categories.map((category) => ({
    category,
    color: CATEGORY_COLORS[category],
    icon: CATEGORY_ICONS[category],
    techniques: getTechniquesByCategory(category),
  }));
}

/** Get all techniques grouped by technique type (in HoDoKu reference order) */
export function getTechniquesGroupedByType(): Array<{
  type: TechniqueType;
  color: string;
  techniques: TechniqueMetadata[];
}> {
  return TECHNIQUE_TYPE_ORDER.map((type) => ({
    type,
    color: TECHNIQUE_TYPE_COLORS[type],
    techniques: TECHNIQUE_METADATA
      .filter((t) => t.techniqueType === type)
      .sort((a, b) => a.level - b.level),
  }));
}
