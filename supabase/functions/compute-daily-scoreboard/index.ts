import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get yesterday's date
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const scoreDate = yesterday.toISOString().split("T")[0];
    const yesterdayStart = scoreDate + "T00:00:00Z";
    const yesterdayEnd = scoreDate + "T23:59:59Z";

    // Get all active scoreboard criteria grouped by user
    const { data: allCriteria, error: critErr } = await supabase
      .from("scoreboard_criteria")
      .select("*")
      .eq("is_active", true);

    if (critErr) throw critErr;
    if (!allCriteria || allCriteria.length === 0) {
      return new Response(JSON.stringify({ message: "No active criteria" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group criteria by user
    const userCriteria = new Map<string, any[]>();
    for (const c of allCriteria) {
      if (!userCriteria.has(c.user_id)) userCriteria.set(c.user_id, []);
      userCriteria.get(c.user_id)!.push(c);
    }

    const results: any[] = [];

    for (const [userId, criteriaList] of userCriteria.entries()) {
      // Fetch user data for yesterday
      const [moodRes, habitRes, journalRes, decRes, toolboxRes, relationRes] = await Promise.all([
        supabase.from("mood_entries").select("value, sleep, stress").eq("user_id", userId).gte("logged_at", yesterdayStart).lte("logged_at", yesterdayEnd),
        supabase.from("habit_completions").select("id").eq("user_id", userId).eq("completed_date", scoreDate),
        supabase.from("journal_entries").select("id").eq("user_id", userId).gte("created_at", yesterdayStart).lte("created_at", yesterdayEnd),
        supabase.from("decisions").select("id").eq("user_id", userId).eq("status", "decided").gte("decided_at", yesterdayStart).lte("decided_at", yesterdayEnd),
        supabase.from("toolbox_completions").select("id").eq("user_id", userId).eq("status", "completed").gte("completed_at", yesterdayStart).lte("completed_at", yesterdayEnd),
        supabase.from("relation_quality_history").select("id").eq("user_id", userId).gte("recorded_at", yesterdayStart).lte("recorded_at", yesterdayEnd),
      ]);

      const moods = moodRes.data || [];
      const avgMood = moods.length ? moods.reduce((s, m) => s + m.value, 0) / moods.length : 0;
      const avgSleep = moods.length ? moods.reduce((s, m) => s + (m.sleep || 0), 0) / moods.length : 0;
      const avgStress = moods.length ? moods.reduce((s, m) => s + (m.stress || 10), 0) / moods.length : 10;
      const habitsCount = (habitRes.data || []).length;
      const journalCount = (journalRes.data || []).length;
      const decisionsCount = (decRes.data || []).length;
      const toolboxCount = (toolboxRes.data || []).length;
      const relationCount = (relationRes.data || []).length;

      let totalScore = 0;
      let maxScore = 0;
      const breakdown: any[] = [];

      for (const c of criteriaList) {
        let met = false;
        switch (c.criteria_type) {
          case "mood_above": met = avgMood >= c.target_value; break;
          case "habits_completed": met = habitsCount >= c.target_value; break;
          case "journal_written": met = journalCount >= c.target_value; break;
          case "sleep_above": met = avgSleep >= c.target_value; break;
          case "stress_below": met = avgStress <= c.target_value; break;
          case "decision_made": met = decisionsCount >= c.target_value; break;
          case "toolbox_completed": met = toolboxCount >= c.target_value; break;
          case "relation_updated": met = relationCount >= c.target_value; break;
        }

        const earned = met ? c.points : 0;
        totalScore += earned;
        maxScore += c.points;
        breakdown.push({
          criteria_id: c.id,
          label: c.criteria_label,
          earned,
          max: c.points,
          met,
        });
      }

      // Upsert daily scoreboard
      const { error: upsertErr } = await supabase
        .from("daily_scoreboards")
        .upsert({
          user_id: userId,
          score_date: scoreDate,
          total_score: totalScore,
          max_score: maxScore,
          breakdown,
        }, { onConflict: "user_id,score_date" });

      if (upsertErr) console.error("Upsert error for", userId, upsertErr);

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Scoreboard: ${totalScore}/${maxScore} pts`,
        message: `Votre score du ${new Date(scoreDate).toLocaleDateString("fr-FR")} est de ${totalScore}/${maxScore} points.`,
        type: totalScore >= maxScore * 0.7 ? "success" : "info",
        link: "/",
      });

      results.push({ userId, totalScore, maxScore });
    }

    return new Response(JSON.stringify({ computed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compute-daily-scoreboard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
