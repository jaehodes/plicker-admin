# Docker 배포

공통 결정, GCP·서버 최초 설정, 배포 흐름은 모노리포 [docs/deploy.md](../../../docs/deploy.md).

| | dev | prod |
|---|---|---|
| 주소 | `https://plink-admin.funx.ai:8443` | `https://plink-admin.funx.ai` |
| 디렉터리 | `$HOME/plink/plink-admin/dev` | `$HOME/plink/plink-admin/prod` |
| compose 프로젝트 | `plink-admin-dev` | `plink-admin-prod` |
| `APP_ENV` | `development` | `production` |
| `PLINK_API_URL` | `https://plink-api.funx.ai:8443` | `https://plink-api.funx.ai` |
| 호스트 포트 (`127.0.0.1`만) | 3101 | 3100 |

## 환경변수

- `APP_ENV`: 쿠키 이름(`padmin-*` / `test-padmin-*`)과 화면의 환경 표시를 정한다. dev와 prod는 같은 도메인이라 쿠키를 함께 쓰므로(쿠키는 포트를 구분하지 않는다) 반드시 맞게 넣는다.
- `PLINK_API_URL`: plink-api 주소. 컨테이너에서 공인 도메인으로 호출한다. 보안그룹에서 443/8443을 특정 IP로만 열어 두었다면 서버 자신의 공인 IP도 허용해야 한다.
- `NEXT_PUBLIC_*`는 빌드할 때 코드에 고정되므로 환경별 값에 쓰지 않는다. `NEXT_PUBLIC_APP_VERSION`(화면 헤더의 버전)만 빌드할 때 git sha로 넣는다.
- `NODE_ENV=production`은 이미지에 들어 있다. 쿠키의 `secure`가 켜지므로 https로만 접속할 수 있다.

## 파일

- `Dockerfile`: `output: 'standalone'` 빌드. `TZ=Asia/Seoul`, `node` 사용자로 실행
- `deploy/compose.yml`: 서버용 compose (dev/prod 공용)
- `deploy/env.example`: 서버의 `.env` 예시
- `deploy/build-push.sh`: linux/amd64로 빌드해 Artifact Registry(`.../plink/plink-admin`)에 올리는 스크립트
- `deploy/nginx/plink-admin.conf`: nginx 설정

서버 디렉터리 구성:

```
$HOME/plink/plink-admin/<env>/
├── compose.yml   # deploy/compose.yml 복사
└── .env          # COMPOSE_PROJECT_NAME, APP_ENV, HOST_PORT, PLINK_API_URL, IMAGE, TAG
```

로그는 파일로 남기지 않고 stdout(docker 로그, 컨테이너당 10MB×3)만 쓴다.

## 최초 설정 (서버)

Artifact Registry 저장소와 서버의 `docker login`은 공통 설정을 그대로 쓴다.

```bash
mkdir -p $HOME/plink/plink-admin/{dev,prod}   # 홈 디렉터리 아래라 sudo가 필요 없다
```

로컬(Mac)에서 복사:

```bash
SERVER=ubuntu@<서버>   # scp 원격 경로(plink/...)는 서버 홈 디렉터리 기준
scp deploy/compose.yml $SERVER:plink/plink-admin/dev/compose.yml
scp deploy/env.example $SERVER:plink/plink-admin/dev/.env
scp deploy/compose.yml $SERVER:plink/plink-admin/prod/compose.yml
scp deploy/env.example $SERVER:plink/plink-admin/prod/.env
```

서버에서 `.env`를 환경에 맞게 수정한다(prod는 주석 처리된 prod 예시 값으로 바꾼다). 그다음 `docker compose up -d`를 실행하고, nginx는 [deploy/nginx/plink-admin.conf](../../deploy/nginx/plink-admin.conf) 상단의 설치 순서를 따른다.

## 배포

로컬(Mac)에서:

```bash
deploy/build-push.sh
# → IMAGE=..., TAG=<git-sha> 출력
```

서버에서:

```bash
cd $HOME/plink/plink-admin/dev          # 또는 prod
# .env의 TAG를 새 sha로 수정
docker compose pull
docker compose up -d
```

prod에는 dev에서 확인한 것과 같은 sha 태그를 쓴다. 롤백은 `TAG`를 이전 sha로 되돌리고 `up -d`를 실행하면 된다.

## 운영

```bash
docker compose ps
docker compose logs -f admin
```

## 참고

- 로그인 갱신 결과를 프로세스 메모리에서 잠시 공유하므로(`proxy.ts`) 환경마다 컨테이너는 1개만 띄운다.
- `next/font/google`은 빌드할 때 폰트를 내려받는다. 빌드하는 곳(로컬)에 인터넷 연결이 필요하다.
