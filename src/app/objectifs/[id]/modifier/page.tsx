import { redirect } from "next/navigation";

export default async function ObjectifModifierRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/objectifs/${id}?edit=INFOS_GENERALES`);
}
