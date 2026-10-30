"use client";

import { Button } from "@/components/ui/button";
import { RESTART_EVENT } from "@/components/tutorial/tutorial-provider";

export function RestartTutorialButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.dispatchEvent(new Event(RESTART_EVENT))}
    >
      튜토리얼 다시보기
    </Button>
  );
}
