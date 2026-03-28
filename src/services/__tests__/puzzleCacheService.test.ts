import { STORAGE_KEYS } from "../../utils/storage";
import { TechniqueResult } from "../../engine/solver/types";

// ============================================
// Import after mocks are set up
// ============================================

import {
  prefetchPuzzles,
  getCachedPuzzle,
  consumeAndRefill,
  clearCache,
} from "../puzzleCacheService";

// ============================================
// Mocks
// ============================================

const mockGetItem = jest.fn<Promise<string | null>, [string]>().mockResolvedValue(null);
const mockSetItem = jest.fn<Promise<void>, [string, string]>().mockResolvedValue(undefined);
const mockRemoveItem = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
const mockMultiRemove = jest.fn<Promise<void>, [string[]]>().mockResolvedValue(undefined);

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...(args as [string])),
    setItem: (...args: unknown[]) => mockSetItem(...(args as [string, string])),
    removeItem: (...args: unknown[]) => mockRemoveItem(...(args as [string])),
    multiRemove: (...args: unknown[]) => mockMultiRemove(...(args as [string[]])),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockRpc = jest.fn();

jest.mock("../../lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// ============================================
// Helpers
// ============================================

function makeFakeTechniqueResult(name: string): TechniqueResult {
  return {
    techniqueName: name,
    level: 2,
    eliminations: [],
    placements: [],
    explanation: "Test explanation",
    highlightCells: [{ row: 0, col: 0 }],
  };
}

function makeSupabaseRow(techniqueId: string, id: string = "uuid-1") {
  return {
    id,
    technique_id: techniqueId,
    technique_name: "Test Technique",
    difficulty_level: 2,
    puzzle: "004160000810000400000000000000000000000000000000000000000000000000000000000000000",
    solution: "534160782810573496672894351485739621963412578127658943758241369391586274246397815",
    technique_result: makeFakeTechniqueResult("Test Technique"),
    created_at: "2026-01-01T00:00:00Z",
  };
}

// ============================================
// Tests
// ============================================

describe("puzzleCacheService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset module-level state by clearing cache
    await clearCache();
  });

  describe("getCachedPuzzle", () => {
    it("returns null when cache has not been loaded", () => {
      const result = getCachedPuzzle("naked-pair");
      expect(result).toBeNull();
    });

    it("returns null after cache is loaded but technique has no puzzles", async () => {
      // Supabase returns empty
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await prefetchPuzzles(["naked-pair"]);

      const result = getCachedPuzzle("naked-pair");
      expect(result).toBeNull();
    });

    it("returns a puzzle after prefetchPuzzles populates the cache", async () => {
      const row = makeSupabaseRow("naked-pair", "uuid-np-1");
      mockRpc.mockResolvedValueOnce({ data: [row], error: null });

      await prefetchPuzzles(["naked-pair"]);

      const result = getCachedPuzzle("naked-pair");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("uuid-np-1");
      expect(result!.techniqueId).toBe("naked-pair");
      expect(result!.puzzle).toHaveLength(9);
      expect(result!.puzzle[0]).toHaveLength(9);
      expect(result!.solution).toHaveLength(9);
    });
  });

  describe("consumeAndRefill", () => {
    it("removes the consumed puzzle from cache", async () => {
      const row = makeSupabaseRow("naked-pair", "uuid-np-1");
      mockRpc.mockResolvedValueOnce({ data: [row], error: null });

      await prefetchPuzzles(["naked-pair"]);

      // Verify puzzle is cached
      expect(getCachedPuzzle("naked-pair")).not.toBeNull();

      // Mock the refill fetch (will be triggered since cache drops below threshold)
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      // Consume
      consumeAndRefill("naked-pair", "uuid-np-1");

      // Allow async operations to settle
      await new Promise((r) => setTimeout(r, 50));

      // Puzzle should be gone
      expect(getCachedPuzzle("naked-pair")).toBeNull();
    });

    it("triggers a background refill when cache drops below threshold", async () => {
      const row = makeSupabaseRow("naked-pair", "uuid-np-1");
      mockRpc.mockResolvedValueOnce({ data: [row], error: null });

      await prefetchPuzzles(["naked-pair"]);

      // Mock the refill fetch
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      consumeAndRefill("naked-pair", "uuid-np-1");

      // Allow async operations to settle
      await new Promise((r) => setTimeout(r, 50));

      // The second rpc call should have been made for refill
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });

  describe("prefetchPuzzles", () => {
    it("is a no-op when all techniques are fully stocked", async () => {
      // First call: populate with 3 puzzles for the technique
      const rows = [
        makeSupabaseRow("naked-pair", "uuid-1"),
        makeSupabaseRow("naked-pair", "uuid-2"),
        makeSupabaseRow("naked-pair", "uuid-3"),
      ];
      mockRpc.mockResolvedValueOnce({ data: rows, error: null });

      await prefetchPuzzles(["naked-pair"]);
      expect(mockRpc).toHaveBeenCalledTimes(1);

      // Second call: should not trigger another fetch since cache has 3
      await prefetchPuzzles(["naked-pair"]);
      expect(mockRpc).toHaveBeenCalledTimes(1); // No new call
    });

    it("silently handles Supabase errors", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      // Should not throw
      await expect(prefetchPuzzles(["naked-pair"])).resolves.not.toThrow();

      // Cache should be empty but functional
      expect(getCachedPuzzle("naked-pair")).toBeNull();
    });

    it("evicts cache on schema version mismatch", async () => {
      // Manually write a stale cache to AsyncStorage
      const staleCache = JSON.stringify({
        schemaVersion: 999, // Wrong version
        updatedAt: Date.now(),
        puzzles: {
          "naked-pair": [
            {
              id: "stale-uuid",
              techniqueId: "naked-pair",
              puzzle: Array(9).fill(Array(9).fill(0)),
              solution: Array(9).fill(Array(9).fill(1)),
              techniqueResult: makeFakeTechniqueResult("Naked Pair"),
            },
          ],
        },
        recentlyServed: [],
      });
      mockGetItem.mockResolvedValueOnce(staleCache);

      // Supabase returns fresh data
      const row = makeSupabaseRow("naked-pair", "fresh-uuid");
      mockRpc.mockResolvedValueOnce({ data: [row], error: null });

      await prefetchPuzzles(["naked-pair"]);

      // Should have the fresh puzzle, not the stale one
      const result = getCachedPuzzle("naked-pair");
      expect(result).not.toBeNull();
      expect(result!.id).toBe("fresh-uuid");
    });
  });

  describe("clearCache", () => {
    it("removes cache from memory and AsyncStorage", async () => {
      const row = makeSupabaseRow("naked-pair", "uuid-1");
      mockRpc.mockResolvedValueOnce({ data: [row], error: null });

      await prefetchPuzzles(["naked-pair"]);
      expect(getCachedPuzzle("naked-pair")).not.toBeNull();

      await clearCache();

      expect(getCachedPuzzle("naked-pair")).toBeNull();
      expect(mockMultiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.PUZZLE_CACHE,
        STORAGE_KEYS.GAME_PUZZLE_CACHE,
      ]);
    });
  });
});
