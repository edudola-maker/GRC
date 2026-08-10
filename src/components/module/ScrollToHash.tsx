"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Restaure le scroll vers l’ancre (#section) après navigation
 * (ex. clic Modifier → ?edit=KEY#KEY).
 */
export function ScrollToHash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({
        block: "start",
        behavior: "instant" as ScrollBehavior,
      });
    });
  }, [pathname, searchParams]);

  return null;
}
