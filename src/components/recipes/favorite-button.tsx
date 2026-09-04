"use client";

import { useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/actions/recipe-actions";

interface FavoriteButtonProps {
  id: string;
  name: string;
  isFavorite: boolean;
  className?: string;
}

export function FavoriteButton({ id, name, isFavorite, className }: FavoriteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick(e: MouseEvent) {
    // Rows in RecipeTable wrap the name in a <Link>; this button sits outside
    // it, but stopPropagation still protects future nesting.
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleFavorite(id, !isFavorite);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `${name} 즐겨찾기 해제` : `${name} 즐겨찾기 추가`}
      className={className}
    >
      <Star className={cn("size-4", isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
    </Button>
  );
}
