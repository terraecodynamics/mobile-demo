"use client";

import { kronis } from "@/lib/kronis";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

const DISMISS_Y = 120;
const OPEN_MS = 380;
const CLOSE_MS = 220;

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  maxHeight?: string;
  className?: string;
  /** Soft scrim — native SoilTarget has none; home pickers use a light dim */
  dim?: boolean;
  /** Disable drag-to-dismiss (e.g. while slider is being dragged) */
  dragEnabled?: boolean;
};

/**
 * Bottom sheet matching native DraggableSheetModal:
 * spring open, 220ms slide-down close, drag to dismiss.
 */
export function SheetModal({
  open,
  onClose,
  children,
  header,
  maxHeight = "85%",
  className = "",
  dim = false,
  dragEnabled = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragY = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const closingRef = useRef(false);
  const lastMove = useRef({ y: 0, t: 0 });
  const velocity = useRef(0);
  const dragEnabledRef = useRef(dragEnabled);
  const onCloseRef = useRef(onClose);
  dragEnabledRef.current = dragEnabled;
  onCloseRef.current = onClose;

  const applyY = useCallback((y: number, animate: "open" | "close" | false) => {
    const el = sheetRef.current;
    if (!el) return;
    dragY.current = y;
    if (animate === "open") {
      el.style.transition = `transform ${OPEN_MS}ms cubic-bezier(0.22, 1.35, 0.36, 1)`;
    } else if (animate === "close") {
      el.style.transition = `transform ${CLOSE_MS}ms cubic-bezier(0.4, 0, 0.7, 0.2)`;
    } else {
      el.style.transition = "none";
    }
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  const finishClose = useCallback(
    (notify = true) => {
      if (closingRef.current) return;
      closingRef.current = true;
      setEntered(false);
      const el = sheetRef.current;
      const h = el?.offsetHeight ?? 500;
      applyY(h, "close");
      window.setTimeout(() => {
        closingRef.current = false;
        setMounted(false);
        dragY.current = 0;
        if (notify) onCloseRef.current();
      }, CLOSE_MS + 30);
    },
    [applyY]
  );

  // Mount / unmount from `open`
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      return;
    }
    if (mounted && !closingRef.current) {
      finishClose(false);
    }
  }, [open, mounted, finishClose]);

  // Animate in AFTER the sheet is in the DOM (fixes empty rAF before paint)
  useLayoutEffect(() => {
    if (!mounted || !open || closingRef.current) return;
    const el = sheetRef.current;
    if (!el) return;

    const h = el.offsetHeight || 400;
    applyY(h, false);
    // Force layout so the browser sees the off-screen frame
    void el.offsetHeight;
    applyY(0, "open");
    setEntered(true);
  }, [mounted, open, applyY]);

  const onHandlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragEnabledRef.current) return;
    dragging.current = true;
    startY.current = e.clientY - dragY.current;
    lastMove.current = { y: e.clientY, t: performance.now() };
    velocity.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastMove.current.t);
    velocity.current = (e.clientY - lastMove.current.y) / dt;
    lastMove.current = { y: e.clientY, t: now };
    applyY(Math.max(0, e.clientY - startY.current), false);
  };

  const onHandlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY.current > DISMISS_Y || velocity.current > 0.7) {
      finishClose(true);
      return;
    }
    const el = sheetRef.current;
    if (el) {
      el.style.transition = `transform 320ms cubic-bezier(0.22, 1.4, 0.36, 1)`;
      el.style.transform = "translate3d(0, 0, 0)";
      dragY.current = 0;
    }
  };

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 border-0"
        aria-label="Close"
        onClick={() => finishClose(true)}
        style={{
          background: dim ? "rgba(0,0,0,0.35)" : "transparent",
          opacity: dim ? (entered ? 1 : 0) : 1,
          transition: dim ? `opacity ${OPEN_MS}ms ease` : undefined,
        }}
      />

      <div
        ref={sheetRef}
        className={`relative z-[1] flex flex-col rounded-t-[28px] px-[18px] pb-6 pt-1.5 ${className}`}
        style={{
          background: kronis.background,
          maxHeight,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.12)",
          willChange: "transform",
          transform: "translate3d(0, 100%, 0)",
        }}
      >
        <div
          className="flex flex-col items-stretch pb-3 pt-2"
          style={{
            touchAction: "none",
            cursor: dragEnabled ? "grab" : "default",
          }}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
        >
          <div
            className="mx-auto mb-2 rounded-[3px]"
            style={{
              width: 48,
              height: 6,
              background: "rgba(23,26,18,0.38)",
            }}
          />
          {header}
        </div>
        {children}
      </div>
    </div>
  );
}
