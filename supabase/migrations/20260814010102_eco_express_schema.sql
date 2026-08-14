-- Eco Express PHASE 7: Auth-linked schema, atomic point operations, and RLS.
-- Apply with `supabase db push` after linking a Supabase project.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  eco_level smallint not null default 1 check (eco_level between 1 and 4),
  eco_xp integer not null default 0 check (eco_xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key on public.profiles (lower(email));

create table if not exists public.missions (
  id smallint primary key check (id between 1 and 4),
  code text not null unique,
  title text not null,
  category text not null check (category in ('academy', 'popup')),
  base_points integer not null check (base_points > 0),
  max_bonus_points integer not null default 0 check (max_bonus_points >= 0),
  sort_order smallint not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_missions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id smallint not null references public.missions(id),
  status text not null default 'completed' check (status in ('started', 'completed')),
  bonus_points integer not null default 0 check (bonus_points >= 0),
  awarded_points integer not null default 0 check (awarded_points >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, mission_id)
);

create index if not exists user_missions_user_id_idx on public.user_missions (user_id);
create index if not exists user_missions_mission_id_idx on public.user_missions (mission_id);

create table if not exists public.rewards (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  category text not null check (category in ('event', 'lifestyle', 'upcycle')),
  points integer not null check (points > 0),
  stock integer check (stock is null or stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reward_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id text not null references public.rewards(id),
  points_spent integer not null check (points_spent > 0),
  pickup_code text not null unique,
  status text not null default 'requested' check (status in ('requested', 'ready', 'picked_up', 'cancelled')),
  created_at timestamptz not null default now(),
  picked_up_at timestamptz
);

create index if not exists reward_orders_user_created_idx on public.reward_orders (user_id, created_at desc);
create index if not exists reward_orders_reward_id_idx on public.reward_orders (reward_id);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('earn', 'spend')),
  amount integer not null check (
    (kind = 'earn' and amount > 0) or
    (kind = 'spend' and amount < 0)
  ),
  source text not null check (source in ('mission', 'reward', 'adjustment')),
  title text not null,
  description text not null default '',
  mission_id smallint references public.missions(id),
  reward_id text references public.rewards(id),
  reward_order_id uuid references public.reward_orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists point_transactions_user_created_idx on public.point_transactions (user_id, created_at desc);
create index if not exists point_transactions_mission_id_idx on public.point_transactions (mission_id) where mission_id is not null;
create unique index if not exists point_transactions_one_mission_reward_idx
  on public.point_transactions (user_id, mission_id)
  where source = 'mission' and kind = 'earn';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at before update on public.rewards
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'eco-mate'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.missions (id, code, title, category, base_points, max_bonus_points, sort_order)
values
  (1, 'refrigeration-cycle', '냉동 사이클을 조립하라', 'academy', 100, 0, 1),
  (2, 'high-speed-cooling', '초고속 냉방을 제어하라', 'academy', 120, 0, 2),
  (3, 'save-climate-animals', '기후 위기에서 동물들을 구하라', 'popup', 120, 90, 3),
  (4, 'butterfly-effect', '나비효과로부터 지구를 지켜라', 'popup', 120, 90, 4)
on conflict (id) do update set
  code = excluded.code,
  title = excluded.title,
  category = excluded.category,
  base_points = excluded.base_points,
  max_bonus_points = excluded.max_bonus_points,
  sort_order = excluded.sort_order;

insert into public.rewards (id, name, subtitle, description, category, points)
values
  ('seed-ticket', '씨앗 기차 티켓', '심으면 자라는 에코 패스', '사용 후 흙에 심으면 허브가 자라는 생분해 씨앗 종이 티켓', 'event', 80),
  ('reusable-kit', '리유저블 커트러리 키트', '한 끼부터 시작하는 제로 웨이스트', '휴대용 숟가락과 포크, 전용 케이스 세트', 'lifestyle', 120),
  ('ktx-pouch', '업사이클 KTX 파우치', '여정의 소재를 다시 잇다', '폐현수막을 다시 활용해 만든 한정 파우치', 'upcycle', 160),
  ('eco-tumbler', '에코 익스프레스 텀블러', '시원함은 오래, 일회용품은 적게', '이중 단열 구조의 에코 익스프레스 시그니처 텀블러', 'lifestyle', 280)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  category = excluded.category,
  points = excluded.points;

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_orders enable row level security;
alter table public.point_transactions enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "missions_select_active" on public.missions for select to authenticated
using (is_active = true);
create policy "rewards_select_active" on public.rewards for select to authenticated
using (is_active = true);

create policy "user_missions_select_own" on public.user_missions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "point_transactions_select_own" on public.point_transactions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "reward_orders_select_own" on public.reward_orders for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.complete_mission(p_mission_id smallint, p_bonus_points integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_mission public.missions%rowtype;
  v_awarded_points integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_mission
  from public.missions
  where id = p_mission_id and is_active = true;

  if not found then
    raise exception 'Mission not found' using errcode = 'P0002';
  end if;
  if p_bonus_points < 0 or p_bonus_points > v_mission.max_bonus_points then
    raise exception 'Invalid mission bonus' using errcode = '22023';
  end if;

  v_awarded_points := v_mission.base_points + p_bonus_points;
  insert into public.user_missions (user_id, mission_id, status, bonus_points, awarded_points, completed_at)
  values (v_user_id, p_mission_id, 'completed', p_bonus_points, v_awarded_points, now())
  on conflict (user_id, mission_id) do nothing;

  if not found then
    return jsonb_build_object('status', 'already_completed', 'awarded_points', 0);
  end if;

  insert into public.point_transactions (user_id, kind, amount, source, title, description, mission_id)
  values (
    v_user_id,
    'earn',
    v_awarded_points,
    'mission',
    format('미션 %s 완료 · %s', v_mission.id, v_mission.title),
    format('기본 %s P + 선택 보너스 %s P', v_mission.base_points, p_bonus_points),
    p_mission_id
  );

  update public.profiles
  set eco_xp = eco_xp + v_awarded_points,
      eco_level = case
        when eco_xp + v_awarded_points >= 500 then 4
        when eco_xp + v_awarded_points >= 300 then 3
        when eco_xp + v_awarded_points >= 150 then 2
        else 1
      end
  where id = v_user_id;

  return jsonb_build_object('status', 'completed', 'awarded_points', v_awarded_points);
end;
$$;

create or replace function public.redeem_reward(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_order_id uuid;
  v_pickup_code text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_reward from public.rewards
  where id = p_reward_id and is_active = true
  for update;

  if not found then
    raise exception 'Reward not found' using errcode = 'P0002';
  end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    raise exception 'Reward out of stock' using errcode = 'P0001';
  end if;

  select coalesce(sum(amount), 0)::integer into v_balance
  from public.point_transactions
  where user_id = v_user_id;

  if v_balance < v_reward.points then
    return jsonb_build_object('status', 'insufficient', 'shortage', v_reward.points - v_balance);
  end if;

  v_pickup_code := 'ECO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.reward_orders (user_id, reward_id, points_spent, pickup_code)
  values (v_user_id, v_reward.id, v_reward.points, v_pickup_code)
  returning id into v_order_id;

  insert into public.point_transactions (user_id, kind, amount, source, title, description, reward_id, reward_order_id)
  values (v_user_id, 'spend', -v_reward.points, 'reward', '굿즈 교환 · ' || v_reward.name, '수령 코드 ' || v_pickup_code, v_reward.id, v_order_id);

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = v_reward.id;
  end if;

  return jsonb_build_object('status', 'success', 'order_id', v_order_id, 'pickup_code', v_pickup_code);
end;
$$;

revoke all on public.profiles, public.missions, public.user_missions, public.rewards, public.reward_orders, public.point_transactions from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.missions, public.rewards, public.user_missions, public.point_transactions, public.reward_orders to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on function public.complete_mission(smallint, integer) from public, anon;
revoke all on function public.redeem_reward(text) from public, anon;
grant execute on function public.complete_mission(smallint, integer) to authenticated;
grant execute on function public.redeem_reward(text) to authenticated;
