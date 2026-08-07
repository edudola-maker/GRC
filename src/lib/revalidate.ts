import { revalidatePath } from "next/cache";

/** Revalide les vues transverses après une mutation métier */
export function revalidateApp(extra: string[] = []) {
  const paths = [
    "/",
    "/backlog",
    "/taches",
    "/projets",
    "/conseils",
    "/controles-sci",
    "/risques",
    "/documents",
    "/audits",
    "/equipe",
    ...extra,
  ];
  for (const p of paths) revalidatePath(p);
}
