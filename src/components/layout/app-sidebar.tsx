import Link from "next/link";
import { ChefHat } from "lucide-react";
import { NavLinks } from "@/components/layout/nav-links";

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <ChefHat className="size-5 text-primary" />
          FoodCost Lab
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks />
      </div>
    </aside>
  );
}
