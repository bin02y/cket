# Render 배포 가이드

CKET은 Vite로 빌드한 정적 웹앱이다. 저장소 루트의 `render.yaml`을 사용하면 Render Static Site 설정을 같은 값으로 재현할 수 있다.

## 1. 배포 전 확인

```cmd
npm ci
npm run typecheck
npm run build
```

- Node.js는 `.node-version`의 버전을 사용한다.
- 빌드 결과는 `dist`에 생성된다.
- `.env.local`은 Git에 포함하지 않는다.

## 2. Render Blueprint 생성

1. 프로젝트를 GitHub, GitLab 또는 Bitbucket 저장소에 올린다.
2. Render Dashboard에서 **New > Blueprint**를 선택한다.
3. 저장소 루트의 `render.yaml`을 불러온다.
4. 생성 화면에서 아래 두 값을 입력한다.

| 환경변수 | 값 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` 형식의 Publishable key |

두 값은 Vite 빌드 시 브라우저 번들에 포함되는 공개 연결 정보다. 데이터 보호는 Supabase RLS 정책이 담당한다. `sb_secret_...`, legacy `service_role`, Supabase Personal Access Token, SMTP 비밀번호는 절대 입력하지 않는다.

Blueprint는 다음 설정을 적용한다.

- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- SPA Rewrite: `/*` → `/index.html`
- Plan: Free Static Site

## 3. Supabase Auth URL 등록

배포가 끝나면 Supabase Dashboard의 **Authentication > URL Configuration**에서 다음을 설정한다.

- Site URL: `https://<render-service-name>.onrender.com`
- Redirect URL: `https://<render-service-name>.onrender.com/**`
- 로컬 검증용 Redirect URL: `http://127.0.0.1:4173/**`

이 프로젝트는 현장 체험을 위해 이메일 확인을 사용하지 않는다. 가입 즉시 로그인되지만 비밀번호 재설정 메일은 별도의 메일 전송 설정 없이는 운영 대상에 포함하지 않는다.

## 4. 배포 후 점검

- PC와 모바일에서 첫 화면이 열리고 가로 스크롤이 생기지 않는지 확인
- 회원가입 직후 홈으로 이동하는지 확인
- 미션 1~4 완료와 보너스 점수가 새로고침 후 유지되는지 확인
- ECO WALLET 거래 내역과 굿즈 교환 차감이 일치하는지 확인
- 환경 보호 실천 리포트가 사용자 데이터와 일치하는지 확인
- 로그아웃과 회원탈퇴가 정상 동작하는지 확인
- 브라우저 콘솔과 Render 배포 로그에 오류가 없는지 확인

## 5. 운영 배포 결과

- 운영 URL: `https://cket-ck.onrender.com`
- Render 서비스: `cket` Static Site
- Git 저장소: `https://github.com/bin02y/cket` (`main`, private)
- 빌드 명령: `npm ci && npm run build`
- Publish Directory: `dist`

2026-08-14 운영 환경에서 PC 1280×900과 모바일 390×844 접속, Supabase 즉시 가입, 미션 1~4, 친환경 선택 보너스, 640P 적립, 80P 굿즈 교환, 560P 잔액 복원, LEVEL 4 실천 리포트, 로그아웃·재로그인, 회원탈퇴 cascade 삭제를 확인했다. 테스트 계정과 연결 데이터는 검증 후 모두 삭제했다.
