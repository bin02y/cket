-- Retire the legacy booth-mission reward path. Existing mission history and
-- previously awarded points remain intact; future points can only be claimed
-- through public.claim_roadview_gate(text).

update public.missions
set is_active = false
where is_active = true;

revoke all on function public.complete_mission(smallint, integer)
from public, anon, authenticated;

drop function public.complete_mission(smallint, integer);
