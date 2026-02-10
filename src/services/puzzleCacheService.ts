// Puzzle Cache Service
// Manages a local AsyncStorage cache of pre-generated puzzles fetched from Supabase.
// Supabase is ONLY used for background replenishment — never in the user's critical path.
//
// Fallback chain:
//   1. In-memory cache (instant, synchronous)
//   2. Curated puzzle bank + isomorphic transform (instant, always available)
//   3. Supabase — background-only replenishment

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TechniqueResult } from '../engine/solver/types';
import { supabase } from '../lib/supabase';
import { PuzzlePoolRow, compactToGrid } from '../lib/supabaseTypes';
import { STORAGE_KEYS } from '../utils/storage';

// ============================================
// Types
// ============================================

export interface CachedPuzzle {
  id: string; // Supabase row UUID (for dedup)
  techniqueId: string;
  puzzle: number[][];
  solution: number[][];
  techniqueResult: TechniqueResult;
}

interface PuzzleCacheStore {
  schemaVersion: number; // Increment on breaking changes to evict stale caches
  updatedAt: number; // Timestamp of last cache write (for TTL)
  puzzles: Record<string, CachedPuzzle[]>; // techniqueId -> array of cached puzzles
  recentlyServed: string[]; // Ring buffer of recently served puzzle UUIDs
}

// ============================================
// Constants
// ============================================

const CACHE_SCHEMA_VERSION = 1;
const PUZZLES_PER_TECHNIQUE = 3; // Cache depth target per technique
const REFILL_THRESHOLD = 1; // Trigger refill when cache depth drops below this
const MAX_RECENTLY_SERVED = 200; // Ring buffer size for dedup
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days TTL

// ============================================
// Dev Logging
// ============================================

function log(msg: string, ...args: unknown[]) {
  if (__DEV__) console.log(`[PuzzleCache] ${msg}`, ...args);
}

// ============================================
// In-Memory Mirror
// ============================================

let memoryCache: PuzzleCacheStore | null = null;

function createEmptyCache(): PuzzleCacheStore {
  return {
    schemaVersion: CACHE_SCHEMA_VERSION,
    updatedAt: Date.now(),
    puzzles: {},
    recentlyServed: [],
  };
}

// ============================================
// Concurrency Guard
// ============================================

let fetchInFlight: Promise<void> | null = null;

async function fetchAndCache(techniqueIds: string[]): Promise<void> {
  if (fetchInFlight) {
    log('Fetch already in flight, waiting...');
    return fetchInFlight;
  }
  fetchInFlight = doFetch(techniqueIds).finally(() => {
    fetchInFlight = null;
  });
  return fetchInFlight;
}

// ============================================
// Supabase Fetch
// ============================================

async function doFetch(techniqueIds: string[]): Promise<void> {
  if (techniqueIds.length === 0) return;

  const excludeIds = memoryCache?.recentlyServed ?? [];

  log(`Fetching puzzles for ${techniqueIds.length} techniques, excluding ${excludeIds.length} recently served`);

  try {
    const { data, error } = await supabase.rpc('get_random_puzzles', {
      technique_ids: techniqueIds,
      exclude_ids: excludeIds,
    });

    if (error) {
      log('Supabase RPC error:', error.message);
      return;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      log('No puzzles returned from Supabase');
      return;
    }

    log(`Received ${data.length} puzzles from Supabase`);

    // Merge into memory cache
    if (!memoryCache) {
      memoryCache = createEmptyCache();
    }

    for (const row of data as PuzzlePoolRow[]) {
      const cached: CachedPuzzle = {
        id: row.id,
        techniqueId: row.technique_id,
        puzzle: compactToGrid(row.puzzle),
        solution: compactToGrid(row.solution),
        techniqueResult: row.technique_result,
      };

      if (!memoryCache.puzzles[row.technique_id]) {
        memoryCache.puzzles[row.technique_id] = [];
      }

      // Avoid duplicates in cache
      const existing = memoryCache.puzzles[row.technique_id];
      if (!existing.some((p) => p.id === cached.id)) {
        existing.push(cached);
      }
    }

    memoryCache.updatedAt = Date.now();
    await persistCache();
  } catch (err) {
    log('Fetch failed:', err);
    // Silently fail — curated bank is always available as fallback
  }
}

// ============================================
// AsyncStorage Persistence
// ============================================

async function persistCache(): Promise<void> {
  if (!memoryCache) return;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PUZZLE_CACHE,
      JSON.stringify(memoryCache),
    );
  } catch (err) {
    log('Failed to persist cache:', err);
  }
}

async function loadCache(): Promise<PuzzleCacheStore | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PUZZLE_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as PuzzleCacheStore;
  } catch (err) {
    log('Failed to load cache from AsyncStorage:', err);
    return null;
  }
}

// ============================================
// Public API
// ============================================

/**
 * Prefetch puzzles from Supabase into the local cache.
 *
 * Called on technique list screen mount and on app foreground.
 * Identifies techniques where cache depth < PUZZLES_PER_TECHNIQUE and
 * batch-fetches replacements from Supabase. If the fetch fails (network
 * error, timeout), silently fails — no user impact.
 */
export async function prefetchPuzzles(
  techniqueIds: string[],
): Promise<void> {
  try {
    // 1. Load from AsyncStorage into memoryCache (if not already loaded)
    if (!memoryCache) {
      const stored = await loadCache();

      if (stored) {
        // Validate schema version
        if (stored.schemaVersion !== CACHE_SCHEMA_VERSION) {
          log('Cache schema mismatch — evicting stale cache');
          memoryCache = createEmptyCache();
        } else if (Date.now() - stored.updatedAt > CACHE_MAX_AGE_MS) {
          log('Cache expired (TTL) — creating fresh cache');
          memoryCache = createEmptyCache();
        } else {
          memoryCache = stored;
          const totalPuzzles = Object.values(stored.puzzles).reduce(
            (sum, arr) => sum + arr.length,
            0,
          );
          log(`Loaded cache: ${totalPuzzles} puzzles across ${Object.keys(stored.puzzles).length} techniques`);
        }
      } else {
        memoryCache = createEmptyCache();
        log('No existing cache found — starting fresh');
      }
    }

    // 2. Identify techniques needing refill
    const needsRefill = techniqueIds.filter((id) => {
      const cached = memoryCache!.puzzles[id];
      return !cached || cached.length < PUZZLES_PER_TECHNIQUE;
    });

    if (needsRefill.length === 0) {
      log('All techniques fully stocked');
      return;
    }

    log(`${needsRefill.length} techniques need refill`);

    // 3. Batch-fetch from Supabase
    await fetchAndCache(needsRefill);
  } catch (err) {
    log('prefetchPuzzles failed:', err);
    // Silently fail — curated bank fallback always works
  }
}

/**
 * Get a cached puzzle for a technique.
 *
 * Synchronous read from the in-memory mirror — no async, no loading state.
 * Returns the first available puzzle, or null on cache miss.
 * Does NOT consume the puzzle (call consumeAndRefill after serving).
 */
export function getCachedPuzzle(
  techniqueId: string,
): CachedPuzzle | null {
  if (!memoryCache) {
    log(`Cache miss (not loaded): ${techniqueId}`);
    return null;
  }

  const puzzles = memoryCache.puzzles[techniqueId];
  if (!puzzles || puzzles.length === 0) {
    log(`Cache miss (empty): ${techniqueId}`);
    return null;
  }

  log(`Cache hit: ${techniqueId} (${puzzles.length} available)`);
  return puzzles[0];
}

/**
 * Consume a served puzzle and trigger background refill if needed.
 *
 * Removes the puzzle from cache, adds its ID to the recently-served ring
 * buffer, and triggers a background Supabase fetch if cache depth drops
 * below the refill threshold.
 *
 * Fire-and-forget — never blocks the UI.
 */
export function consumeAndRefill(
  techniqueId: string,
  puzzleId: string,
): void {
  if (!memoryCache) return;

  // Remove consumed puzzle from cache
  const puzzles = memoryCache.puzzles[techniqueId];
  if (puzzles) {
    memoryCache.puzzles[techniqueId] = puzzles.filter(
      (p) => p.id !== puzzleId,
    );
  }

  // Add to recently-served ring buffer
  memoryCache.recentlyServed.push(puzzleId);
  if (memoryCache.recentlyServed.length > MAX_RECENTLY_SERVED) {
    memoryCache.recentlyServed = memoryCache.recentlyServed.slice(
      -MAX_RECENTLY_SERVED,
    );
  }

  // Persist updated cache (async, fire-and-forget)
  persistCache();

  // Trigger background refill if below threshold
  const remaining = memoryCache.puzzles[techniqueId]?.length ?? 0;
  if (remaining < REFILL_THRESHOLD) {
    log(`Refill triggered for ${techniqueId} (${remaining} remaining)`);
    fetchAndCache([techniqueId]);
  }
}

/**
 * Clear the entire puzzle cache (technique + game).
 *
 * Utility for settings screen "clear data" or debugging.
 */
export async function clearCache(): Promise<void> {
  memoryCache = null;
  gameMemoryCache = null;
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PUZZLE_CACHE,
      STORAGE_KEYS.GAME_PUZZLE_CACHE,
    ]);
    log('All caches cleared');
  } catch (err) {
    log('Failed to clear cache:', err);
  }
}

// ============================================
// ============================================
// GAME PUZZLE CACHE
// Same pattern as technique cache, keyed by difficulty instead of technique_id.
// ============================================
// ============================================

export interface CachedGamePuzzle {
  id: string; // Supabase row UUID
  difficulty: string;
  puzzle: number[][];
  solution: number[][];
}

interface GamePuzzleCacheStore {
  schemaVersion: number;
  updatedAt: number;
  puzzles: Record<string, CachedGamePuzzle[]>; // difficulty -> array
  recentlyServed: string[];
}

// ============================================
// Game Cache State
// ============================================

let gameMemoryCache: GamePuzzleCacheStore | null = null;

function createEmptyGameCache(): GamePuzzleCacheStore {
  return {
    schemaVersion: CACHE_SCHEMA_VERSION,
    updatedAt: Date.now(),
    puzzles: {},
    recentlyServed: [],
  };
}

// ============================================
// Game Cache Concurrency Guard
// ============================================

let gameFetchInFlight: Promise<void> | null = null;

async function gameFetchAndCache(difficulties: string[]): Promise<void> {
  if (gameFetchInFlight) {
    log('[Game] Fetch already in flight, waiting...');
    return gameFetchInFlight;
  }
  gameFetchInFlight = doGameFetch(difficulties).finally(() => {
    gameFetchInFlight = null;
  });
  return gameFetchInFlight;
}

// ============================================
// Game Cache Supabase Fetch
// ============================================

interface GamePuzzlePoolRow {
  id: string;
  difficulty: string;
  clue_count: number;
  max_technique_level: number;
  puzzle: string;
  solution: string;
  created_at: string;
}

async function doGameFetch(difficulties: string[]): Promise<void> {
  if (difficulties.length === 0) return;

  if (!gameMemoryCache) {
    gameMemoryCache = createEmptyGameCache();
  }

  const excludeIds = gameMemoryCache.recentlyServed;

  log(`[Game] Fetching puzzles for ${difficulties.length} difficulties`);

  try {
    // Fetch one puzzle per difficulty
    for (const diff of difficulties) {
      const { data, error } = await supabase.rpc('get_random_game_puzzle', {
        target_difficulty: diff,
        exclude_ids: excludeIds,
      });

      if (error) {
        log(`[Game] RPC error for ${diff}:`, error.message);
        continue;
      }

      const rows = Array.isArray(data) ? data : data ? [data] : [];
      if (rows.length === 0) continue;

      const row = rows[0] as GamePuzzlePoolRow;
      const cached: CachedGamePuzzle = {
        id: row.id,
        difficulty: row.difficulty,
        puzzle: compactToGrid(row.puzzle),
        solution: compactToGrid(row.solution),
      };

      if (!gameMemoryCache.puzzles[diff]) {
        gameMemoryCache.puzzles[diff] = [];
      }

      const existing = gameMemoryCache.puzzles[diff];
      if (!existing.some((p) => p.id === cached.id)) {
        existing.push(cached);
      }
    }

    gameMemoryCache.updatedAt = Date.now();
    await persistGameCache();
  } catch (err) {
    log('[Game] Fetch failed:', err);
  }
}

// ============================================
// Game Cache Persistence
// ============================================

async function persistGameCache(): Promise<void> {
  if (!gameMemoryCache) return;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GAME_PUZZLE_CACHE,
      JSON.stringify(gameMemoryCache),
    );
  } catch (err) {
    log('[Game] Failed to persist cache:', err);
  }
}

async function loadGameCache(): Promise<GamePuzzleCacheStore | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.GAME_PUZZLE_CACHE);
    if (!raw) return null;
    return JSON.parse(raw) as GamePuzzleCacheStore;
  } catch (err) {
    log('[Game] Failed to load cache:', err);
    return null;
  }
}

// ============================================
// Game Cache Public API
// ============================================

/**
 * Prefetch game puzzles from Supabase into the local cache.
 * Called on app launch / foreground.
 */
export async function prefetchGamePuzzles(
  difficulties: string[],
): Promise<void> {
  try {
    if (!gameMemoryCache) {
      const stored = await loadGameCache();
      if (stored) {
        if (stored.schemaVersion !== CACHE_SCHEMA_VERSION) {
          log('[Game] Cache schema mismatch — evicting');
          gameMemoryCache = createEmptyGameCache();
        } else if (Date.now() - stored.updatedAt > CACHE_MAX_AGE_MS) {
          log('[Game] Cache expired — creating fresh');
          gameMemoryCache = createEmptyGameCache();
        } else {
          gameMemoryCache = stored;
          const total = Object.values(stored.puzzles).reduce((s, a) => s + a.length, 0);
          log(`[Game] Loaded cache: ${total} puzzles`);
        }
      } else {
        gameMemoryCache = createEmptyGameCache();
        log('[Game] No existing cache — starting fresh');
      }
    }

    const needsRefill = difficulties.filter((d) => {
      const cached = gameMemoryCache!.puzzles[d];
      return !cached || cached.length < PUZZLES_PER_TECHNIQUE;
    });

    if (needsRefill.length === 0) {
      log('[Game] All difficulties fully stocked');
      return;
    }

    log(`[Game] ${needsRefill.length} difficulties need refill`);
    await gameFetchAndCache(needsRefill);
  } catch (err) {
    log('[Game] prefetchGamePuzzles failed:', err);
  }
}

/**
 * Get a cached game puzzle for a difficulty.
 * Synchronous — returns instantly or null.
 */
export function getCachedGamePuzzle(
  difficulty: string,
): CachedGamePuzzle | null {
  if (!gameMemoryCache) {
    log(`[Game] Cache miss (not loaded): ${difficulty}`);
    return null;
  }

  const puzzles = gameMemoryCache.puzzles[difficulty];
  if (!puzzles || puzzles.length === 0) {
    log(`[Game] Cache miss (empty): ${difficulty}`);
    return null;
  }

  log(`[Game] Cache hit: ${difficulty} (${puzzles.length} available)`);
  return puzzles[0];
}

/**
 * Consume a served game puzzle and trigger background refill.
 * Fire-and-forget.
 */
export function consumeAndRefillGamePuzzle(
  difficulty: string,
  puzzleId: string,
): void {
  if (!gameMemoryCache) return;

  const puzzles = gameMemoryCache.puzzles[difficulty];
  if (puzzles) {
    gameMemoryCache.puzzles[difficulty] = puzzles.filter((p) => p.id !== puzzleId);
  }

  gameMemoryCache.recentlyServed.push(puzzleId);
  if (gameMemoryCache.recentlyServed.length > MAX_RECENTLY_SERVED) {
    gameMemoryCache.recentlyServed = gameMemoryCache.recentlyServed.slice(-MAX_RECENTLY_SERVED);
  }

  persistGameCache();

  const remaining = gameMemoryCache.puzzles[difficulty]?.length ?? 0;
  if (remaining < REFILL_THRESHOLD) {
    log(`[Game] Refill triggered for ${difficulty} (${remaining} remaining)`);
    gameFetchAndCache([difficulty]);
  }
}
