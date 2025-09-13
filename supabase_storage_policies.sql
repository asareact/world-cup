-- Supabase Storage policies for team-logos and player-photos
-- Roles: superAdmin, capitan (from public.user_profiles.role)
-- Ownership model: a user can operate on images that belong to teams they created
-- (teams.created_by) or where they are captain (teams.captain_id). For player
-- photos, the player must belong to one of those teams.

-- 0) Helpers: extract IDs from object names
--    Expected paths (recommend deterministic names to enable overwrite):
--    - Team logo:   teams/<TEAM_UUID>/logo.<ext>
--    - Player photo: teams/<TEAM_UUID>/players/<PLAYER_UUID>.<ext>

create or replace function public.storage_team_from_name(obj_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  m text;
begin
  -- Matches: teams/<TEAM_UUID>/...
  m := substring(obj_name from '^teams/([0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12})/');
  if m is null then
    return null;
  end if;
  return m::uuid;
end;
$$;

create or replace function public.storage_player_from_name(obj_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  m text;
begin
  -- Matches: teams/<TEAM_UUID>/players/<PLAYER_UUID>.<ext>
  m := substring(obj_name from '^teams/[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}/players/([0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12})');
  if m is null then
    return null;
  end if;
  return m::uuid;
end;
$$;

-- 1) Remove any previous policies (idempotent)
drop policy if exists "team-logos select" on storage.objects;
drop policy if exists "team-logos insert (roles)" on storage.objects;
drop policy if exists "team-logos update (roles)" on storage.objects;
drop policy if exists "team-logos delete (roles)" on storage.objects;

drop policy if exists "player-photos select" on storage.objects;
drop policy if exists "player-photos insert (roles)" on storage.objects;
drop policy if exists "player-photos update (roles)" on storage.objects;
drop policy if exists "player-photos delete (roles)" on storage.objects;

-- 2) Read policies (public read). If you want to restrict reads, change TO public -> TO authenticated
create policy "team-logos select"
on storage.objects
for select
to public
using (bucket_id = 'team-logos');

create policy "player-photos select"
on storage.objects
for select
to public
using (bucket_id = 'player-photos');

-- 3) Insert policies: authenticated superAdmin/capitan and team/captain ownership
create policy "team-logos insert (roles)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'team-logos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      -- superAdmin can act on any team
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.teams t
        where t.id = public.storage_team_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
);

create policy "player-photos insert (roles)"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'player-photos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.players pl
        join public.teams t on t.id = pl.team_id
        where pl.id = public.storage_player_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
);

-- 4) Update policies (allow overwriting paths). Upsert in client requires update permission.
create policy "team-logos update (roles)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'team-logos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.teams t
        where t.id = public.storage_team_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
)
with check (bucket_id = 'team-logos');

create policy "player-photos update (roles)"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'player-photos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.players pl
        join public.teams t on t.id = pl.team_id
        where pl.id = public.storage_player_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
)
with check (bucket_id = 'player-photos');

-- 5) Delete policies
create policy "team-logos delete (roles)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'team-logos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.teams t
        where t.id = public.storage_team_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
);

create policy "player-photos delete (roles)"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'player-photos'
  and (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role in ('superAdmin','capitan')
    )
    and (
      exists (select 1 from public.user_profiles p2 where p2.id = auth.uid() and p2.role = 'superAdmin')
      or exists (
        select 1
        from public.players pl
        join public.teams t on t.id = pl.team_id
        where pl.id = public.storage_player_from_name(storage.objects.name)
          and (t.created_by = auth.uid() or t.captain_id = auth.uid())
      )
    )
  )
);

-- Usage notes:
-- 1) Prefer deterministic paths with upsert:true to overwrite and avoid orphan files
--    Team logo:   teams/<TEAM_ID>/logo.<ext>
--    Player photo: teams/<TEAM_ID>/players/<PLAYER_ID>.<ext>
-- 2) If you must change extension, delete old path first via storage.remove([...]) then upload new.
-- 3) If buckets are set to Public, selects are open. If not, adjust the select policies above.
