import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Composite percentile via raw query
    const { data: compositeResult, error: compositeError } = await supabase
      .from('user_streaks')
      .select('total_xp, total_games, current_streak')
      .eq('user_id', user_id)
      .single();

    if (compositeError || !compositeResult) {
      return new Response(
        JSON.stringify({ percentile: null, avgTimePercentiles: { easy: null, medium: null, hard: null, expert: null } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { total_xp, total_games, current_streak } = compositeResult;

    // Count total users
    const { count: totalUsers } = await supabase
      .from('user_streaks')
      .select('*', { count: 'exact', head: true });

    if (!totalUsers || totalUsers === 0) {
      return new Response(
        JSON.stringify({ percentile: 100, avgTimePercentiles: { easy: null, medium: null, hard: null, expert: null } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Count users at or below for each signal
    const { count: xpRank } = await supabase
      .from('user_streaks')
      .select('*', { count: 'exact', head: true })
      .lte('total_xp', total_xp);

    const { count: gamesRank } = await supabase
      .from('user_streaks')
      .select('*', { count: 'exact', head: true })
      .lte('total_games', total_games);

    const { count: streakRank } = await supabase
      .from('user_streaks')
      .select('*', { count: 'exact', head: true })
      .lte('current_streak', current_streak);

    const compositePercentile = Math.round(
      ((xpRank! + gamesRank! + streakRank!) * 100) / (3 * totalUsers)
    );

    // Per-difficulty avg time percentiles
    const difficulties = ['easy', 'medium', 'hard', 'expert'] as const;
    const avgTimePercentiles: Record<string, number | null> = {
      easy: null,
      medium: null,
      hard: null,
      expert: null,
    };

    for (const diff of difficulties) {
      // Get user's avg time for this difficulty
      const { data: userGames } = await supabase
        .from('game_completions')
        .select('time_seconds')
        .eq('user_id', user_id)
        .eq('difficulty', diff)
        .eq('won', true)
        .not('time_seconds', 'is', null);

      if (!userGames || userGames.length === 0) continue;

      const userAvg = userGames.reduce((sum: number, g: { time_seconds: number }) => sum + g.time_seconds, 0) / userGames.length;

      // Get all users' avg times for this difficulty
      const { data: allGames } = await supabase
        .from('game_completions')
        .select('user_id, time_seconds')
        .eq('difficulty', diff)
        .eq('won', true)
        .not('time_seconds', 'is', null);

      if (!allGames || allGames.length === 0) continue;

      // Group by user and compute averages
      const userAvgs = new Map<string, { sum: number; count: number }>();
      for (const g of allGames) {
        const entry = userAvgs.get(g.user_id) || { sum: 0, count: 0 };
        entry.sum += g.time_seconds;
        entry.count += 1;
        userAvgs.set(g.user_id, entry);
      }

      let slowerOrEqual = 0;
      const totalPlayers = userAvgs.size;

      for (const [, entry] of userAvgs) {
        const avg = entry.sum / entry.count;
        if (avg >= userAvg) slowerOrEqual++;
      }

      avgTimePercentiles[diff] = Math.round((slowerOrEqual * 100) / totalPlayers);
    }

    return new Response(
      JSON.stringify({
        percentile: compositePercentile,
        avgTimePercentiles,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
