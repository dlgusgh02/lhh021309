import type { LucideIcon } from "lucide-react";
import { Calculator, ChefHat, LayoutDashboard, Settings, ShoppingBasket, SlidersHorizontal } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/ingredients", label: "식재료", icon: ShoppingBasket },
  { href: "/recipes", label: "레시피", icon: ChefHat },
  { href: "/calculator", label: "빠른 계산기", icon: Calculator },
  { href: "/simulator", label: "판매가 시뮬레이터", icon: SlidersHorizontal },
  { href: "/settings", label: "설정", icon: Settings },
];
