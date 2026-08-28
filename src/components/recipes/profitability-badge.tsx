import { Badge } from "@/components/ui/badge";
import { getProfitabilityGrade, type ProfitabilityGrade } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const GRADE_STYLE: Record<ProfitabilityGrade, string> = {
  "매우 좋음": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "좋음": "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  "보통": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "주의": "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  "위험": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function ProfitabilityBadge({ foodCostPercentage }: { foodCostPercentage: number }) {
  const grade = getProfitabilityGrade(foodCostPercentage);
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", GRADE_STYLE[grade])}>
      {grade}
    </Badge>
  );
}
