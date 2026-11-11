# plink-admin

플링크 관리자 웹(Next.js 16 App Router, Tailwind 4). 화면은 Server Component와 페이지별 Server Action(`app/<경로>/actions.ts`)이 plink-api `/api/admin-app/*`(`PLINK_API_URL`)를 부른다. 브라우저가 부르는 `/api`는 healthcheck(`/api/alive`)뿐이다. 전체 구조·프로젝트 간 결정은 상위 [../CLAUDE.md](../CLAUDE.md).

## 실행·확인

- 로컬 실행과 환경변수는 [README.md](README.md). plink-api가 로컬 3000을 쓰므로 `npm run dev -- -p 3100`으로 띄운다.
- 확인: `npx tsc --noEmit`, `npm run lint`, `npm run build`. 테스트 코드는 없다.
- 배포: [docs/deploy/docker.md](docs/deploy/docker.md).

## 구조

**화면** (메뉴는 `app/components/Sidebar.tsx`, 모든 메뉴가 모든 관리자에게 보인다)

| 묶음 | 경로 | 결정 문서 |
|---|---|---|
| 운영 현황 | `/dashboard`, `/orders`, `/places`, `/quizzes`, `/executions`, `/reports`(문의) | [stats.md](../docs/stats.md) |
| 콘텐츠·회원 | `/notices`, `/faq`, `/users`(수행자) | |
| 대리점 | `/agencies`, `/balance-events`(건수 원장), `/order-prices`(플랫폼 단가), `/order-settlement` | [balance.md](../docs/balance.md), [settlement.md](../docs/settlement.md) |
| PC방 | `/pcbangs`, `/pcbang-stats`, `/pcbang-settlement` (읽기 전용) | [pcbang.md](../docs/pcbang.md) |

- 메뉴에 없는 `/reviews`가 있다(제목이 "수행 목록"으로 `/executions`와 같다).

**공통**
- plink-api 호출: `app/lib/external-api.ts` `externalApiFetch`. 쿠키의 access token을 붙이고, 401이면 `/login`으로 보낸다. 실패 응답의 `code`를 돌려준다.
- 인증: `proxy.ts`(모든 페이지의 토큰 확인·갱신), `app/lib/auth-actions.ts`(로그인 Server Action), `app/lib/admin-auth.ts`, `app/lib/auth-server.ts` `requireAuth`. 결정은 [../docs/auth.md](../docs/auth.md).
- 타입: `app/types/<도메인>.ts`(plink-api 응답 형식). 유틸: `app/utils/base64Utils.ts`, `kstDate.ts`, `cookieName.ts`.

## 규칙·주의

- **plink-api 오류의 상태 코드와 `code`를 화면까지 넘긴다.** 대리점 화면이 `INSUFFICIENT_BALANCE` 같은 `code`로 안내를 나눈다(`app/agencies/actions.ts`, [../docs/balance.md](../docs/balance.md) "프로젝트 사이 규칙").
- 건수를 옮기는 요청(적립·회수·전환·조정)은 버튼을 누를 때 `requestId`를 한 번 만들고 재시도에 같은 값을 보낸다.
- **날짜는 KST 고정 문자열로 찍는다.** `formatDateTime`(`app/types/agency.ts`)과 `app/utils/kstDate.ts`를 쓴다. `toLocaleString`은 서버(UTC)와 브라우저가 달라 hydration 오류가 나고 시간대도 어긋난다. 공지·수행·회원 화면(`NoticesClient`, `ExecutionsClient`, `ExecutionDetailModal`, `UsersClient`)에는 아직 `toLocaleString` 날짜 표시가 남아 있다.
- 일부 문자열(이름·memo 등)은 plink-api와 base64로 주고받는다(`app/utils/base64Utils.ts`).
- 환경 구분은 서버 환경변수 `APP_ENV`로 한다. `NEXT_PUBLIC_*`는 쓰지 않는다(`NEXT_PUBLIC_APP_VERSION`만 예외).
- role(super/staff)별 권한 제한은 없다. 모든 관리자가 모든 화면을 본다.
- PC방 정산 단가(PC방 10원, 파트너사·개발사 2.5원)는 `app/pcbang-settlement/PcbangSettlementClient.tsx` 상수다. 지급 근거로 쓰게 되면 DB로 옮긴다([../docs/pcbang.md](../docs/pcbang.md)).
- 환경마다 컨테이너는 1개다. `proxy.ts`가 토큰 갱신 결과를 프로세스 메모리에서 공유한다.

## 관련 문서

- plink-api API: [../plink-api/docs/admin-app/](../plink-api/docs/admin-app/)
- 기능 결정: [../docs/](../docs/) (auth, balance, settlement, stats, pcbang)
