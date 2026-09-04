import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKRW } from "@/lib/utils/currency";
import type { IngredientPriceHistory } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function IngredientPriceHistoryTable({ history }: { history: IngredientPriceHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 가격 변경 이력이 없습니다. 가격을 수정하면 이전 가격이 여기에 기록됩니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>변경일</TableHead>
            <TableHead className="text-right">구매 가격</TableHead>
            <TableHead className="text-right">구매 단위</TableHead>
            <TableHead className="text-right">단위 원가</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h) => (
            <TableRow key={h.id}>
              <TableCell className="text-muted-foreground">{formatDate(h.recordedAt)}</TableCell>
              <TableCell className="text-right">{formatKRW(h.purchasePrice)}</TableCell>
              <TableCell className="text-right">
                {h.purchaseQuantity}
                {h.purchaseUnit}
              </TableCell>
              <TableCell className="text-right">
                {formatKRW(h.purchasePrice / h.purchaseQuantity)}/{h.purchaseUnit}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
