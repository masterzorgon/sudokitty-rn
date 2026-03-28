// Alternating Inference Chains (AIC) - Level 4 Technique
// A chain-based technique that alternates between strong and weak links.
//
// Strong link: Only 2 candidates in a cell (bivalue), or only 2 positions
// for a candidate in a unit (bilocal). If one is false, the other is true.
//
// Weak link: Same candidate in same unit, or different candidates in same cell.
// If one is true, the other is false.
//
// AIC Type 1: Chain starts and ends with strong links on the same candidate
// in different cells. That candidate can be eliminated from cells that see
// both endpoints.

import { Position, BOARD_SIZE } from "../../../types";
import { CandidateGridInterface, TechniqueResult, TechniqueLevel, Unit } from "../../types";
import { BaseTechnique } from "../Technique";

// A node in the link graph: a specific candidate in a specific cell
interface LinkNode {
  row: number;
  col: number;
  candidate: number;
  id: string; // "row-col-candidate"
}

interface Link {
  from: LinkNode;
  to: LinkNode;
  type: "strong" | "weak";
}

export class AIC extends BaseTechnique {
  readonly name = "Alternating Inference Chains";
  readonly level: TechniqueLevel = 4;
  readonly description = "Chains of strong and weak links between candidates";

  apply(grid: CandidateGridInterface): TechniqueResult | null {
    // Step 1: Build link graph
    const { nodes, strongLinks, weakLinks } = this.buildGraph(grid);

    // Step 2: Build adjacency lists
    const strongAdj = new Map<string, LinkNode[]>();
    const weakAdj = new Map<string, LinkNode[]>();

    for (const node of nodes) {
      strongAdj.set(node.id, []);
      weakAdj.set(node.id, []);
    }

    for (const link of strongLinks) {
      strongAdj.get(link.from.id)!.push(link.to);
      strongAdj.get(link.to.id)!.push(link.from);
    }

    for (const link of weakLinks) {
      weakAdj.get(link.from.id)!.push(link.to);
      weakAdj.get(link.to.id)!.push(link.from);
    }

    // Step 3: Search for AIC Type 1
    // BFS from each node, alternating strong/weak links
    // Looking for chains: strong-weak-strong-...-weak-strong
    // where start and end have the same candidate in different cells
    for (const startNode of nodes) {
      const result = this.searchChain(grid, startNode, strongAdj, weakAdj, nodes);
      if (result) return result;
    }

    return null;
  }

  private buildGraph(grid: CandidateGridInterface): {
    nodes: LinkNode[];
    strongLinks: Link[];
    weakLinks: Link[];
  } {
    const nodes: LinkNode[] = [];
    const nodeMap = new Map<string, LinkNode>();

    // Create nodes
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        for (const cand of grid.getCandidates(row, col)) {
          const node: LinkNode = {
            row,
            col,
            candidate: cand,
            id: `${row}-${col}-${cand}`,
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
        }
      }
    }

    const strongLinks: Link[] = [];
    const weakLinks: Link[] = [];

    // Bivalue strong links: 2 candidates in same cell
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const cands = [...grid.getCandidates(row, col)];
        if (cands.length === 2) {
          const n1 = nodeMap.get(`${row}-${col}-${cands[0]}`);
          const n2 = nodeMap.get(`${row}-${col}-${cands[1]}`);
          if (n1 && n2) {
            strongLinks.push({ from: n1, to: n2, type: "strong" });
          }
        }
      }
    }

    // Bilocal strong links: candidate appears in exactly 2 cells in a unit
    const units: Unit[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      units.push({ type: "row", index: i });
      units.push({ type: "column", index: i });
      units.push({ type: "box", index: i });
    }

    for (const unit of units) {
      for (let cand = 1; cand <= 9; cand++) {
        const cells = grid.findCellsWithCandidate(unit, cand);
        if (cells.length === 2) {
          const n1 = nodeMap.get(`${cells[0].row}-${cells[0].col}-${cand}`);
          const n2 = nodeMap.get(`${cells[1].row}-${cells[1].col}-${cand}`);
          if (n1 && n2) {
            strongLinks.push({ from: n1, to: n2, type: "strong" });
          }
        }
      }
    }

    // Weak links: same candidate in same unit (not already strong-linked)
    const strongSet = new Set<string>();
    for (const link of strongLinks) {
      strongSet.add(`${link.from.id}|${link.to.id}`);
      strongSet.add(`${link.to.id}|${link.from.id}`);
    }

    for (const unit of units) {
      for (let cand = 1; cand <= 9; cand++) {
        const cells = grid.findCellsWithCandidate(unit, cand);
        if (cells.length > 2) {
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
              const n1 = nodeMap.get(`${cells[i].row}-${cells[i].col}-${cand}`);
              const n2 = nodeMap.get(`${cells[j].row}-${cells[j].col}-${cand}`);
              if (n1 && n2 && !strongSet.has(`${n1.id}|${n2.id}`)) {
                weakLinks.push({ from: n1, to: n2, type: "weak" });
              }
            }
          }
        }
      }
    }

    // Weak links: different candidates in same cell (not already strong-linked)
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!grid.isEmpty(row, col)) continue;
        const cands = [...grid.getCandidates(row, col)];
        if (cands.length > 2) {
          for (let i = 0; i < cands.length; i++) {
            for (let j = i + 1; j < cands.length; j++) {
              const n1 = nodeMap.get(`${row}-${col}-${cands[i]}`);
              const n2 = nodeMap.get(`${row}-${col}-${cands[j]}`);
              if (n1 && n2) {
                weakLinks.push({ from: n1, to: n2, type: "weak" });
              }
            }
          }
        }
      }
    }

    return { nodes, strongLinks, weakLinks };
  }

  private searchChain(
    grid: CandidateGridInterface,
    startNode: LinkNode,
    strongAdj: Map<string, LinkNode[]>,
    weakAdj: Map<string, LinkNode[]>,
    allNodes: LinkNode[],
  ): TechniqueResult | null {
    // BFS with alternating link types
    // State: (current node, next expected link type, path)
    // Start with strong link from startNode

    interface BFSState {
      node: LinkNode;
      nextLink: "strong" | "weak";
      path: LinkNode[];
    }

    const queue: BFSState[] = [];
    const visited = new Set<string>();

    // Start: follow strong links from start
    for (const next of strongAdj.get(startNode.id) ?? []) {
      queue.push({
        node: next,
        nextLink: "weak", // after strong, need weak
        path: [startNode, next],
      });
    }

    const maxDepth = 12; // Limit chain length

    while (queue.length > 0) {
      const state = queue.shift()!;
      const { node, nextLink, path } = state;

      if (path.length > maxDepth) continue;

      const stateKey = `${node.id}:${nextLink}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      if (nextLink === "strong") {
        // Follow strong links
        for (const next of strongAdj.get(node.id) ?? []) {
          if (path.some((p) => p.id === next.id)) continue;

          // Check for AIC Type 1: same candidate, different cell, connected by strong link
          if (
            next.candidate === startNode.candidate &&
            (next.row !== startNode.row || next.col !== startNode.col) &&
            path.length >= 3 // Need at least 4 nodes (start -> ... -> end)
          ) {
            const newPath = [...path, next];
            const result = this.makeElimination(grid, startNode, next, newPath);
            if (result) return result;
          }

          queue.push({
            node: next,
            nextLink: "weak",
            path: [...path, next],
          });
        }
      } else {
        // Follow weak links
        for (const next of weakAdj.get(node.id) ?? []) {
          if (path.some((p) => p.id === next.id)) continue;

          queue.push({
            node: next,
            nextLink: "strong",
            path: [...path, next],
          });
        }

        // Also follow strong links as weak (strong implies weak)
        for (const next of strongAdj.get(node.id) ?? []) {
          if (path.some((p) => p.id === next.id)) continue;

          queue.push({
            node: next,
            nextLink: "strong",
            path: [...path, next],
          });
        }
      }
    }

    return null;
  }

  private makeElimination(
    grid: CandidateGridInterface,
    startNode: LinkNode,
    endNode: LinkNode,
    path: LinkNode[],
  ): TechniqueResult | null {
    const candidate = startNode.candidate;
    const eliminations: { position: Position; candidates: number[] }[] = [];

    // Eliminate candidate from cells that see both endpoints
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (row === startNode.row && col === startNode.col) continue;
        if (row === endNode.row && col === endNode.col) continue;
        if (!grid.isEmpty(row, col) || !grid.hasCandidate(row, col, candidate)) continue;

        if (
          this.isPeer({ row, col }, { row: startNode.row, col: startNode.col }) &&
          this.isPeer({ row, col }, { row: endNode.row, col: endNode.col })
        ) {
          eliminations.push({
            position: { row, col },
            candidates: [candidate],
          });
        }
      }
    }

    if (eliminations.length === 0) return null;

    // Build explanation from path
    const chainStr = path
      .map((n) => `${this.formatPosition({ row: n.row, col: n.col })}(${n.candidate})`)
      .join("-");

    const highlightCells = [
      ...new Map(path.map((n) => [`${n.row}-${n.col}`, { row: n.row, col: n.col }])).values(),
    ];

    return this.createEliminationResult(
      eliminations,
      `AIC: ${chainStr} => eliminate ${candidate}`,
      highlightCells,
    );
  }

  private isPeer(a: Position, b: Position): boolean {
    if (a.row === b.row) return true;
    if (a.col === b.col) return true;
    const boxA = Math.floor(a.row / 3) * 3 + Math.floor(a.col / 3);
    const boxB = Math.floor(b.row / 3) * 3 + Math.floor(b.col / 3);
    return boxA === boxB;
  }
}
