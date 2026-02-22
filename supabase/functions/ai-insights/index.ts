import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Gather user data for context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const today = new Date().toISOString().split("T")[0];

    const [moodRes, decRes, habitRes, journalRes] = await Promise.all([
      supabase.from("mood_entries").select("value, sleep, stress, logged_at").eq("user_id", user.id).gte("logged_at", sevenDaysAgo.toISOString()).order("logged_at", { ascending: false }).limit(10),
      supabase.from("decisions").select("name, status, priority").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("habit_completions").select("completed_date").eq("user_id", user.id).gte("completed_date", sevenDaysAgo.toISOString().split("T")[0]),
      supabase.from("journal_entries").select("title, content, mood_score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    ]);

    const moods = (moodRes.data || []);
    const decisions = (decRes.data || []);
    const habits = (habitRes.data || []);
    const journals = (journalRes.data || []);

    const avgMood = moods.length ? (moods.reduce((s: number, m: any) => s + m.value, 0) / moods.length).toFixed(1) : "aucune donnée";
    const pendingDecisions = decisions.filter((d: any) => d.status === "pending");
    const habitDays = new Set(habits.map((h: any) => h.completed_date)).size;

    const userContext = `
Données utilisateur (7 derniers jours):
- Humeur moyenne: ${avgMood}/10
- Entrées humeur récentes: ${moods.map((m: any) => `${m.value}/10 (sommeil: ${m.sleep ?? '?'}h, stress: ${m.stress ?? '?'}/10)`).join(", ") || "aucune"}
- Décisions en attente: ${pendingDecisions.map((d: any) => `"${d.name}" (priorité ${d.priority}/5)`).join(", ") || "aucune"}
- Habitudes complétées: ${habitDays} jours sur 7
- Dernières entrées journal: ${journals.map((j: any) => `"${j.title || 'Sans titre'}" (humeur: ${j.mood_score ?? '?'})`).join(", ") || "aucune"}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un coach exécutif bienveillant et perspicace. Tu analyses les données de bien-être et de productivité d'un leader pour fournir des insights personnalisés, concrets et actionnables. Réponds en français. Sois concis (3-5 bullet points max). Utilise des émojis sobrement. Ne répète pas les données brutes, donne des insights et recommandations.`,
          },
          {
            role: "user",
            content: `Voici mes données récentes. Donne-moi 3-5 insights personnalisés et recommandations actionnables pour cette semaine.\n\n${userContext}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "Aucun insight disponible pour le moment.";

    return new Response(JSON.stringify({ insights: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
