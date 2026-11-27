export const PRICE_SOURCE_LABELS: Record<string, string> = {
  "kamis-auction": "KAMIS 공판장",
  "kamis-perday": "KAMIS 일별 도·소매",
  ekape: "축산물품질평가원",
  "ekape-poultry": "축산물품질평가원 (가금산물)",
};

export type PriceSource = "kamis-auction" | "kamis-perday" | "ekape" | "ekape-poultry";

/** Accept the two provider date formats, rejecting impossible calendar dates. */
export function normalizePriceDate(value: string): string {
  if (!/^(?:\d{8}|\d{4}-\d{2}-\d{2})$/.test(value)) {
    throw new Error("가격 조사일 형식이 올바르지 않습니다.");
  }
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value.replace(/-/g, ""));
  if (!match) throw new Error("가격 조사일 형식이 올바르지 않습니다.");
  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${normalized}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new Error("가격 조사일이 유효한 날짜가 아닙니다.");
  }
  return normalized;
}

/** Price and provenance must be written together in the same DB update. */
export function referencePriceUpdate(price: {
  amount: number;
  unit: string;
  source: PriceSource;
  asOf: string;
  market?: string;
  grade?: string;
}) {
  if (!Number.isSafeInteger(price.amount) || price.amount <= 0) {
    throw new Error("참고 가격은 0보다 큰 정수여야 합니다.");
  }
  return {
    reference_price: price.amount,
    reference_unit: price.unit,
    price_source: price.source,
    price_as_of: normalizePriceDate(price.asOf),
    price_market: price.market ?? null,
    price_grade: price.grade ?? null,
    price_updated_at: new Date().toISOString(),
  };
}
