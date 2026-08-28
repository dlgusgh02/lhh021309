import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PriceSimulator } from "@/components/simulator/price-simulator";

export const metadata: Metadata = { title: "판매가 시뮬레이터" };

export default function SimulatorPage() {
  return (
    <div>
      <PageHeader title="판매가 시뮬레이터" description="여러 판매가격에 따른 원가율과 이익을 비교해보세요." />
      <PriceSimulator />
    </div>
  );
}
