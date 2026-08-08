import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Redirige vers l’édition box par box (informations générales). */
export default async function ModifierProcessusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/processus/${id}?edit=INFOS_GENERALES`);
}
