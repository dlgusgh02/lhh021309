export function formatPercentage(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}
