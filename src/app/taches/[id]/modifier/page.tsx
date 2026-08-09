import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Édition box-by-box sur la fiche détail — page /modifier conservée en redirection. */
export default async function ModifierRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/taches/${id}?edit=INFOS_GENERALES`);
}
