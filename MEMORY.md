# 프로젝트 메모리

기록일: 2026-11-27.

## 사용자 선호
- 모든 대화는 한국어로 작성한다. 진행 설명, 질문, 최종 답변에도 적용한다.
- 승인된 범위의 다음 작업은 불필요한 재확인 없이 진행한다.
- 할 일을 하나씩 순서대로 처리하는 걸 선호한다 ("차근히 1개씩").
- 직접 할 수 있는 작업은 사용자에게 시키지 말고 Claude가 직접 하길 원한다. 단, DB 비밀번호/Management API 토큰처럼 구조적으로 없는 자격증명이 필요한 작업(원격 DB에 임의 SQL 실행 등)은 예외 — 이때는 Supabase SQL Editor를 직접 URL로 열어주는 식으로 안내한다 (`https://supabase.com/dashboard/project/<ref>/sql/new`, 아이콘 위치 설명은 부정확할 수 있어 피한다).

## 완료한 코드 작업
- FoodCost Lab, 브랜치 feature/mvp-scaffold. 기존 미커밋 변경을 보존한다.
- Next.js 타입 생성 명령 추가, 50개·100속 묶음 단위 지원, 신규 KAMIS 일별(perday) 연동 보강(`src/lib/kamis-perday/`) — 쌀/마늘/대파/생강/고춧가루/갈치/새우/고등어/멸치/오징어 10개 추가 매핑.
- 가격 출처·조사일·시장·등급 저장(`price_source`/`price_as_of`/`price_market`/`price_grade`) 및 표시 연결 — `src/lib/prices/reference-price.ts`의 `referencePriceUpdate()`로 price/provenance를 한 번에 씀.
- 레시피 복제를 단일 RPC(`duplicate_recipe`)로 변경하고 소유권·단위 검증, 삭제 범위 제한, RLS 보강.
- **2026-11-13: 두 마이그레이션을 원격 Supabase DB에 실제로 적용 완료** (Supabase SQL Editor에서 사용자가 직접 실행, Claude가 DB 컬럼/함수 존재 여부를 service-role 키로 재확인함). `supabase/tests/recipe_integrity.sql`도 "Run without RLS"로 실행 요청했으나 성공/실패 메시지를 사용자가 확인 못 함 — **실제로 통과했는지 미확인 상태**로 다음 단계 진행(사용자 지시).
- **2026-11-13: 가격 동기화 cron 라우트 3종 전부 실제 라이브 재검증 완료** (마이그레이션 적용 후): `/api/cron/sync-ekape-prices` synced 3/3, `/api/cron/sync-kamis-prices` synced 11/11, `/api/cron/sync-kamis-perday-prices` synced 10/10 — 전부 에러 없음.
- **2026-11-27: 계란 매핑 완료** (`src/lib/ekape-poultry/client.ts` + `/api/cron/sync-ekape-poultry-prices`) — eKAPE "가금산물 일일거래가격정보"(data.go.kr/15073985) 사용. 이 API는 단위를 전혀 명시하지 않아서(문서에도 없음), eKAPE 공식 축산유통정보 사이트를 미러링하는 제3자 페이지의 같은 날짜 가격과 직접 대조해서 "원/30개"임을 확인하고 중란(48g 가정)으로 kg 환산 — 라이브 테스트로 3,249원/kg 저장 확인됨.
- **닭고기(가슴살/다리살)는 매핑 보류** — 같은 가금산물 API의 육계 데이터는 통닭(도체) 전체 가격만 주고 부위별 가격이 없음. 부위별 실제 가격 차이가 커서 통닭 가격을 그대로 쓰면 부정확 — 부위별 소스 없이는 매핑하지 않기로 결정(추측성 대입 금지 원칙 유지).
- **2026-11-27: 소금 매핑 추가** (KAMIS perday, ctgry_cd 600/item_cd 652, 천일염) — 라이브 테스트로 916원/kg 저장 확인됨. 같은 API의 ctgry_cd 700(가공식품 추정)도 직접 스캔했지만 전부 빈 응답 — 이 데이터셋에 가공식품 카테고리 자체가 없음을 재확인. "지역별 품목별 도,소매 가격정보"(15156062, B552845/perRegion)도 확인했으나 같은 품목코드 체계라 새 품목 없음.
- 현재 공용 재료 가격 매핑: **26/36** (eKAPE 3 + KAMIS 공판장 11 + KAMIS perday 11 + eKAPE 가금산물 1). 남은 10개(간장/고추장/닭고기×2/된장/두부/설탕/식용유/우유/참기름)는 라이브 API 소스 없음(우유는 원유 가격이 낙농진흥회 협상제라 API 자체가 없고, 나머지는 2020~2024 1회성 과거 통계 파일만 있어 매일 갱신되는 라이브 동기화에 안 맞음) — 추가 데이터 소스 발견 없이는 더 할 게 없음.
- 마지막 전체 검증(2026-11-27): 테스트 229개, 타입 검사, 린트 전부 통과.
- 레시피 생성 폼에 재료 선택+실시간 원가 합계 추가(`src/components/recipes/recipe-form.tsx`), 판매가 시뮬레이터에 추천가/재료비 변동 슬라이더/레시피 비교/매장평균 포지션/레시피 불러오기 추가(`src/components/simulator/price-simulator.tsx`), 레시피 재료 줄 인라인 수정 기능 추가(`updateRecipeIngredient` Server Action).

## 중단된 작업
- 튜토리얼 안정화 수정 중 사용자 요청으로 중단하고 메모리 기록.
- 수정: src/components/tutorial/tutorial-provider.tsx, src/lib/tutorial/steps.ts.
- 신규: src/lib/tutorial/state.ts, src/lib/tutorial/placement.ts.
- 저장 상태를 useSyncExternalStore로 분리하고 가시 대상 선택, 카드 배치, Dialog 포커스·Esc 처리 추가.
- **2026-11-13: 순수 로직(resolveStep, isVisibleRect, placeCard)에 단위 테스트 19개 추가, 전부 통과** (`src/lib/tutorial/state.test.ts`, `src/lib/tutorial/placement.test.ts`) — 이 세션에 브라우저 자동화 도구가 연결되어 있지 않아 코드 검토 + 순수 함수 테스트로 대신함. **Dialog 포커스/Esc, 실제 스포트라이트 위치, 모바일 반응형은 여전히 실제 브라우저에서 눌러본 적 없음** — 사람이 직접 확인 필요.

## 환경과 재개 순서
- C: 여유 공간이 반복해서 0바이트 근처로 떨어진다(이번 세션 중에도 여러 번). 쓰기/서버 시작 전에 `df -h /`로 확인하고, 필요하면 `.next` 삭제 + VS Code/npm 캐시 정리로 보통 복구된다.
- RAM도 빠듯하다(7.91GB 중 1.8~2GB대 free가 흔함) — `next dev`의 Turbopack(Rust)이 메모리 부족으로 죽거나 디스크 부족으로 캐시 persist가 실패하는 경우가 있었는데, 둘 다 재시작하면 보통 해결됨(persist 실패는 치명적이지 않고 그냥 캐싱만 꺼짐).
- `npx tsc --noEmit`을 바로 돌리면 `.next` 생성 타입이 없어서 `LayoutProps` 류의 가짜 에러가 난다 — 반드시 `npm run typecheck`(= `next typegen && tsc`)로 돌릴 것.
- 사용자 데이터·설치된 프로그램·다른 프로젝트는 삭제하지 않는다.
- 다음: 튜토리얼 실제 브라우저 확인 → `recipe_integrity.sql` 통과 여부 재확인(원하면) → 전부 확인되면 커밋 + push(두 커밋 `48e157a`, `96e9951` 이후 작업은 전부 미커밋 상태).
- 기존 상세 메모리: C:/Users/comschool005/.claude/projects/c--Users-comschool005-Desktop-lhh5/memory/.
