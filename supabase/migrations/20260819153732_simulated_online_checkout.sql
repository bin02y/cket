-- Store shipping details and the selected method for an online-style simulated checkout.
-- No external payment provider is called; payment_status explicitly records the simulation.

alter table public.reward_orders
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists postal_code text,
  add column if not exists shipping_address text,
  add column if not exists shipping_address_detail text,
  add column if not exists payment_status text not null default 'legacy';

alter table public.reward_orders
  alter column payment_status set default 'simulated_paid',
  drop constraint if exists reward_orders_payment_amount_check,
  drop constraint if exists reward_orders_payment_method_check,
  drop constraint if exists reward_orders_payment_status_check,
  drop constraint if exists reward_orders_status_check;

alter table public.reward_orders
  add constraint reward_orders_payment_method_check check (
    payment_method in ('cash', 'free', 'card', 'kakao_pay', 'naver_pay', 'bank_transfer')
  ),
  add constraint reward_orders_payment_amount_check check (
    (payment_method = 'free' and points_spent = 0 and cash_paid = 0)
    or (
      payment_method <> 'free'
      and points_spent >= 0
      and cash_paid >= 0
      and (points_spent > 0 or cash_paid > 0)
    )
  ),
  add constraint reward_orders_payment_status_check check (
    payment_status in ('legacy', 'simulated_paid', 'refunded', 'cancelled')
  ),
  add constraint reward_orders_status_check check (
    status in ('requested', 'ready', 'picked_up', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')
  );

drop function if exists public.redeem_reward(text, integer);

create function public.redeem_reward(
  p_reward_id text,
  p_points_to_use integer,
  p_recipient_name text,
  p_recipient_phone text,
  p_postal_code text,
  p_shipping_address text,
  p_shipping_address_detail text,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_reward public.rewards%rowtype;
  v_balance integer := 0;
  v_max_discount_points integer := 0;
  v_order_id uuid;
  v_internal_order_code text;
  v_payment_method text := p_payment_method;
  v_points_spent integer := 0;
  v_cash_paid integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_points_to_use is null or p_points_to_use < 0 then
    raise exception 'Invalid point discount' using errcode = '22023';
  end if;
  if nullif(btrim(p_recipient_name), '') is null
    or nullif(btrim(p_recipient_phone), '') is null
    or nullif(btrim(p_postal_code), '') is null
    or nullif(btrim(p_shipping_address), '') is null
    or length(btrim(p_recipient_name)) > 50
    or length(btrim(p_recipient_phone)) > 20
    or length(btrim(p_postal_code)) > 20
    or length(btrim(p_shipping_address)) > 200
    or length(btrim(coalesce(p_shipping_address_detail, ''))) > 200
    or btrim(p_recipient_phone) !~ '^[0-9+() -]{9,20}$'
  then
    raise exception 'Invalid shipping details' using errcode = '22023';
  end if;
  if nullif(btrim(p_payment_method), '') is null
    or p_payment_method not in ('card', 'kakao_pay', 'naver_pay', 'bank_transfer')
  then
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

  v_internal_order_code := 'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.reward_orders (
    user_id,
    reward_id,
    points_spent,
    cash_paid,
    payment_method,
    payment_status,
    pickup_code,
    status,
    recipient_name,
    recipient_phone,
    postal_code,
    shipping_address,
    shipping_address_detail
  )
  values (
    v_user_id,
    v_reward.id,
    v_points_spent,
    v_cash_paid,
    v_payment_method,
    'simulated_paid',
    v_internal_order_code,
    'paid',
    btrim(p_recipient_name),
    btrim(p_recipient_phone),
    btrim(p_postal_code),
    btrim(p_shipping_address),
    btrim(coalesce(p_shipping_address_detail, ''))
  )
  returning id into v_order_id;

  if v_points_spent > 0 then
    insert into public.point_transactions (user_id, kind, amount, source, title, description, reward_id, reward_order_id)
    values (v_user_id, 'spend', -v_points_spent, 'reward', '굿즈 구매 할인 · ' || v_reward.name, v_points_spent || 'P 할인', v_reward.id, v_order_id);
  end if;

  if v_reward.stock is not null then
    update public.rewards set stock = stock - 1 where id = v_reward.id;
  end if;

  return jsonb_build_object(
    'status', 'success',
    'order_id', v_order_id,
    'payment_method', v_payment_method,
    'points_spent', v_points_spent,
    'cash_paid', v_cash_paid
  );
end;
$$;

revoke all on function public.redeem_reward(text, integer, text, text, text, text, text, text) from public, anon;
grant execute on function public.redeem_reward(text, integer, text, text, text, text, text, text) to authenticated;
