alter table public.profiles add column if not exists plan_override text;

update public.profiles set plan_override = 'matrix' where plan_override is null;

create policy "Admins can update plan override"
  on public.profiles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));