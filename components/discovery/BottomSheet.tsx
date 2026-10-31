"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRef, useState } from "react";

// Drag the handle/header down this far (px), or flick it faster than this
// (px/ms), and the sheet closes.
const CLOSE_DISTANCE = 90;
const CLOSE_VELOCITY = 0.6;

/**
 * Sheet that slides up from the bottom of the phone column: easier to reach
 * with a thumb than a centered dialog. Swipe the top part down to close.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; startT: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    // Let the close button handle its own taps.
    if ((event.target as HTMLElement).closest("button")) return;
    drag.current = { startY: event.clientY, startT: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return;
    setDragY(Math.max(0, event.clientY - drag.current.startY)); // only downwards
  };
  const onPointerEnd = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const distance = Math.max(0, event.clientY - drag.current.startY);
    const velocity = distance / Math.max(1, performance.now() - drag.current.startT);
    drag.current = null;
    setDragging(false);
    if (distance > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) onOpenChange(false);
    setDragY(0);
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setDragY(0);
        onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-ink/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          style={{
            transform: dragY ? `translateY(${dragY}px)` : undefined,
            transition: dragging ? "none" : "transform 200ms ease-out",
          }}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-2xl bg-popover text-popover-foreground shadow-lg outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom"
        >
          {/* Drag region: the handle and the header. */}
          <div
            className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-khaki" />
            <div className="flex items-start gap-2 px-5 pt-2">
              <div className="min-w-0 flex-1 py-2">
                <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                aria-label="Close"
                className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X aria-hidden className="size-5" />
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="grid gap-5 overflow-y-auto px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
