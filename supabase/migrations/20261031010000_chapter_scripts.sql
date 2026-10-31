-- One generated video script per bank, reused for every learner. Chapters are
-- JSON because they are only ever read and written whole. RLS on with no
-- policies, like the other tables: only the service-role key gets in.

create table chapter_scripts (
  bank_id text primary key references banks (id) on delete cascade,
  chapters jsonb not null,
  created_at timestamptz not null default now()
);

alter table chapter_scripts enable row level security;
