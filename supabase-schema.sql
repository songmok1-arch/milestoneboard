-- 마일스톤보드 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요.

create extension if not exists pgcrypto;

create table if not exists mb_boards (
  id uuid primary key default gen_random_uuid(),
  share_code text unique not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists mb_milestones (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references mb_boards(id) on delete cascade,
  title text not null,
  due_date date,
  status text not null default 'planned' check (status in ('planned', 'doing', 'done')),
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists mb_milestones_board_id_idx on mb_milestones (board_id);

alter table mb_boards enable row level security;
alter table mb_milestones enable row level security;

-- MVP 정책: 링크(share_code)를 아는 사람은 누구나 읽고 쓸 수 있습니다.
drop policy if exists "public read mb_boards" on mb_boards;
create policy "public read mb_boards" on mb_boards for select using (true);
drop policy if exists "public insert mb_boards" on mb_boards;
create policy "public insert mb_boards" on mb_boards for insert with check (true);

drop policy if exists "public read mb_milestones" on mb_milestones;
create policy "public read mb_milestones" on mb_milestones for select using (true);
drop policy if exists "public insert mb_milestones" on mb_milestones;
create policy "public insert mb_milestones" on mb_milestones for insert with check (true);
drop policy if exists "public update mb_milestones" on mb_milestones;
create policy "public update mb_milestones" on mb_milestones for update using (true);
drop policy if exists "public delete mb_milestones" on mb_milestones;
create policy "public delete mb_milestones" on mb_milestones for delete using (true);
