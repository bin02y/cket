-- Covers foreign keys reported by the Supabase performance advisor.
create index if not exists point_transactions_reward_id_idx
  on public.point_transactions (reward_id)
  where reward_id is not null;

create index if not exists point_transactions_reward_order_id_idx
  on public.point_transactions (reward_order_id)
  where reward_order_id is not null;
