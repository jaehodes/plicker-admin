# plink-admin

플링크 관리자 웹(Next.js). 발주·수행·문의, 대리점(건수·단가·정산), PC방 현황을 본다.

## 로컬 실행

Node 22.

```bash
npm ci
npm run dev -- -p 3100   # plink-api가 로컬에서 3000을 쓰므로 다른 포트로 띄운다
```

`.env.local`에 넣는 값:

| 변수 | 내용 |
|---|---|
| `PLINK_API_URL` | plink-api 주소 (예: `http://localhost:3000`) |
| `APP_ENV` | `development` / `production`. 쿠키 이름과 화면의 환경 표시를 정한다 |

계정은 plink-api의 관리자 계정(`admin_users`)으로 로그인한다. 계정은 plink-api CLI(`admin-account`)로 만든다.

## 확인과 배포

```bash
npx tsc --noEmit
npm run lint
npm run build
```

배포는 Docker 이미지로 한다: [docs/deploy/docker.md](docs/deploy/docker.md). 구조와 작업 규칙은 [CLAUDE.md](CLAUDE.md).
