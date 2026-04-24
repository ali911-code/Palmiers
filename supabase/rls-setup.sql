-- ============================================================
-- RLS setup complet pour Les Palmiers
-- Exécute ce script une seule fois dans Supabase → SQL Editor
-- ============================================================

-- ---------- Helper : savoir si l'utilisateur courant est admin ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Admin reads all profiles" on public.profiles;
drop policy if exists "Admin writes all profiles" on public.profiles;
drop policy if exists "Authenticated read profiles" on public.profiles;

-- Tout le monde connecté peut lire les profils (pour le picker admin, listes, etc.)
create policy "Authenticated read profiles"
on public.profiles for select
to authenticated
using (true);

-- Chacun peut créer son propre profil au signup
create policy "Users insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Chacun peut modifier son propre profil
create policy "Users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- Admin peut tout modifier / supprimer
create policy "Admin writes all profiles"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- CLASSES
-- ============================================================
alter table public.classes enable row level security;

drop policy if exists "Authenticated read classes" on public.classes;
drop policy if exists "Admin writes classes" on public.classes;

create policy "Authenticated read classes"
on public.classes for select
to authenticated
using (true);

create policy "Admin writes classes"
on public.classes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- COURSES
-- ============================================================
alter table public.courses enable row level security;

drop policy if exists "Authenticated read courses" on public.courses;
drop policy if exists "Admin writes courses" on public.courses;

create policy "Authenticated read courses"
on public.courses for select
to authenticated
using (true);

create policy "Admin writes courses"
on public.courses for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- STUDENTS (fiches élèves)
-- ============================================================
alter table public.students enable row level security;

drop policy if exists "Authenticated read students" on public.students;
drop policy if exists "Admin writes students" on public.students;
drop policy if exists "Self update student" on public.students;

create policy "Authenticated read students"
on public.students for select
to authenticated
using (true);

create policy "Self update student"
on public.students for update
to authenticated
using (auth.uid() = id);

create policy "Admin writes students"
on public.students for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- GRADES
-- ============================================================
alter table public.grades enable row level security;

drop policy if exists "Read grades" on public.grades;
drop policy if exists "Teacher/Admin writes grades" on public.grades;

-- Élève voit ses notes, prof et admin voient tout
create policy "Read grades"
on public.grades for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

create policy "Teacher/Admin writes grades"
on public.grades for all
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
)
with check (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
alter table public.assignments enable row level security;

drop policy if exists "Authenticated read assignments" on public.assignments;
drop policy if exists "Teacher/Admin writes assignments" on public.assignments;

create policy "Authenticated read assignments"
on public.assignments for select
to authenticated
using (true);

create policy "Teacher/Admin writes assignments"
on public.assignments for all
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
)
with check (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
alter table public.announcements enable row level security;

drop policy if exists "Authenticated read announcements" on public.announcements;
drop policy if exists "Teacher/Admin writes announcements" on public.announcements;

create policy "Authenticated read announcements"
on public.announcements for select
to authenticated
using (true);

create policy "Teacher/Admin writes announcements"
on public.announcements for all
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
)
with check (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

-- ============================================================
-- STREAM_POSTS
-- ============================================================
alter table public.stream_posts enable row level security;

drop policy if exists "Authenticated read stream" on public.stream_posts;
drop policy if exists "Teacher/Admin writes stream" on public.stream_posts;

create policy "Authenticated read stream"
on public.stream_posts for select
to authenticated
using (true);

create policy "Teacher/Admin writes stream"
on public.stream_posts for all
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
)
with check (
  public.is_admin()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

-- ============================================================
-- SCHEDULE_SLOTS
-- ============================================================
alter table public.schedule_slots enable row level security;

drop policy if exists "Authenticated read schedule" on public.schedule_slots;
drop policy if exists "Admin writes schedule" on public.schedule_slots;

create policy "Authenticated read schedule"
on public.schedule_slots for select
to authenticated
using (true);

create policy "Admin writes schedule"
on public.schedule_slots for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============================================================
-- Rafraîchit le cache de RLS
-- ============================================================
notify pgrst, 'reload schema';
