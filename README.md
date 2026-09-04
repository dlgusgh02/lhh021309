# FoodCost Lab

식재료 가격과 레시피를 입력하면 메뉴별 총 원가, 1인분 원가, 원가율, 예상 매출총이익과 목표 수익에 따른 적정 판매가격을 자동 계산해주는 음식 원가 관리 SaaS MVP.

PRD/TRD 기준 문서는 프로젝트 루트의 대화 기록을 참고 (계산 로직 정확성이 최우선 목표).

## 기술 스택

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (Postgres + Auth + RLS) · Zod · React Hook Form · Vitest

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 연결

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. `supabase/schema.sql`의 전체 내용을 Supabase SQL Editor에서 실행 (테이블, RLS 정책, 회원가입 시 프로필+기본 매장 자동 생성 트리거까지 포함)
3. (선택) `supabase/seed_master_ingredients.sql` 실행 — 공용 재료 목록에 이름/카테고리/단위만 채워진 시작 데이터를 넣습니다 (가격은 비어있음, 아래 KAMIS 연동으로 채움)
4. `.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트의 URL/키를 채워넣기 (Project Settings → API)

### (선택) KAMIS 공용 재료 가격 연동

식재료 등록 화면의 "공용 재료에서 가져오기"에 실제 시세를 채우려면:

1. [kamis.or.kr](https://www.kamis.or.kr)에서 회원가입 후 Open-API 신청 → `KAMIS_CERT_KEY`/`KAMIS_CERT_ID` 발급
2. `src/lib/kamis/item-map.ts`에 실제 품목코드/품종코드/부류코드 채우기 (해당 파일 주석 참고 — 코드가 틀리면 조용히 값이 안 채워지거나 엉뚱한 재료 가격이 들어갈 수 있으니 KAMIS API로 직접 검증 후 채울 것)
3. `.env.local`에 `KAMIS_CERT_KEY`, `KAMIS_CERT_ID`, `CRON_SECRET` 설정
4. 외부 스케줄러(Vercel Cron 등)로 `GET /api/cron/sync-kamis-prices` (헤더: `Authorization: Bearer <CRON_SECRET>`)를 주기적으로 호출

KAMIS는 농산물·축산물·수산물 시세만 제공합니다 — 소스/조미료/포장재는 이 경로로 채울 수 없습니다.

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # 서버 전용, 클라이언트 컴포넌트에서 절대 사용 금지
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속. `/calculator`, `/`, `/login`, `/signup`은 Supabase 연결 없이도 정적으로 동작하지만, 대시보드/식재료/레시피/설정 등 인증이 필요한 페이지는 위 2단계가 끝나야 정상 동작합니다.

## 검증 명령어

```bash
npm run test        # Vitest — 계산 엔진 단위 테스트 (77 tests)
npm run test:watch  # watch 모드
npx tsc --noEmit    # 타입 체크
npm run lint         # ESLint
npm run build        # 프로덕션 빌드
```

## 프로젝트 구조

```
src/
  app/                     라우트 (App Router)
    (app)/                 인증 필요 영역 — 대시보드/식재료/레시피/시뮬레이터/설정
    calculator/            로그인 없이 쓰는 빠른 계산기
  actions/                 Server Actions (ingredient/recipe/auth/profile/dashboard)
  components/              UI 컴포넌트 (도메인별로 분리)
  lib/
    calculations/          원가·마진·판매가 순수 함수 — UI에서 절대 직접 계산하지 않음
    units/                 단위 변환 (kg↔g, L↔ml). 수량 단위는 서로 변환하지 않음
    supabase/               client/server/proxy 헬퍼 + DAL
    validations/            Zod 스키마
  types/                    도메인 타입 + Database 타입
supabase/schema.sql          DB 스키마 + RLS + 트리거
```

## 알아두면 좋은 것

- **금액은 정수(KRW)** 로 저장/계산하며, 최종 표시 직전에만 반올림합니다 (`Math.round`는 중간 계산에 쓰지 않음).
- `recipe_ingredients`에는 계산된 원가를 저장하지 않습니다 — 식재료 가격이 바뀌면 다음 조회 시 항상 최신 가격으로 재계산됩니다.
- `src/types/database.ts`의 `Prettify<T>` 래퍼는 필수입니다: Row/Insert/Update를 이름 붙은 `interface`로 직접 참조하면 `@supabase/postgrest-js`의 제네릭 추론이 `never`로 무너지는 버그가 있어 우회한 것입니다 (파일 내 주석 참고).
- Next.js 16부터 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었습니다 (`proxy.ts` 참고).
