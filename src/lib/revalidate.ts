import { revalidatePath } from "next/cache";

/** Revalide les vues transverses après une mutation métier */
export function revalidateApp(extra: string[] = []) {
  const paths = [
    "/",
    "/responsable",
    "/backlog",
    "/taches",
    "/projets",
    "/conseils",
    "/controles-sci",
    "/risques",
    "/documents",
    "/audits",
    "/equipe",
    "/unite",
    "/objectifs",
    "/modeles-taches",
    "/processus",
    "/administration",
    "/administration/utilisateurs",
    "/administration/unites",
    "/administration/roles",
    ...extra,
  ];
  for (const p of paths) revalidatePath(p);
}
