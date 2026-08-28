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

/** Plain "₩12,500" without relying on Intl currency symbol placement quirks. */
export function formatKRW(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}
