alter table public.missions drop constraint if exists missions_id_check;
alter table public.missions add constraint missions_id_check check (id between 1 and 5);

update public.missions set sort_order = sort_order + 10;

insert into public.missions (id, code, title, category, base_points, max_bonus_points, sort_order, is_active)
values
  (1, 'refrigeration-cycle', '초고속 냉동사이클 체험', 'academy', 100, 0, 1, true),
  (5, 'save-penguin', '녹는 빙하 위에서 펭귄을 구해내라!', 'popup', 100, 0, 2, true),
  (2, 'survive-summer', '무더운 여름에서 살아남기', 'popup', 100, 0, 3, true),
  (3, 'save-animals', '기후 위기에서 동물들을 구하라', 'popup', 120, 90, 4, true),
  (4, 'butterfly-effect', '나비효과로부터 지구를 지켜라', 'popup', 120, 90, 5, true)
on conflict (id) do update set
  code = excluded.code,
  title = excluded.title,
  category = excluded.category,
  base_points = excluded.base_points,
  max_bonus_points = excluded.max_bonus_points,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

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
    raise exception 'Booth not found' using errcode = 'P0002';
  end if;
  if p_bonus_points < 0 or p_bonus_points > v_mission.max_bonus_points then
    raise exception 'Invalid booth bonus' using errcode = '22023';
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
    format('부스 체험 완료 · %s', v_mission.title),
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

revoke all on function public.complete_mission(smallint, integer) from public, anon;
grant execute on function public.complete_mission(smallint, integer) to authenticated;
