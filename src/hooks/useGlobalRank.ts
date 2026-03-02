import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../utils/deviceId';
import type { Difficulty } from '../engine/types';

const STALE_MS = 5 * 60 * 1000; // 5 minutes

interface RankResponse {
  percentile: number | null;
  avgTimePercentiles: Record<string, number | null>;
}

interface RankCache {
  globalRank: string | null;
  avgTimePercentiles: Record<Difficulty, string | null>;
  fetchedAt: number;
}

let moduleCache: RankCache | null = null;

function formatPercentile(p: number | null): string | null {
  if (p === null) return null;
  return `Top ${100 - p}%`;
}

export interface RankData {
  globalRank: string | null;
  avgTimePercentiles: Record<Difficulty, string | null>;
  loading: boolean;
  error: string | null;
}

export function useGlobalRank(): RankData {
  const [data, setData] = useState<RankData>(() => ({
    globalRank: moduleCache?.globalRank ?? null,
    avgTimePercentiles: moduleCache?.avgTimePercentiles ?? { easy: null, medium: null, hard: null, expert: null },
    loading: moduleCache === null,
    error: null,
  }));
  const fetchingRef = useRef(false);

  const fetchRank = useCallback(async (isBackground: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const userId = await getDeviceId();

      const { data: result, error } = await supabase.functions.invoke('get-user-rank', {
        body: { user_id: userId },
      });

      if (error) throw new Error(error.message ?? 'Failed to fetch rank');

      const response = result as RankResponse;
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

      const newCache: RankCache = {
        globalRank: formatPercentile(response.percentile),
        avgTimePercentiles: Object.fromEntries(
          difficulties.map((d) => [d, formatPercentile(response.avgTimePercentiles?.[d] ?? null)])
        ) as Record<Difficulty, string | null>,
        fetchedAt: Date.now(),
      };

      moduleCache = newCache;

      setData({
        globalRank: newCache.globalRank,
        avgTimePercentiles: newCache.avgTimePercentiles,
        loading: false,
        error: null,
      });
    } catch (err) {
      if (!isBackground) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch rank',
        }));
      }
      // On background refresh failure, keep stale cached data, don't update loading/error
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const isStale = !moduleCache || (Date.now() - moduleCache.fetchedAt > STALE_MS);

    if (moduleCache) {
      // Return cached data immediately
      setData({
        globalRank: moduleCache.globalRank,
        avgTimePercentiles: moduleCache.avgTimePercentiles,
        loading: false,
        error: null,
      });

      // Refetch in background if stale
      if (isStale) fetchRank(true);
    } else {
      // First load — no cache
      fetchRank(false);
    }
  }, [fetchRank]);

  // Refetch on app foreground if stale
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && moduleCache && Date.now() - moduleCache.fetchedAt > STALE_MS) {
        fetchRank(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchRank]);

  return data;
}
