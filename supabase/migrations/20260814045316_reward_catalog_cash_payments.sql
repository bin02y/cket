-- 파일 시간 번호는 원격 마이그레이션 기록과 일치합니다.
alter table public.rewards
  add column if not exists cash_price integer not null default 0;

alter table public.rewards drop constraint if exists rewards_points_check;
alter table public.rewards add constraint rewards_points_check check (points >= 0);
alter table public.rewards add constraint rewards_cash_price_check check (cash_price >= 0);

alter table public.rewards drop constraint if exists rewards_category_check;
update public.rewards
set category = case
  when category = 'event' then 'tech'
  when category = 'upcycle' then 'lifestyle'
  else category
end;
alter table public.rewards add constraint rewards_category_check check (category in ('tech', 'lifestyle', 'limited'));

alter table public.reward_orders
  add column if not exists payment_method text not null default 'points',
  add column if not exists cash_paid integer not null default 0;

alter table public.reward_orders alter column points_spent set default 0;
alter table public.reward_orders drop constraint if exists reward_orders_points_spent_check;
alter table public.reward_orders add constraint reward_orders_points_spent_check check (points_spent >= 0);
alter table public.reward_orders add constraint reward_orders_cash_paid_check check (cash_paid >= 0);
alter table public.reward_orders add constraint reward_orders_payment_method_check check (payment_method in ('points', 'cash', 'free'));
alter table public.reward_orders add constraint reward_orders_payment_amount_check check (
  (payment_method = 'points' and points_spent > 0 and cash_paid = 0)
  or (payment_method = 'cash' and points_spent = 0 and cash_paid > 0)
  or (payment_method = 'free' and points_spent = 0 and cash_paid = 0)
);

create unique index if not exists reward_orders_one_free_claim_idx
  on public.reward_orders (user_id, reward_id)
  where payment_method = 'free' and status <> 'cancelled';

update public.rewards set is_active = false;

insert into public.rewards (id, name, subtitle, description, category, points, cash_price, stock, is_active)
values
  ('cycle-parts-keyring', '냉동사이클 부품 키링', '네 가지 공조 부품을 모으는 컬렉션', '압축기, 응축기, 팽창밸브, 증발기를 캐릭터처럼 디자인한 4종 컬렉션입니다.', 'tech', 250, 2500, null, true),
  ('mini-thermometer-keyring', '미니 온도계 키링', '언제든 온도를 확인하는 작은 도구', '실제 온도를 확인할 수 있는 실용적인 디지털 또는 아날로그 온도계 키링입니다.', 'tech', 200, 2000, null, true),
  ('thermo-sticker', '변온 스티커', '온도에 따라 색이 변하는 체험 굿즈', '냉장고, 텀블러, 휴대폰 등에 붙여 온도 변화를 색으로 관찰하는 스티커입니다.', 'tech', 150, 1500, null, true),
  ('eco-tumbler', '친환경 텀블러 또는 리유저블 컵', '시원함은 오래, 일회용품은 적게', 'KTX와 냉동사이클 그래픽을 담은 다회용 텀블러 또는 리유저블 컵입니다.', 'lifestyle', 600, 6000, null, true),
  ('acrylic-cycle-keyring', '투명 아크릴 냉동사이클 키링', '냉매의 흐름을 담은 투명 그래픽', '파이프를 따라 이동하는 냉매의 상태 변화를 파란색과 빨간색 그래픽으로 표현했습니다.', 'tech', 300, 3000, null, true),
  ('esg-photo-cards', 'ESG 체험 카드 / 포토카드', '공조 캐릭터와 환경 상식을 모으는 카드', '앞면에는 냉동공조 캐릭터를, 뒷면에는 환경 행동과 짧은 상식을 담은 무료 카드입니다.', 'limited', 0, 0, null, true),
  ('recycled-plastic-pen', '재생 플라스틱 볼펜', '학교와 일상에서 이어가는 ESG 습관', '폐플라스틱과 재생 소재를 활용해 만든 실용적인 볼펜입니다.', 'lifestyle', 100, 1000, null, true),
  ('mini-eco-pouch', '미니 에코백 / 파우치', '냉동사이클 회로도를 담은 데일리 파우치', '문구류와 충전기를 담을 수 있고 냉동사이클 회로도 패턴을 적용한 파우치입니다.', 'lifestyle', 400, 4000, null, true),
  ('cooling-character-badges', '냉동공조 캐릭터 뱃지 세트', '부품의 역할을 표현한 네 캐릭터', '압축기, 응축기, 팽창밸브, 증발기의 역할을 캐릭터로 만든 무료 뱃지 세트입니다.', 'limited', 0, 0, null, true),
  ('cooling-master-medal', '한정판 Cooling Master 카드 / 메달', '다섯 부스를 완주한 참가자의 수료 인증', '다섯 스탬프를 모두 모아 ECO PASSPORT를 발급한 참가자 전용 무료 리워드입니다.', 'limited', 0, 0, null, true)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  description = excluded.description,
  category = excluded.category,
  points = excluded.points,
  cash_price = excluded.cash_price,
  stock = excluded.stock,
  is_active = excluded.is_active,
  updated_at = now();

drop function if exists public.redeem_reward(text);

create function public.redeem_reward(p_reward_id text, p_payment_method text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reward public.rewards%rowtype;
  v_balance integer;
  v_completed_stamps integer;
  v_required_stamps integer := 0;
  v_order_id uuid;
  v_pickup_code text;
  v_points_spent integer := 0;
  v_cash_paid integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_payment_method is null or p_payment_method not in ('points', 'cash', 'free') then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;

  select * into v_reward
  from public.rewards
  where id = p_reward_id and is_active = true
  for update;

  if not found then
    raise exception 'Reward not found' using errcode = 'P0002';
  end if;
  if v_reward.stock is not null and v_reward.stock <= 0 then
    raise exception 'Reward out of stock' using errcode = 'P0001';
  end if;

  if p_reward_id = 'cooling-character-badges' then
    v_required_stamps := 1;
  elsif p_reward_id = 'cooling-master-medal' then
    v_required_stamps := 5;
  end if;

  if v_required_stamps > 0 then
    select count(*)::integer into v_completed_stamps
    from public.user_missions
    where user_id = v_user_id and status = 'completed';

    if v_completed_stamps < v_required_stamps then
      return jsonb_build_object('status', 'locked', 'required_stamps', v_required_stamps);
    end if;
  end if;

  if p_payment_method = 'points' then
    if v_reward.points <= 0 then
      raise exception 'Points payment unavailable' using errcode = '22023';
    end if;

    perform 1 from public.profiles where id = v_user_id for update;
    select coalesce(sum(amount), 0)::integer into v_balance
    from public.point_transactions
    where user_id = v_user_id;

    if v_balance < v_reward.points then
      return jsonb_build_object('status', 'insufficient', 'shortage', v_reward.points - v_balance);
    end if;
    v_points_spent := v_reward.points;
  elsif p_payment_method = 'cash' then
    if v_reward.cash_price <= 0 then
      raise exception 'Cash payment unavailable' using errcode = '22023';
    end if;
    v_cash_paid := v_reward.cash_price;
  else
    if v_reward.points <> 0 or v_reward.cash_price <> 0 then
      raise exception 'Free claim unavailable' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.reward_orders
      where user_id = v_user_id
        and reward_id = p_reward_id
        and payment_method = 'free'
        and status <> 'cancelled'
    ) then
      return jsonb_build_object('status', 'already_claimed');
    end if;
  end if;

  v_pickup_code := 'ECO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.reward_orders (user_id, reward_id, points_spent, cash_paid, payment_method, pickup_code)
  values (v_user_id, v_reward.id, v_points_spent, v_cash_paid, p_payment_method, v_pickup_code)
  returning id into v_order_id;

  if p_payment_method = 'points' then
    insert into public.point_transactions (user_id, kind, amount, source, title, description, reward_id, reward_order_id)
    values (v_user_id, 'spend', -v_points_spent, 'reward', '리워드 교환 · ' || v_reward.name, '수령 코드 ' || v_pickup_code, v_reward.id, v_order_id);
  end if;

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = v_reward.id;
  end if;

  return jsonb_build_object(
    'status', 'success',
    'order_id', v_order_id,
    'pickup_code', v_pickup_code,
    'payment_method', p_payment_method,
    'points_spent', v_points_spent,
    'cash_paid', v_cash_paid
  );
end;
$$;

revoke all on function public.redeem_reward(text, text) from public, anon;
grant execute on function public.redeem_reward(text, text) to authenticated;
