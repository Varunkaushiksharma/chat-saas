-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
-- Phase 0/1 schema: multi-tenant, RLS on every tenant table, pgvector for the KB.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------- Tenants & membership ----------
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','agent')),
  primary key (tenant_id, user_id)
);

-- Helper used by RLS policies: tenants the current user belongs to
create or replace function my_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from tenant_members where user_id = auth.uid()
$$;

-- ---------- Bots & rules ----------
create table if not exists bots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  tone text not null default 'friendly and concise',
  system_instructions text not null default '',
  fallback_message text not null default 'I''m not sure about that. Let me connect you with our team.',
  confidence_threshold real not null default 0.55,
  public_key text not null unique default encode(gen_random_bytes(16), 'hex'),
  allowed_domains text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists bot_rules (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  type text not null check (type in ('allow_topic','forbid_topic','always_handoff')),
  value text not null
);

-- ---------- Knowledge base ----------
create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  type text not null check (type in ('text','file','url','faq')),
  title text not null,
  status text not null default 'pending' check (status in ('pending','ready','failed')),
  created_at timestamptz not null default now()
);

create table if not exists kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);
create index if not exists kb_chunks_embedding_idx
  on kb_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists kb_chunks_bot_idx on kb_chunks (bot_id);

-- Similarity search scoped to one bot (tenant isolation enforced by bot_id from the server)
create or replace function match_kb_chunks(
  p_bot_id uuid,
  p_embedding vector(768),
  p_match_count int default 5
)
returns table (id uuid, content text, similarity float)
language sql stable as $$
  select c.id, c.content, 1 - (c.embedding <=> p_embedding) as similarity
  from kb_chunks c
  where c.bot_id = p_bot_id
  order by c.embedding <=> p_embedding
  limit p_match_count
$$;

-- ---------- Conversations ----------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  bot_id uuid not null references bots(id) on delete cascade,
  channel text not null default 'web',
  customer_ref text,
  status text not null default 'bot' check (status in ('bot','human','closed')),
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null check (role in ('customer','bot','agent')),
  content text not null,
  confidence real,
  flags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

-- ---------- Row Level Security ----------
alter table tenants            enable row level security;
alter table tenant_members     enable row level security;
alter table bots               enable row level security;
alter table bot_rules          enable row level security;
alter table knowledge_sources  enable row level security;
alter table kb_chunks          enable row level security;
alter table conversations      enable row level security;
alter table messages           enable row level security;

create policy "members read tenant" on tenants
  for select using (id in (select my_tenant_ids()));
create policy "members read own membership" on tenant_members
  for select using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['bots','bot_rules','knowledge_sources','kb_chunks','conversations','messages']
  loop
    execute format(
      'create policy "tenant isolation" on %I for all
         using (tenant_id in (select my_tenant_ids()))
         with check (tenant_id in (select my_tenant_ids()))', t);
  end loop;
end $$;

-- Note: the public widget endpoint and webhooks use the service-role key on the
-- server only, and always derive tenant_id/bot_id from the bot's public_key.
