# Eco Express Supabase 운영 설정

PHASE 7에서 `carrier` 프로젝트에 데이터베이스 마이그레이션과 `delete-account` Edge Function을 적용했다. 프런트엔드는 `.env.local`에 프로젝트 URL과 브라우저 공개용 publishable key가 있을 때 Supabase Auth를 사용하고, 값이 없으면 체험용 메모리 인증으로 안전하게 폴백한다.

## 1. 적용된 데이터 구조

- `profiles`: Auth 사용자와 1:1로 연결되는 참가자 프로필, ECO XP/LEVEL
- `missions`: 미션 1~4 기준 정보
- `user_missions`: 사용자별 미션 완료와 보너스 점수
- `point_transactions`: 적립·사용 원장
- `rewards`: 굿즈 상품과 재고
- `reward_orders`: 굿즈 교환 및 수령 코드

`complete_mission`과 `redeem_reward` RPC는 포인트 중복 지급과 잔액 경쟁 조건을 막기 위해 하나의 데이터베이스 트랜잭션 안에서 처리한다. 두 함수는 의도적으로 `security definer`이며 다음 방어를 적용했다.

- `PUBLIC`과 `anon` 실행 권한 제거
- `authenticated` 역할에만 실행 허용
- 함수 내부에서 `auth.uid()`가 없으면 즉시 거부
- 고정된 빈 `search_path`
- 미션당 적립 거래 unique partial index
- 굿즈 행 잠금과 서버 계산 잔액 확인

## 2. 로컬 환경변수

`.env.example`을 복사해 `.env.local`을 만든다. 프런트엔드에는 publishable key만 사용한다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`service_role`과 Supabase Personal Access Token은 `VITE_` 변수나 Git 저장소에 절대 넣지 않는다.

## 3. Auth URL 설정

Supabase Dashboard → Authentication → URL Configuration에서 다음을 등록한다.

- Site URL: 운영 Render URL
- Redirect URLs: `http://127.0.0.1:4173/**` 및 Render URL `/**`

회원가입 시 `display_name`만 사용자 메타데이터로 전달한다. RLS 권한 판정에는 수정 가능한 `user_metadata`를 사용하지 않고 오직 `auth.uid()`만 사용한다.

## 4. 이메일 확인 없는 현장 가입

현장 체험의 복잡도를 낮추기 위해 이메일 확인 메일과 Custom SMTP를 사용하지 않는다. 가입 성공 시 Supabase가 즉시 세션을 반환하며 참가자는 바로 미션 화면으로 이동한다.

원격 `carrier` 프로젝트에 설정할 때 프로젝트 루트의 CMD에서 다음 파일을 실행하고 Supabase Personal Access Token 하나만 입력한다.

```cmd
scripts\disable-email-confirmation.cmd
```

이 설정은 Management API의 `mailer_autoconfirm=true`를 적용한다. 이메일 소유권을 확인하지 않으므로 공개 배포 전에는 CAPTCHA, 가입 속도 제한 등 별도의 악용 방지 수단을 검토해야 한다. 비밀번호 재설정 기능을 추가하려면 메일 전송 구성이 다시 필요하다.

## 5. 배포 및 검증 명령

Supabase CLI가 정상 설치된 환경에서 다음 순서로 실행한다.

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy delete-account --verify-jwt
supabase db lint
```

2026년 Data API 변경에 대비해 필요한 테이블 권한은 마이그레이션에서 명시적으로 `authenticated`에 부여했고, 모든 public 테이블에 RLS를 활성화했다.

## 6. 현장 운영 전 확인

- 서로 다른 두 참가자가 상대방의 `profiles`, `user_missions`, `point_transactions`, `reward_orders`를 조회할 수 없는지 확인
- 미션 완료 RPC를 두 번 호출해 두 번째 지급액이 0인지 확인
- 잔액보다 비싼 굿즈 교환이 `insufficient`로 반환되는지 확인
- 회원탈퇴 후 `auth.users`와 cascade 연결 데이터가 모두 제거되는지 확인
- Supabase Security/Performance Advisors에서 새 오류가 없는지 확인

PHASE 8에서 실제 로그인 사용자의 미션·지갑·교환 상태를 이 테이블과 RPC로 전환했다. 프로필과 포인트 거래는 병렬로 불러오며, 미션 완료와 굿즈 교환은 서버 RPC 성공 후 DB 상태를 다시 조회한다. 새로고침 세션 유지, 미션 3·4 보너스 각 90 P 저장, 굿즈 교환 차감과 수령 코드, 회원탈퇴 cascade 삭제까지 실제 테스트 계정으로 검증했다. 모든 참가자 활동은 회원가입 또는 로그인 후 Supabase에 저장된다.
