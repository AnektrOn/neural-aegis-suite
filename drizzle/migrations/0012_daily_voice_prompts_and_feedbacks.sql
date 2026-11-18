CREATE TABLE IF NOT EXISTS public.daily_voice_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    batch_time TEXT NOT NULL DEFAULT '08h00',
    prompts JSONB NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, date, batch_time)
);
GRANT SELECT ON public.daily_voice_prompts TO authenticated;
GRANT ALL ON public.daily_voice_prompts TO service_role;
ALTER TABLE public.daily_voice_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their prompts" ON public.daily_voice_prompts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE TABLE IF NOT EXISTS public.voice_session_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt_id TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    elevenlabs_conversation_id TEXT,
    duration_seconds INT,
    transcript TEXT,
    exported_to_drive BOOLEAN DEFAULT FALSE,
    drive_file_path TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_session_feedbacks TO authenticated;
GRANT ALL ON public.voice_session_feedbacks TO service_role;
ALTER TABLE public.voice_session_feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their feedbacks" ON public.voice_session_feedbacks
    FOR ALL TO authenticated
    USING (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
    WITH CHECK (auth.uid() = user_id AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE INDEX IF NOT EXISTS idx_prompts_lookup ON public.daily_voice_prompts(user_id, date, batch_time);
CREATE INDEX IF NOT EXISTS idx_voice_feedbacks_user ON public.voice_session_feedbacks(user_id);