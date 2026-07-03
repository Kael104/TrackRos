"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function FoodIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3v6" />
      <path d="M8.5 3v6" />
      <path d="M11 3v6" />
      <path d="M8.5 9v12" />
      <path d="M16 3v18" />
      <path d="M16 3c2.5 2 4 4.5 4 7.5s-1.5 5.5-4 7.5" />
    </svg>
  );
}

/** Gap kept between the button and the footer while it is scrolling into view. */
const FAB_FOOTER_GAP = 16;

function getRestBottom(): number {
  const width = window.innerWidth;

  if (width >= 1024) {
    return 12;
  }

  if (width >= 640) {
    return 14;
  }

  return 16;
}

function getFabBottomOffset(footer: HTMLElement): number {
  const footerTop = footer.getBoundingClientRect().top;
  const footerVisibleHeight = Math.max(0, window.innerHeight - footerTop);

  if (footerVisibleHeight <= 0) {
    return getRestBottom();
  }

  return footerVisibleHeight + FAB_FOOTER_GAP;
}

export function AddFoodFab() {
  const pathname = usePathname();
  const [bottomOffset, setBottomOffset] = useState(16);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) {
      return;
    }

    let frame = 0;

    function updateBottomOffset() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setBottomOffset(getFabBottomOffset(footer as HTMLElement));
      });
    }

    updateBottomOffset();

    const resizeObserver = new ResizeObserver(updateBottomOffset);
    resizeObserver.observe(footer);
    window.addEventListener("scroll", updateBottomOffset, { passive: true });
    window.addEventListener("resize", updateBottomOffset);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateBottomOffset);
      window.removeEventListener("resize", updateBottomOffset);
    };
  }, []);

  if (pathname === "/log") {
    return null;
  }

  return (
    <Link
      href="/log"
      aria-label="Add food"
      style={{
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
      }}
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-elevated transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:h-12 sm:w-12 lg:h-11 lg:w-11"
    >
      <FoodIcon className="h-6 w-6 sm:h-5 sm:w-5" />
    </Link>
  );
}
