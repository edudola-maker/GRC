"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Cmd/Ctrl+K → page recherche (pas de palette modale). */
export function RechercheHotkey() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/recherche");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
