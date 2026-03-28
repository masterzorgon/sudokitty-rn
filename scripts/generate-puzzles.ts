#!/usr/bin/env npx ts-node --project scripts/tsconfig.scripts.json
/**
 * Bulk Puzzle Generation Script
 *
 * Generates technique-specific puzzles using the existing engine and inserts
 * them into the Supabase `technique_puzzle_pool` table.
 *
 * Usage:
 *   npx ts-node --project scripts/tsconfig.scripts.json scripts/generate-puzzles.ts
 *
 * Environment variables (required):
 *   SUPABASE_URL       - Supabase project URL
 *   SUPABASE_ANON_KEY  - Supabase anon/service key
 *
 * Options (via env vars):
 *   TARGET_PER_TECHNIQUE  - Puzzles per technique (default: 50)
 *   CONCURRENCY           - Parallel technique workers (default: 4)
 *   TECHNIQUE_FILTER      - Comma-separated technique IDs to generate (default: all)
 */

import { createClient } from "@supabase/supabase-js";
import {
  generatePuzzleForTechnique,
  GenerationConfig,
  TECHNIQUE_IDS,
  TechniqueInfo,
} from "../src/engine/techniqueGenerator";
import { generatePuzzle, countClues } from "../src/engine/generator";
import { SudokuSolver, TechniqueLevel } from "../src/engine/solver";
import { Difficulty, DIFFICULTY_CONFIG } from "../src/engine/types";
import { gridToCompact } from "../src/lib/supabaseTypes";

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required.");
  console.error(
    "Usage: SUPABASE_URL=... SUPABASE_ANON_KEY=... npx ts-node scripts/generate-puzzles.ts",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TARGET_PER_TECHNIQUE = parseInt(process.env.TARGET_PER_TECHNIQUE ?? "50", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "4", 10);
const TECHNIQUE_FILTER = process.env.TECHNIQUE_FILTER
  ? process.env.TECHNIQUE_FILTER.split(",").map((s) => s.trim())
  : null;

// Higher budgets since this runs offline on a developer machine
const SCRIPT_CONFIG: GenerationConfig = {
  maxRetries: 500,
  timeoutMs: 30_000, // 30 seconds per attempt
};

// ============================================
// Semaphore for concurrency control
// ============================================

class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}

// ============================================
// Core Generation Logic
// ============================================

interface GenerationStats {
  techniqueId: string;
  techniqueName: string;
  level: number;
  existingCount: number;
  generated: number;
  failed: number;
  elapsedMs: number;
}

async function getExistingCount(techniqueId: string): Promise<number> {
  const { count, error } = await supabase
    .from("technique_puzzle_pool")
    .select("id", { count: "exact", head: true })
    .eq("technique_id", techniqueId);

  if (error) {
    console.error(`  [${techniqueId}] Error querying existing count: ${error.message}`);
    return 0;
  }

  return count ?? 0;
}

async function generateForTechnique(
  techniqueId: string,
  info: TechniqueInfo,
): Promise<GenerationStats> {
  const startTime = Date.now();
  const stats: GenerationStats = {
    techniqueId,
    techniqueName: info.name,
    level: info.level,
    existingCount: 0,
    generated: 0,
    failed: 0,
    elapsedMs: 0,
  };

  // Check how many already exist (resume support)
  stats.existingCount = await getExistingCount(techniqueId);
  const needed = TARGET_PER_TECHNIQUE - stats.existingCount;

  if (needed <= 0) {
    console.log(
      `  [${techniqueId}] Already at target (${stats.existingCount}/${TARGET_PER_TECHNIQUE}), skipping`,
    );
    stats.elapsedMs = Date.now() - startTime;
    return stats;
  }

  console.log(`  [${techniqueId}] Need ${needed} more (${stats.existingCount} existing)`);

  // Batch insert buffer
  const batchSize = 10;
  const batch: {
    technique_id: string;
    technique_name: string;
    difficulty_level: number;
    puzzle: string;
    solution: string;
    technique_result: object;
  }[] = [];

  for (let i = 0; i < needed; i++) {
    const result = generatePuzzleForTechnique(techniqueId, SCRIPT_CONFIG);

    if (result.success && result.puzzle && result.solution && result.techniqueResult) {
      batch.push({
        technique_id: techniqueId,
        technique_name: info.name,
        difficulty_level: info.level,
        puzzle: gridToCompact(result.puzzle),
        solution: gridToCompact(result.solution),
        technique_result: result.techniqueResult,
      });
      stats.generated++;

      // Flush batch
      if (batch.length >= batchSize) {
        const { error } = await supabase.from("technique_puzzle_pool").insert(batch);
        if (error) {
          console.error(`  [${techniqueId}] Insert error: ${error.message}`);
        }
        batch.length = 0;
      }

      // Progress log every 5 puzzles
      if (stats.generated % 5 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `  [${techniqueId}] ${stats.generated}/${needed} generated (${elapsed}s elapsed, ${stats.failed} failures)`,
        );
      }
    } else {
      stats.failed++;

      // If we're failing too much, log a warning
      if (stats.failed > 0 && stats.failed % 10 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.warn(
          `  [${techniqueId}] WARNING: ${stats.failed} failures so far (${elapsed}s elapsed)`,
        );
      }

      // Safety: if we've failed more than 3x the target, bail
      if (stats.failed > needed * 3) {
        console.warn(
          `  [${techniqueId}] Too many failures, stopping (${stats.generated} generated, ${stats.failed} failed)`,
        );
        break;
      }
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    const { error } = await supabase.from("technique_puzzle_pool").insert(batch);
    if (error) {
      console.error(`  [${techniqueId}] Final insert error: ${error.message}`);
    }
  }

  stats.elapsedMs = Date.now() - startTime;
  return stats;
}

// ============================================
// Game Puzzle Generation
// ============================================

const GAME_TARGET = parseInt(process.env.GAME_TARGET_PER_DIFFICULTY ?? "50", 10);
const SKIP_GAME = process.env.SKIP_GAME === "true";
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

interface GameGenerationStats {
  difficulty: string;
  existingCount: number;
  generated: number;
  failed: number;
  elapsedMs: number;
}

async function getExistingGameCount(difficulty: string): Promise<number> {
  const { count, error } = await supabase
    .from("game_puzzle_pool")
    .select("id", { count: "exact", head: true })
    .eq("difficulty", difficulty);

  if (error) {
    console.error(`  [game:${difficulty}] Error querying existing count: ${error.message}`);
    return 0;
  }

  return count ?? 0;
}

async function generateGamePuzzlesForDifficulty(
  difficulty: Difficulty,
): Promise<GameGenerationStats> {
  const startTime = Date.now();
  const config = DIFFICULTY_CONFIG[difficulty];
  const stats: GameGenerationStats = {
    difficulty,
    existingCount: 0,
    generated: 0,
    failed: 0,
    elapsedMs: 0,
  };

  stats.existingCount = await getExistingGameCount(difficulty);
  const needed = GAME_TARGET - stats.existingCount;

  if (needed <= 0) {
    console.log(
      `  [game:${difficulty}] Already at target (${stats.existingCount}/${GAME_TARGET}), skipping`,
    );
    stats.elapsedMs = Date.now() - startTime;
    return stats;
  }

  console.log(`  [game:${difficulty}] Need ${needed} more (${stats.existingCount} existing)`);

  const batchSize = 10;
  const batch: {
    difficulty: string;
    clue_count: number;
    max_technique_level: number;
    puzzle: string;
    solution: string;
  }[] = [];

  for (let i = 0; i < needed; i++) {
    // Generate with full validation (minTechniqueLevel enforced by generatePuzzle)
    const result = generatePuzzle(difficulty);
    const clues = countClues(result.puzzle);

    // Verify technique level for the stats
    const solver = new SudokuSolver({
      maxTechniqueLevel: config.maxTechniqueLevel as TechniqueLevel,
      trackSteps: false,
    });
    const solveResult = solver.solve(result.puzzle);

    if (solveResult.solved) {
      batch.push({
        difficulty,
        clue_count: clues,
        max_technique_level: solveResult.maxLevelRequired as number,
        puzzle: gridToCompact(result.puzzle),
        solution: gridToCompact(result.solution),
      });
      stats.generated++;

      if (batch.length >= batchSize) {
        const { error } = await supabase.from("game_puzzle_pool").insert(batch);
        if (error) {
          console.error(`  [game:${difficulty}] Insert error: ${error.message}`);
        }
        batch.length = 0;
      }

      if (stats.generated % 5 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(
          `  [game:${difficulty}] ${stats.generated}/${needed} generated (${elapsed}s elapsed)`,
        );
      }
    } else {
      stats.failed++;
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    const { error } = await supabase.from("game_puzzle_pool").insert(batch);
    if (error) {
      console.error(`  [game:${difficulty}] Final insert error: ${error.message}`);
    }
  }

  stats.elapsedMs = Date.now() - startTime;
  return stats;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("=== Sudokitty Puzzle Generator ===");
  console.log(`Target: ${TARGET_PER_TECHNIQUE} puzzles per technique`);
  console.log(`Concurrency: ${CONCURRENCY} parallel workers`);
  console.log(
    `Retry budget: ${SCRIPT_CONFIG.maxRetries} retries, ${SCRIPT_CONFIG.timeoutMs / 1000}s timeout`,
  );
  console.log("");

  // Determine which techniques to generate
  let techniqueEntries = Object.entries(TECHNIQUE_IDS);
  if (TECHNIQUE_FILTER) {
    techniqueEntries = techniqueEntries.filter(([id]) => TECHNIQUE_FILTER!.includes(id));
    console.log(
      `Filtering to ${techniqueEntries.length} techniques: ${TECHNIQUE_FILTER.join(", ")}`,
    );
  } else {
    console.log(`Generating for all ${techniqueEntries.length} techniques`);
  }
  console.log("");

  const semaphore = new Semaphore(CONCURRENCY);
  const allStats: GenerationStats[] = [];
  const overallStart = Date.now();

  // Launch all techniques with concurrency limit
  const promises = techniqueEntries.map(async ([id, info]) => {
    await semaphore.acquire();
    try {
      console.log(`Starting: ${info.name} (level ${info.level})`);
      const stats = await generateForTechnique(id, info);
      allStats.push(stats);
      const elapsed = (stats.elapsedMs / 1000).toFixed(1);
      console.log(
        `Done: ${info.name} — ${stats.generated} generated, ${stats.failed} failed (${elapsed}s)`,
      );
    } finally {
      semaphore.release();
    }
  });

  await Promise.all(promises);

  // Summary
  const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
  const totalGenerated = allStats.reduce((sum, s) => sum + s.generated, 0);
  const totalFailed = allStats.reduce((sum, s) => sum + s.failed, 0);

  console.log("");
  console.log("=== Summary ===");
  console.log(`Total generated: ${totalGenerated}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log(`Total time: ${totalElapsed}s`);
  console.log("");

  // Per-technique breakdown
  console.log("Per-technique breakdown:");
  for (const stats of allStats.sort(
    (a, b) => a.level - b.level || a.techniqueId.localeCompare(b.techniqueId),
  )) {
    const elapsed = (stats.elapsedMs / 1000).toFixed(1);
    const total = stats.existingCount + stats.generated;
    console.log(
      `  L${stats.level} ${stats.techniqueName.padEnd(30)} ${total}/${TARGET_PER_TECHNIQUE} (${stats.generated} new, ${stats.failed} failed, ${elapsed}s)`,
    );
  }

  // ============================================
  // Phase 2: Game puzzles
  // ============================================

  if (!SKIP_GAME) {
    console.log("");
    console.log("=== Game Puzzle Generation ===");
    console.log(`Target: ${GAME_TARGET} puzzles per difficulty`);
    console.log("");

    const gameStats: GameGenerationStats[] = [];
    const gameStart = Date.now();

    // Generate sequentially (each difficulty is already fast for easy/medium)
    for (const diff of DIFFICULTIES) {
      console.log(`Starting: ${diff}`);
      const stats = await generateGamePuzzlesForDifficulty(diff);
      gameStats.push(stats);
      const elapsed = (stats.elapsedMs / 1000).toFixed(1);
      console.log(
        `Done: ${diff} — ${stats.generated} generated, ${stats.failed} failed (${elapsed}s)`,
      );
    }

    const gameElapsed = ((Date.now() - gameStart) / 1000).toFixed(1);
    const gameTotalGenerated = gameStats.reduce((s, g) => s + g.generated, 0);

    console.log("");
    console.log("=== Game Puzzle Summary ===");
    console.log(`Total generated: ${gameTotalGenerated}`);
    console.log(`Total time: ${gameElapsed}s`);
    console.log("");

    for (const stats of gameStats) {
      const elapsed = (stats.elapsedMs / 1000).toFixed(1);
      const total = stats.existingCount + stats.generated;
      console.log(
        `  ${stats.difficulty.padEnd(10)} ${total}/${GAME_TARGET} (${stats.generated} new, ${stats.failed} failed, ${elapsed}s)`,
      );
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
