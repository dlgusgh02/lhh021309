"use client";

import { useState } from "react";
import Link from "next/link";
import { ChefHat, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLinks } from "@/components/layout/nav-links";
import { logout } from "@/actions/auth-actions";

export function SiteHeader({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="h-14 justify-center border-b px-4">
            <SheetTitle className="flex items-center gap-2 text-left font-semibold">
              <ChefHat className="size-5 text-primary" />
              FoodCost Lab
            </SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
        <ChefHat className="size-5 text-primary" />
        FoodCost Lab
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {userEmail && <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>}
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="size-4" />
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  );
}
