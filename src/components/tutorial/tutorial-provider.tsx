"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TUTORIAL_STEPS } from "@/lib/tutorial/steps";
import { getSnapshot, getServerSnapshot, subscribe, resolveStep, saveStep, RESTART_EVENT } from "@/lib/tutorial/state";
import { isVisibleRect, placeCard, type Rect } from "@/lib/tutorial/placement";

export { RESTART_EVENT } from "@/lib/tutorial/state";

export function TutorialProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const stepIndex = resolveStep(stored, TUTORIAL_STEPS.length, pathname);
  const step = stepIndex === null ? undefined : TUTORIAL_STEPS[stepIndex];
  const onCurrentPage = step?.path === pathname;
  const target = onCurrentPage ? step?.target : undefined;
  const [measured, setMeasured] = useState<{ target: string; rect: Rect | null } | null>(null);

  useEffect(() => {
    const restart = () => {
      saveStep(0);
      if (pathname !== TUTORIAL_STEPS[0].path) router.push(TUTORIAL_STEPS[0].path);
    };
    window.addEventListener(RESTART_EVENT, restart);
    return () => window.removeEventListener(RESTART_EVENT, restart);
  }, [pathname, router]);

  useEffect(() => {
    if (!target) return;
    let frame = 0;
    let observed: Element | undefined;
    const sizeObserver = new ResizeObserver(() => schedule());
    const measure = () => {
      frame = 0;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const element = Array.from(document.querySelectorAll(`[data-tutorial="${target}"]`))
        .find((el) => isVisibleRect(el.getBoundingClientRect(), viewport));
      if (element !== observed) {
        sizeObserver.disconnect();
        if (element) sizeObserver.observe(element);
        observed = element;
      }
      const bounds = element?.getBoundingClientRect();
      const rect = bounds ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height } : null;
      setMeasured((previous) => previous?.target === target && JSON.stringify(previous.rect) === JSON.stringify(rect)
        ? previous : { target, rect });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [target]);

  const finish = useCallback(() => saveStep("done"), []);
  function goToStep(index: number) {
    if (index >= TUTORIAL_STEPS.length) { finish(); return; }
    if (index < 0) return;
    saveStep(index);
    if (TUTORIAL_STEPS[index].path !== pathname) router.push(TUTORIAL_STEPS[index].path);
  }

  if (!step || stepIndex === null) return null;
  const rect = target && measured?.target === target ? measured.rect : null;
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) finish(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100]" />
        <div aria-hidden="true" className="pointer-events-none fixed z-[100]"
          style={rect ? {
            top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
            borderRadius: 10, outline: "2px solid var(--primary)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          } : { inset: 0, background: "rgba(0,0,0,0.6)" }} />
        <TutorialCard step={step} rect={rect} stepIndex={stepIndex} onCurrentPage={onCurrentPage}
          onSkip={finish} onPrev={() => goToStep(stepIndex - 1)}
          onNext={() => onCurrentPage ? goToStep(stepIndex + 1) : router.push(step.path)} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TutorialCard({ step, rect, stepIndex, onCurrentPage, onSkip, onPrev, onNext }: {
  step: (typeof TUTORIAL_STEPS)[number]; rect: Rect | null; stepIndex: number; onCurrentPage: boolean;
  onSkip: () => void; onPrev: () => void; onNext: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number; viewportWidth: number; viewportHeight: number } | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const next = { width: box.width, height: box.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
      setSize((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("resize", schedule);
    schedule();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize", schedule); };
  }, []);

  const position = size ? placeCard(rect, step.placement ?? "bottom", { width: size.viewportWidth, height: size.viewportHeight }, size) : null;
  return (
    <Dialog.Popup ref={ref}
      className="fixed z-[101] max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-popover p-5 text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none"
      style={position ?? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
      <Dialog.Close aria-label="튜토리얼 건너뛰기" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="size-4" /></Dialog.Close>
      <p className="mb-1 text-xs text-muted-foreground">{stepIndex + 1} / {TUTORIAL_STEPS.length}</p>
      <Dialog.Title className="font-heading mb-1.5 pr-5 text-sm font-semibold">{step.title}</Dialog.Title>
      <Dialog.Description className="mb-4 text-sm text-muted-foreground">{step.body}</Dialog.Description>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onSkip} className="text-xs text-muted-foreground underline hover:text-foreground">건너뛰기</button>
        <div className="flex gap-2">
          {stepIndex > 0 && <Button type="button" variant="outline" size="sm" onClick={onPrev}>이전</Button>}
          <Button type="button" size="sm" onClick={onNext}>
            {!onCurrentPage ? "이 단계로 이동" : stepIndex === TUTORIAL_STEPS.length - 1 ? "시작하기" : "다음"}
          </Button>
        </div>
      </div>
    </Dialog.Popup>
  );
}
