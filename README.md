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

### (선택) 공용 재료 가격 연동 (data.go.kr — 공판장 가격 데이터)

식재료 등록 화면의 "공용 재료에서 가져오기"에 실제 시세를 채우려면:

1. [data.go.kr](https://www.data.go.kr)에서 "한국농수산식품유통공사_공판장 가격 관련 정보" 활용신청 → 승인 후 "일반 인증키" 발급
2. `.env.local`에 `KAMIS_ODCLOUD_KEY`(발급받은 인증키), `CRON_SECRET`(임의 문자열) 설정
3. `src/lib/kamis/item-map.ts`에 매핑 추가 — 새 품목을 추가하려면 먼저 API로 해당 품목명이 실제로 존재하는지 직접 확인할 것 (없는 이름은 조용히 0건만 반환함, 에러 안 남)
4. 외부 스케줄러(Vercel Cron 등)로 `GET /api/cron/sync-kamis-prices` (헤더: `Authorization: Bearer <CRON_SECRET>`)를 주기적으로 호출

이 데이터셋은 가락시장 등 공판장에서 거래되는 **청과물(과일·채소)만** 다룹니다 — 축산물·수산물·양곡·소스/조미료는 이 경로로 채울 수 없습니다. 자세한 내용/제약사항은 `src/lib/kamis/client.ts` 상단 주석 참고.

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
npm run typecheck   # Next.js 경로 타입 생성 후 타입 체크
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

## 참고 가격 출처·조사일

기존 DB는 `supabase/migrations/20261106_reference_price_metadata.sql`을 Supabase SQL Editor에서 먼저 실행한 후 새 동기화 코드를 배포합니다. 신규 DB는 최신 `supabase/schema.sql`에 해당 컬럼이 포함되어 있습니다. 기존 가격의 출처·조사일은 추측해 채우지 않으며, 다음 정상 동기화부터 저장됩니다.

`price_as_of`는 제공기관의 조사일, `price_updated_at`은 앱의 동기화 시각입니다. 세 동기화 경로는 참고 가격과 출처·시장·등급을 함께 갱신하고 실제 갱신된 행이 한 개일 때만 성공으로 집계합니다.

- `/api/cron/sync-kamis-prices`: KAMIS 공판장, 11개 매핑
- `/api/cron/sync-ekape-prices`: eKAPE 축산물, 3개 매핑
- `/api/cron/sync-kamis-perday-prices`: KAMIS 일별 도·소매, 10개 매핑

모든 경로는 `Authorization: Bearer <CRON_SECRET>` 헤더가 필요합니다. 외부 스케줄러는 별도로 설정해야 합니다. 매핑 개수는 실제 동기화 성공 개수와 다를 수 있으므로 응답의 `synced`와 `errors`를 확인합니다.

공용 재료에서 가져온 가격은 구매가의 초기 입력값입니다. 이후 시세 동기화가 사용자의 저장된 구매가를 덮어쓰지는 않습니다. `50개`·`100속`은 묶음 단위로 입력하며, 예를 들어 50개 중 5개 사용은 `0.1 × 50개`로 입력합니다. 무게나 다른 수량 단위로 자동 환산하지 않습니다.

## 레시피 데이터 무결성

기존 DB에는 `supabase/migrations/20261106_recipe_integrity.sql`을 실행한 후 새 레시피 코드를 배포합니다. 신규 DB용 `schema.sql`에도 같은 함수와 정책이 포함되어 있습니다. 레시피 복제는 `duplicate_recipe` RPC 한 번으로 본문·재료·추가 비용을 복사합니다. 도중에 오류가 나면 전체 복사를 롤백하며, 함수 미설치 시 개별 INSERT로 우회하지 않습니다. 이미지는 복사하고 즐겨찾기는 초기화합니다.

재료 추가는 서버에서 현재 매장의 레시피·식재료인지 확인하고 계산 엔진과 동일한 단위 변환 규칙으로 검증합니다. DB의 RLS도 다른 매장 식재료의 연결을 차단합니다. 재료·추가 비용 삭제는 해당 레시피와 항목 ID를 함께 확인하며 일치하는 항목이 없으면 실패를 반환합니다.

개발용 Supabase에서 `supabase/tests/recipe_integrity.sql` 전체를 실행하면 실제 DB의 복사 결과·소유권 차단·실패 시 전체 롤백을 검증할 수 있습니다. 스크립트는 마지막에 테스트 데이터와 임시 트리거를 모두 롤백합니다. Vitest의 RPC 모킹 테스트와 별도로 실행해야 합니다.
