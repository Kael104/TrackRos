"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, type ReactNode, type TouchEvent } from "react";
import { navLinks } from "@/lib/navigation";

const SWIPE_THRESHOLD = 60;
const HORIZONTAL_RATIO = 1.5;

interface SwipeNavigatorProps {
  children: ReactNode;
}

export function SwipeNavigator({ children }: SwipeNavigatorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    if (e.touches.length > 1) {
      touchStart.current = null;
      return;
    }

    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;

    if (!start || e.changedTouches.length === 0) {
      return;
    }

    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;

    if (
      Math.abs(dx) <= SWIPE_THRESHOLD ||
      Math.abs(dx) <= Math.abs(dy) * HORIZONTAL_RATIO
    ) {
      return;
    }

    const currentIndex = navLinks.findIndex((link) => link.href === pathname);
    if (currentIndex === -1) {
      return;
    }

    if (dx < 0 && currentIndex < navLinks.length - 1) {
      router.push(navLinks[currentIndex + 1].href);
      return;
    }

    if (dx > 0 && currentIndex > 0) {
      router.push(navLinks[currentIndex - 1].href);
    }
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
