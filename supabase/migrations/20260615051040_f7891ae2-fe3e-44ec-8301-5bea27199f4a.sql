
DROP POLICY IF EXISTS "Authenticated read alert_rules" ON public.alert_rules;
CREATE POLICY "Admins read alert_rules" ON public.alert_rules
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage drive_folder_cache" ON public.drive_folder_cache
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.pulse_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pulse_courses" ON public.pulse_courses
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pulse_courses" ON public.pulse_courses
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own realtime topic" ON realtime.messages
FOR SELECT TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR (realtime.topic() LIKE 'admin:%' AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users write own realtime topic" ON realtime.messages
FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() = 'user:' || auth.uid()::text
  OR (realtime.topic() LIKE 'admin:%' AND public.has_role(auth.uid(), 'admin'))
);
