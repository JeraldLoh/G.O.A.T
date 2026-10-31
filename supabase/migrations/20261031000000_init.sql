-- Mirrors lib/schemas.ts. Ids are text because seed banks use readable ids.
--
-- RLS is on with no policies, on purpose: the anon key can read and write
-- nothing. All access goes through server routes using the service-role key,
-- which bypasses RLS.

create table banks (
  id text primary key,
  title text not null check (length(title) > 0),
  subject text not null check (
    subject in ('science', 'technology', 'business', 'humanities', 'math', 'language', 'health', 'other')
  ),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  tags text[] not null default '{}',
  license text not null check (
    license in ('CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC-BY-NC-SA-4.0', 'PUBLIC-DOMAIN', 'OWN-WORK')
  ),
  attribution text not null default '',
  source_url text,
  origin text not null default 'community' check (origin in ('community', 'ai-seeded')),
  source_text text not null check (length(source_text) > 0), -- NFKC-normalized
  ratings_up integer not null default 0 check (ratings_up >= 0),
  ratings_down integer not null default 0 check (ratings_down >= 0),
  created_at timestamptz not null default now()
);

create table cards (
  id text primary key,
  bank_id text not null references banks (id) on delete cascade,
  topic text not null check (length(topic) > 0),
  title text not null check (length(title) > 0),
  body text not null check (length(body) > 0),
  quote text not null check (length(quote) > 0),
  source_start integer check (source_start >= 0), -- offsets into banks.source_text
  source_end integer check (source_end >= 0),
  verified boolean not null default false,
  flags integer not null default 0 check (flags >= 0),
  "order" integer not null check ("order" >= 0)
);

create table quizzes (
  id text primary key,
  bank_id text not null references banks (id) on delete cascade,
  topic text not null check (length(topic) > 0),
  question text not null check (length(question) > 0),
  options text[] not null check (cardinality(options) between 2 and 4),
  answer_index integer not null,
  explanation text not null check (length(explanation) > 0),
  check (answer_index >= 0 and answer_index < cardinality(options))
);

create table generations (
  id text primary key,
  bank_id text not null references banks (id) on delete cascade,
  model text not null,
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  cost_usd numeric(12, 6) not null check (cost_usd >= 0),
  duration_ms double precision not null check (duration_ms >= 0),
  cards_total integer not null check (cards_total >= 0), -- includes dropped cards
  cards_verified integer not null check (cards_verified >= 0),
  created_at timestamptz not null default now()
);

create table flags (
  id text primary key,
  card_id text not null references cards (id) on delete cascade,
  device_id text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (card_id, device_id) -- one flag per device per card
);

-- Not in the shared types: lets a device change its rating without double-counting.
create table ratings (
  bank_id text not null references banks (id) on delete cascade,
  device_id text not null,
  value smallint not null check (value in (1, -1)),
  primary key (bank_id, device_id)
);

create index cards_bank_id_idx on cards (bank_id);
create index quizzes_bank_id_idx on quizzes (bank_id);
create index generations_bank_id_idx on generations (bank_id);
create index generations_created_at_idx on generations (created_at);
create index banks_created_at_idx on banks (created_at desc);

alter table banks enable row level security;
alter table cards enable row level security;
alter table quizzes enable row level security;
alter table generations enable row level security;
alter table flags enable row level security;
alter table ratings enable row level security;
