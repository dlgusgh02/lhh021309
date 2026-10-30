/** One screen of the first-run walkthrough. `target` is a `data-tutorial`
 * value to spotlight on the current page; omit it for a centered card with
 * no spotlight. `path` is the route this step expects to be shown on — the
 * provider navigates there when the user clicks "다음" out of a step whose
 * `path` differs from the next step's. */
export interface TutorialStep {
  id: string;
  path: string;
  title: string;
  body: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    path: "/dashboard",
    title: "FoodCost Lab에 오신 걸 환영합니다 👋",
    body: "식재료 등록 → 레시피 작성 → 원가 자동 계산 → 적정 판매가 추천, 이 4단계만 따라오시면 바로 쓰실 수 있어요. 잠깐 둘러볼까요?",
  },
  {
    id: "nav-ingredients",
    path: "/dashboard",
    title: "1단계 — 식재료 등록",
    body: "먼저 재료를 등록해야 원가를 계산할 수 있어요. 왼쪽 메뉴의 '식재료'로 이동해볼게요.",
    target: "nav-/ingredients",
    placement: "right",
  },
  {
    id: "ingredients-add",
    path: "/ingredients",
    title: "구매가만 입력하면 끝",
    body: "구매 가격과 구매량만 넣으면 g당/ml당 단가가 자동으로 계산돼요. 수율(손질 후 실제 사용 비율)도 반영할 수 있어요.",
    target: "add-ingredient",
    placement: "bottom",
  },
  {
    id: "nav-recipes",
    path: "/ingredients",
    title: "2단계 — 레시피 작성",
    body: "재료를 등록했다면, 이제 레시피를 만들어볼게요.",
    target: "nav-/recipes",
    placement: "right",
  },
  {
    id: "recipes-add",
    path: "/recipes",
    title: "레시피에 재료를 추가해보세요",
    body: "레시피에 재료와 사용량을 추가하면 1인분 원가, 원가율이 자동으로 계산돼요. 인건비 같은 추가 비용도 넣을 수 있어요.",
    target: "add-recipe",
    placement: "bottom",
  },
  {
    id: "nav-simulator",
    path: "/recipes",
    title: "3단계 — 판매가 정하기",
    body: "원가가 나왔으면, 판매가를 얼마로 정해야 할지 시뮬레이터로 확인해볼게요.",
    target: "nav-/simulator",
    placement: "right",
  },
  {
    id: "simulator-explain",
    path: "/simulator",
    title: "목표만 정하면 판매가가 나와요",
    body: "원하는 원가율이나 목표 수익을 입력하면, 그에 맞는 적정 판매가를 바로 계산해드려요.",
  },
  {
    id: "done",
    path: "/simulator",
    title: "준비 끝! 🎉",
    body: "이제 직접 재료를 등록하면서 시작해보세요. 이 튜토리얼은 설정 페이지에서 언제든 다시 볼 수 있어요.",
  },
];
