import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ModifierAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/audits/${id}?edit=VUE_ENSEMBLE`);
}
