"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Restaure le scroll vers la section après navigation :
 * - fragment `#SECTION` (Modifier / Annuler côté client)
 * - query `?focus=SECTION` (après Enregistrer via Server Action)
 */
export function ScrollToHash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    const fromFocus = searchParams.get("focus") ?? "";
    const id = fromHash || fromFocus;
    if (!id) return;
    const el = document.getElementById(id);
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
