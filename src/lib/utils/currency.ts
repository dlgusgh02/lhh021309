/** TRD §66-69: centralized money/percentage formatting. Money is rounded only at display time. */

const CURRENCY_LOCALE: Record<string, string> = {
  KRW: "ko-KR",
  USD: "en-US",
  JPY: "ja-JP",
  EUR: "de-DE",
  CNY: "zh-CN",
};

export function formatCurrency(amount: number, currency: string = "KRW"): string {
  const locale = CURRENCY_LOCALE[currency] ?? "ko-KR";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Convenience alias for the common case (KRW is the only currency the MVP
 * actually exercises today — see TRD §36 for planned multi-currency support).
 * Delegates to `formatCurrency` so there is a single formatting
 * implementation, not two.
 */
export function formatKRW(amount: number): string {
  return formatCurrency(amount, "KRW");
}
