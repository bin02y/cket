-- 기존 주문 내역의 외래 키를 보존하면서 현재 판매 상품만 8종으로 교체합니다.
update public.rewards
set is_active = false,
    updated_at = now();

insert into public.rewards (id, name, subtitle, description, category, points, cash_price, stock, is_active)
values
  ('cycle-parts-keyring', '냉동사이클 부품 키링', '네 가지 공조 부품을 모으는 컬렉션', '압축기, 응축기, 팽창밸브, 증발기를 캐릭터처럼 디자인한 4종 컬렉션입니다.', 'tech', 250, 2500, null, true),
  ('thermo-sticker', '변온 스티커', '온도에 따라 색이 변하는 체험 굿즈', '냉장고, 텀블러, 휴대폰 등에 붙여 온도 변화를 색으로 관찰하는 스티커입니다.', 'tech', 150, 1500, null, true),
  ('eco-tumbler', '친환경 텀블러 또는 리유저블 컵', '시원함은 오래, 일회용품은 적게', 'KTX나 냉동사이클 그래픽을 적용한 재사용 가능 텀블러 또는 리유저블 컵입니다.', 'lifestyle', 600, 6000, null, true),
  ('recycled-plastic-pen', '재생 플라스틱 볼펜', '학교와 일상에서 이어가는 ESG 습관', '폐플라스틱과 재생 소재를 활용해 만든 실용적인 볼펜입니다.', 'lifestyle', 100, 1000, null, true),
  ('mini-eco-pouch', '미니 에코백 / 파우치', '냉동사이클 회로도를 담은 데일리 파우치', '문구류와 충전기를 담을 수 있고 냉동사이클 회로도 패턴을 적용한 파우치입니다.', 'lifestyle', 400, 4000, null, true),
  ('cooling-keycap', '냉동공조 키캡', '냉동사이클 요소를 담은 컬렉션 키캡', '압축기, 응축기, 팽창밸브, 증발기와 냉동공조 요소를 디자인한 컬렉션 키캡입니다.', 'tech', 200, 2000, null, true),
  ('eco-power-bank', '친환경 보조배터리', '일상에서 오래 사용하는 상위 등급 리워드', 'Green Rail과 에너지 절약 그래픽을 적용한 실용적인 친환경 보조배터리입니다.', 'lifestyle', 800, 8000, null, true),
  ('mini-fan', '미니 선풍기', '냉방과 바람을 손안에서 느끼는 실용 굿즈', '휴대용 또는 탁상용으로 사용하는 Green Rail 냉동공조 디자인 미니 선풍기입니다.', 'lifestyle', 500, 5000, null, true)
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
