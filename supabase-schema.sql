-- ============================================================
-- LES PALMIERS — Schema Supabase
-- Colle ce SQL dans : Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Profiles (liés aux comptes Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  classe_id text,
  teacher_id text,
  created_at timestamptz not null default now()
);

-- Classes
create table if not exists classes (
  id text primary key,
  name text not null,
  level text not null default '3ème année collège',
  section text not null default '',
  student_count int not null default 0,
  accent text not null default 'from-indigo-500 via-violet-500 to-fuchsia-500',
  emoji text not null default '🎓',
  created_at timestamptz not null default now()
);

-- Courses (matières)
create table if not exists courses (
  id text primary key,
  classe_id text not null references classes(id) on delete cascade,
  name text not null,
  teacher text not null default 'À définir',
  accent text not null default 'from-indigo-500 via-violet-500 to-fuchsia-500',
  emoji text not null default '📚',
  progress int not null default 50,
  created_at timestamptz not null default now()
);

-- Students (élèves)
create table if not exists students (
  id text primary key,
  first_name text not null,
  last_name text not null,
  classe_id text not null references classes(id) on delete cascade,
  emoji text not null default '😀',
  birth_date date not null default '2010-01-01',
  parent_name text not null default '',
  parent_phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

-- Grades (notes)
create table if not exists grades (
  student_id text not null references students(id) on delete cascade,
  assignment_id text not null,
  score numeric(4,1) not null,
  updated_at timestamptz not null default now(),
  primary key (student_id, assignment_id)
);

-- Announcements (annonces)
create table if not exists announcements (
  id text primary key,
  author text not null,
  role text not null check (role in ('student','teacher','admin')),
  body text not null,
  classe_id text,
  course_id text,
  created_at timestamptz not null default now()
);

-- Assignments (devoirs)
create table if not exists assignments (
  id text primary key,
  title text not null,
  course_id text not null references courses(id) on delete cascade,
  due_label text not null default 'Sans date',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Stream posts (fil d'actualité)
create table if not exists stream_posts (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  author text not null,
  role text not null check (role in ('student','teacher','admin')),
  body text not null,
  kind text not null check (kind in ('announcement','assignment','material')),
  title text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — utilisateurs connectés uniquement
-- ============================================================
alter table profiles enable row level security;
alter table classes enable row level security;
alter table courses enable row level security;
alter table students enable row level security;
alter table grades enable row level security;
alter table announcements enable row level security;
alter table assignments enable row level security;
alter table stream_posts enable row level security;

create policy "auth_profiles"     on profiles     for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_classes"      on classes       for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_courses"      on courses       for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_students"     on students      for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_grades"       on grades        for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_announcements"on announcements for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_assignments"  on assignments   for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth_stream"       on stream_posts  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- Trigger : créer le profil automatiquement à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
