import { redirect } from "next/navigation";

export default async function ModeleTacheModifierRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/modeles-taches/${id}?edit=INFOS_GENERALES`);
}
