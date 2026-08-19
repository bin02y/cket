-- Unify paid reward orders under a cash price and optionally apply ECO POINT
-- as a 1-won-per-point discount. The RPC rechecks and spends the balance
-- atomically with order creation and stock updates.

alter table public.reward_orders
  drop constraint if exists reward_orders_payment_amount_check,
  drop constraint if exists reward_orders_payment_method_check;

update public.reward_orders
set payment_method = 'cash'
where payment_method = 'points';

alter table public.reward_orders
  add constraint reward_orders_payment_method_check check (payment_method in ('cash', 'free')),
  add constraint reward_orders_payment_amount_check check (
    (payment_method = 'cash' and points_spent >= 0 and cash_paid >= 0 and (points_spent > 0 or cash_paid > 0))
    or (payment_method = 'free' and points_spent = 0 and cash_paid = 0)
  );

drop function if exists public.redeem_reward(text, text);

create or replace function public.redeem_reward(p_reward_id text, p_points_to_use integer default 0)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reward public.rewards%rowtype;
  v_balance integer := 0;
  v_completed_stamps integer;
  v_required_stamps integer := 0;
  v_max_discount_points integer := 0;
  v_order_id uuid;
  v_pickup_code text;
  v_payment_method text := 'cash';
  v_points_spent integer := 0;
  v_cash_paid integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_points_to_use is null or p_points_to_use < 0 then
    raise exception 'Invalid point discount' using errcode = '22023';
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

  if v_reward.cash_price = 0 and v_reward.points = 0 then
    if p_points_to_use <> 0 then
      raise exception 'Point discount unavailable' using errcode = '22023';
    end if;
    v_payment_method := 'free';
    if exists (
      select 1 from public.reward_orders
      where user_id = v_user_id
        and reward_id = p_reward_id
        and payment_method = 'free'
        and status <> 'cancelled'
    ) then
      return jsonb_build_object('status', 'already_claimed');
    end if;
  else
    if v_reward.cash_price <= 0 then
      raise exception 'Cash payment unavailable' using errcode = '22023';
    end if;

    v_max_discount_points := v_reward.cash_price;
    if p_points_to_use > v_max_discount_points then
      raise exception 'Invalid point discount' using errcode = '22023';
    end if;

    perform 1 from public.profiles where id = v_user_id for update;
    select coalesce(sum(amount), 0)::integer into v_balance
    from public.point_transactions
    where user_id = v_user_id;

    if v_balance < p_points_to_use then
      return jsonb_build_object('status', 'insufficient', 'shortage', p_points_to_use - v_balance);
    end if;

    v_points_spent := p_points_to_use;
    v_cash_paid := v_reward.cash_price - v_points_spent;
  end if;

  v_pickup_code := 'ECO-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.reward_orders (user_id, reward_id, points_spent, cash_paid, payment_method, pickup_code)
  values (v_user_id, v_reward.id, v_points_spent, v_cash_paid, v_payment_method, v_pickup_code)
  returning id into v_order_id;

  if v_points_spent > 0 then
    insert into public.point_transactions (user_id, kind, amount, source, title, description, reward_id, reward_order_id)
    values (v_user_id, 'spend', -v_points_spent, 'reward', '굿즈 구매 할인 · ' || v_reward.name, '수령 코드 ' || v_pickup_code, v_reward.id, v_order_id);
  end if;

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = v_reward.id;
  end if;

  return jsonb_build_object(
    'status', 'success',
    'order_id', v_order_id,
    'pickup_code', v_pickup_code,
    'payment_method', v_payment_method,
    'points_spent', v_points_spent,
    'cash_paid', v_cash_paid
  );
end;
$$;

revoke all on function public.redeem_reward(text, integer) from public, anon;
grant execute on function public.redeem_reward(text, integer) to authenticated;
