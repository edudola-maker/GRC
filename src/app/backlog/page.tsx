import { redirect } from "next/navigation";

/** Ancien Backlog → Dashboard collaborateur (Mes actions). */
export default async function BacklogRedirect({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const sp = await searchParams;
  const vue = sp.vue;
  if (vue === "retard" || vue === "aujourdhui" || vue === "semaine") {
    redirect(`/?vue=${vue}`);
  }
  if (vue === "mois") redirect("/?vue=avenir");
  redirect("/");
}
