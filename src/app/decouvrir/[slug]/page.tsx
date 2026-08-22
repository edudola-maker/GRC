import Link from "next/link";
import { notFound } from "next/navigation";
import { DecouvrirParcoursView } from "@/components/decouvrir/DecouvrirParcoursView";
import { PageHeader } from "@/components/ui";
import { getParcours } from "@/lib/decouvrir-parcours";

export const dynamic = "force-dynamic";

export default async function DecouvrirParcoursPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parcours = getParcours(slug);
  if (!parcours) notFound();

  return (
    <>
      <p style={{ margin: "0 0 0.75rem" }}>
        <Link href="/decouvrir" className="btn-link">
          ← Tous les parcours
        </Link>
      </p>
      <PageHeader title={parcours.titre} description={parcours.resume} />
      <DecouvrirParcoursView parcours={parcours} />
    </>
  );
}
