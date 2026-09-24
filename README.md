# record a record

혼자 쓰는 음악 디깅 블로그. 곡을 검색하면 Spotify에서 아티스트/앨범커버를,
Genius에서 가사를 자동으로 불러온다. 글쓰기는 모달 하나로 끝.

- **글쓰기/수정/삭제**: GitHub OAuth, 지정한 계정(`ALLOWED_GITHUB_LOGIN`)만 가능
- **공개 범위**: 글마다 공개/비공개 선택. 공개 글은 로그인 없이 누구나 링크로 볼 수 있음 (피드도 공개 글만 노출)
- **태그**: 글쓰기 모달에서 자유롭게 태그 지정, 태그 클릭 시 해당 태그 글만 필터링
- **앨범 보기**: `/albums`에서 기록한 곡들을 앨범 단위로 모아봄. 앨범 상세(`/album/[spotifyAlbumId]`)는 Spotify에서 전체 트랙리스트를 불러와 몇 곡을 기록했는지 보여주고, 안 쓴 트랙은 바로 "기록하기"로 이어짐 (앨범 통으로 듣기를 돕는 용도)
- **DB**: SQLite (`prisma/dev.db`), Prisma 7 + better-sqlite3 드라이버 어댑터
- **곡 검색**: Spotify Web API (Client Credentials)
- **가사**: Genius API로 검색 후 가사 페이지 파싱, 실패 시 직접 입력

## 시작하기

### 1. 환경변수 설정

`.env.example`을 참고해 `.env`에 값을 채운다.

**GitHub OAuth App** — https://github.com/settings/developers → New OAuth App
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`에 값 입력
- `ALLOWED_GITHUB_LOGIN`에 본인 GitHub 아이디(로그인 계정명) 입력
- GitHub OAuth App은 Callback URL을 하나만 등록하는 게 안전하니, 배포용(record.gongran.studio)은 별도 OAuth App을 새로 만들어서 쓰는 걸 추천

**Spotify** — https://developer.spotify.com/dashboard → Create app
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`에 값 입력 (Redirect URI는 아무거나 넣어도 됨, Client Credentials 플로우라 실제로 쓰이지 않음)

**Genius** — https://genius.com/api-clients → New API Client
- 발급받은 Client Access Token을 `GENIUS_ACCESS_TOKEN`에 입력

**AUTH_SECRET**은 이미 개발용 값이 채워져 있음. 배포 시에는 `openssl rand -base64 32`로 새로 생성해서 교체할 것.

### 2. 실행

```bash
npm install
npx prisma migrate dev   # 최초 1회, DB 스키마 적용
npm run dev
```

http://localhost:3000 접속 → GitHub 로그인 → 오른쪽 아래 `+` 버튼으로 첫 기록 작성.

## 구조

- `app/(app)/` — 피드, 글 상세 페이지. `layout.tsx`에 헤더 + (로그인 시에만) 글쓰기 버튼
- `app/login/` — 로그인 페이지
- `app/api/spotify`, `app/api/genius` — 외부 API 프록시 (로그인 필요, 글쓰기 모달 전용)
- `app/api/posts` — 글 CRUD (쓰기/수정/삭제는 로그인 필요)
- `app/(app)/albums/`, `app/(app)/album/[id]/` — 앨범 목록 / 앨범별 트랙리스트 + 기록 현황
- `components/PostModal.tsx` — 곡 검색 → 자동완성 → 태그/공개여부 → 글쓰기까지 하는 모달 (작성/수정 공용, `initialTrack`으로 특정 트랙을 미리 채워 열 수도 있음)
- `components/LogTrackButton.tsx` — 앨범 트랙리스트에서 안 쓴 곡을 바로 기록하는 버튼
- `lib/spotify.ts`, `lib/genius.ts` — 외부 API 클라이언트
- `lib/tags.ts` — 태그 대소문자 중복 제거 + upsert 헬퍼
- `lib/albums.ts` — 로컬 글들을 `spotifyAlbumId` 기준으로 앨범별로 묶는 헬퍼
- `prisma/schema.prisma` — `Post`(곡 정보 + 가사 + 본인 글 + 공개여부 + 앨범 ID), `Tag` 모델
- `proxy.ts` (구 middleware) — `/`, `/post/*`, `/albums`, `/album/*`, `/login`은 누구나 접근 가능. 그 외(글쓰기 API 등)는 로그인 필요, API는 401로 막음. 비공개 글 접근 차단은 각 페이지 컴포넌트에서 처리
- `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` — Docker 배포용 (아래 "배포" 참고)

## 배포 (Docker)

로컬(또는 CI)에서 이미지 빌드 → Docker Hub에 push → 서버에서 pull해서 실행하는 흐름.
SQLite 파일은 컨테이너 안이 아니라 named volume(`/data`)에 저장되니 이미지를 새로 올려도 글은 안 날아감.
컨테이너는 시작할 때 `docker-entrypoint.sh`가 `prisma migrate deploy`를 먼저 돌리고 서버를 띄우므로,
스키마가 바뀐 새 이미지를 올려도 마이그레이션이 자동으로 적용됨.

### 1. 빌드 & 푸시 (로컬)

Mac(Apple Silicon = arm64)에서 그냥 `docker build`만 하면 arm64 이미지만 만들어져서,
amd64 서버에서 pull할 때 `no matching manifest` 에러가 남. `buildx`로 amd64+arm64를 한 번에 빌드해서 push:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t jyhyun1008/record-a-record:latest --push .
```

(colima를 쓰는 경우 amd64 빌드는 에뮬레이션이라 느리고 메모리를 많이 먹음 — OOM으로 빌드가 죽으면
`colima stop && colima start --cpu 4 --memory 6`으로 리소스를 늘려서 재시도)

### 2. 서버에서 실행

`docker-compose.yml`과 `.env.production.example`을 서버로 복사(`scp` 등)한 뒤:

```bash
cp .env.production.example .env.production
# .env.production 채우기: AUTH_SECRET(openssl rand -base64 32로 새로 생성),
# AUTH_URL(실제 도메인, 예: https://record.gongran.studio — 없으면 로그인 시
#   error=Configuration 뜨거나 0.0.0.0:3000으로 리디렉션될 수 있음),
# AUTH_GITHUB_ID/SECRET, ALLOWED_GITHUB_LOGIN, SPOTIFY_*, GENIUS_ACCESS_TOKEN

docker compose up -d
```

컨테이너는 `127.0.0.1:3002`에만 바인딩됨(외부에서 3002로 직접 못 들어옴, nginx를 통해서만 접근).
`nginx/record.gongran.studio.conf`를 서버의 nginx 설정으로 넣고 certbot으로 HTTPS 붙이면 됨:

```bash
sudo cp nginx/record.gongran.studio.conf /etc/nginx/sites-available/record.gongran.studio.conf
sudo ln -s /etc/nginx/sites-available/record.gongran.studio.conf /etc/nginx/sites-enabled/record.gongran.studio.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d record.gongran.studio
```

GitHub OAuth App의 Callback URL은 `https://record.gongran.studio/api/auth/callback/github`로 등록.

업데이트할 때는:
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t jyhyun1008/record-a-record:latest --push .
# 서버에서
docker compose pull && docker compose up -d
```

### 다른 방법 (Docker를 안 쓴다면)

Vercel에 올릴 경우 SQLite 파일이 매 배포마다 초기화되므로(서버리스 파일시스템은 read-only에 가까움),
Turso(LibSQL)나 Fly.io처럼 파일이 유지되는 환경이 필요함.
`lib/prisma.ts`의 어댑터를 `@prisma/adapter-libsql`로 바꾸면 Turso로 전환 가능 (스키마 변경 없음).
