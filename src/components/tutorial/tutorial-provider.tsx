"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TUTORIAL_STEPS } from "@/lib/tutorial/steps";

const STORAGE_KEY = "foodcostlab-tutorial-step";
const DONE_VALUE = "done";
export const RESTART_EVENT = "foodcostlab:restart-tutorial";

function readStoredStep(): number | "done" | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    if (raw === DONE_VALUE) return "done";
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeStoredStep(value: number | "done") {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // localStorage unavailable (private mode, etc.) — tutorial just won't persist across reloads.
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** First-run walkthrough: a dark overlay with a cutout spotlighting a
 * `data-tutorial="<id>"` element on the current page, plus a card
 * explaining that step. Advances across real pages (navigating via the
 * router when a step's target page differs from the next step's) so it
 * stays in sync if the user clicks around manually mid-tutorial. */
export function TutorialProvider() {
  const pathname = usePathname();
  const router = useRouter();
  // Lazy initializer (not an effect): reads localStorage once, synchronously,
  // on mount — starting the tour on first visit or resuming progress.
  const [stepIndex, setStepIndex] = useState<number | null>(() => {
    const stored = readStoredStep();
    if (stored === null) {
      writeStoredStep(0);
      return 0;
    }
    return stored === "done" ? null : stored;
  });
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef<number | null>(null);

  // Lets a "다시보기" button elsewhere (e.g. settings) restart the tour
  // without needing this already-mounted component to re-read storage.
  useEffect(() => {
    const restart = () => {
      setStepIndex(0);
      writeStoredStep(0);
      if (TUTORIAL_STEPS[0].path !== pathname) router.push(TUTORIAL_STEPS[0].path);
    };
    window.addEventListener(RESTART_EVENT, restart);
    return () => window.removeEventListener(RESTART_EVENT, restart);
  }, [pathname, router]);

  const step = stepIndex !== null ? TUTORIAL_STEPS[stepIndex] : undefined;
  const onCurrentPage = step ? pathname === step.path : false;

  // Track the spotlighted element's position, re-measuring on resize/scroll
  // and retrying briefly after navigation in case the target hasn't
  // rendered yet (e.g. a table that's still fetching data). Doesn't clear
  // `rect` itself when there's no target for the current step — the render
  // below only uses `rect` when `effectiveTarget` says there should be one,
  // so a stale value from a previous step is simply never read.
  const effectiveTarget = step?.target && onCurrentPage ? step.target : undefined;

  useEffect(() => {
    if (!effectiveTarget) return;

    let attempts = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${effectiveTarget}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else if (attempts < 20) {
        attempts += 1;
        rafRef.current = requestAnimationFrame(measure);
      } else {
        setRect(null);
      }
    };
    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [effectiveTarget]);

  const finish = useCallback(() => {
    writeStoredStep(DONE_VALUE);
    setStepIndex(null);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= TUTORIAL_STEPS.length) {
        finish();
        return;
      }
      setStepIndex(index);
      writeStoredStep(index);
      const target = TUTORIAL_STEPS[index];
      if (target.path !== pathname) router.push(target.path);
    },
    [finish, pathname, router],
  );

  if (step === undefined) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const effectiveRect = effectiveTarget ? rect : null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dark overlay with a cutout around the spotlighted element (or the whole screen, when there's nothing to point at). */}
      <div
        className="pointer-events-none fixed inset-0 transition-all duration-200"
        style={
          effectiveRect
            ? {
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                position: "fixed",
                top: effectiveRect.top - 6,
                left: effectiveRect.left - 6,
                width: effectiveRect.width + 12,
                height: effectiveRect.height + 12,
                borderRadius: 10,
                outline: "2px solid var(--primary)",
              }
            : { background: "rgba(0,0,0,0.6)" }
        }
      />

      <TutorialCard
        step={step}
        rect={effectiveRect}
        isFirst={isFirst}
        isLast={isLast}
        onSkip={finish}
        onPrev={() => goToStep((stepIndex ?? 0) - 1)}
        onNext={() => goToStep((stepIndex ?? 0) + 1)}
      />
    </div>
  );
}

function TutorialCard({
  step,
  rect,
  isFirst,
  isLast,
  onSkip,
  onPrev,
  onNext,
}: {
  step: (typeof TUTORIAL_STEPS)[number];
  rect: Rect | null;
  isFirst: boolean;
  isLast: boolean;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cardStyle = rect ? placementStyle(rect, step.placement ?? "bottom") : centeredStyle();

  return (
    <div
      className="fixed z-[101] w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-popover p-5 text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
      style={cardStyle}
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="튜토리얼 건너뛰기"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <p className="font-heading mb-1.5 pr-5 text-sm font-semibold">{step.title}</p>
      <p className="mb-4 text-sm text-muted-foreground">{step.body}</p>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onSkip} className="text-xs text-muted-foreground underline hover:text-foreground">
          건너뛰기
        </button>
        <div className="flex gap-2">
          {!isFirst && (
            <Button type="button" variant="outline" size="sm" onClick={onPrev}>
              이전
            </Button>
          )}
          <Button type="button" size="sm" onClick={onNext}>
            {isLast ? "시작하기" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function centeredStyle(): CSSProperties {
  return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
}

function placementStyle(rect: Rect, placement: "top" | "bottom" | "left" | "right"): CSSProperties {
  const gap = 14;
  switch (placement) {
    case "right":
      return { top: rect.top, left: rect.left + rect.width + gap };
    case "left":
      return { top: rect.top, left: Math.max(16, rect.left - 352 - gap) };
    case "top":
      return { top: Math.max(16, rect.top - gap), left: rect.left, transform: "translateY(-100%)" };
    case "bottom":
    default:
      return { top: rect.top + rect.height + gap, left: rect.left };
  }
}
