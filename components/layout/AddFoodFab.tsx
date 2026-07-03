"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function FoodIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
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

const FAB_GAP = 24;

export function AddFoodFab() {
  const pathname = usePathname();
  const [bottomOffset, setBottomOffset] = useState(FAB_GAP);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) {
      return;
    }

    function updateBottomOffset() {
      setBottomOffset(footer!.offsetHeight + FAB_GAP);
    }

    updateBottomOffset();

    const observer = new ResizeObserver(updateBottomOffset);
    observer.observe(footer);
    window.addEventListener("resize", updateBottomOffset);

    return () => {
      observer.disconnect();
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
      style={{ bottom: bottomOffset }}
      className="fixed right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-white shadow-elevated transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <FoodIcon />
    </Link>
  );
}
