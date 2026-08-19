-- Award each signed-in participant 500 points once per 3D roadview gate.
-- Visits live in the private schema so they are never exposed through the Data API.

create table if not exists private.roadview_gate_visits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  gate_code text not null check (gate_code in ('L01', 'E01', 'R01', 'B01', 'B02', 'B03', 'B04')),
  awarded_points integer not null default 500 check (awarded_points = 500),
  visited_at timestamptz not null default now(),
  primary key (user_id, gate_code)
);

alter table private.roadview_gate_visits enable row level security;
revoke all on table private.roadview_gate_visits from public, anon, authenticated;

create or replace function public.claim_roadview_gate(p_gate_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_gate_code text := upper(trim(p_gate_code));
  v_points constant integer := 500;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_gate_code is null or v_gate_code not in ('L01', 'E01', 'R01', 'B01', 'B02', 'B03', 'B04') then
    raise exception 'Invalid roadview gate' using errcode = '22023';
  end if;

  insert into private.roadview_gate_visits (user_id, gate_code, awarded_points)
  values (v_user_id, v_gate_code, v_points)
  on conflict (user_id, gate_code) do nothing;

  if not found then
    return jsonb_build_object(
      'status', 'already_completed',
      'gate_code', v_gate_code,
      'awarded_points', 0
    );
  end if;

  insert into public.point_transactions (
    user_id,
    kind,
    amount,
    source,
    title,
    description,
    metadata
  )
  values (
    v_user_id,
    'earn',
    v_points,
    'adjustment',
    '3D 로드뷰 방문 · ' || v_gate_code,
    '3D 로드뷰 구역 최초 방문 500 P',
    jsonb_build_object('roadview_gate_code', v_gate_code)
  );

  update public.profiles
  set eco_xp = eco_xp + v_points,
      eco_level = case
        when eco_xp + v_points >= 500 then 4
        when eco_xp + v_points >= 300 then 3
        when eco_xp + v_points >= 150 then 2
        else 1
      end
  where id = v_user_id;

  return jsonb_build_object(
    'status', 'completed',
    'gate_code', v_gate_code,
    'awarded_points', v_points
  );
end;
$$;

revoke all on function public.claim_roadview_gate(text) from public, anon;
grant execute on function public.claim_roadview_gate(text) to authenticated;
