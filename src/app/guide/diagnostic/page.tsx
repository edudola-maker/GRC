import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { GuideDiagnosticClient } from "@/components/guide/GuideDiagnosticClient";

export const dynamic = "force-dynamic";

export default function GuideDiagnosticPage() {
  return (
    <>
      <p style={{ margin: "0 0 0.75rem" }}>
        <Link href="/guide" className="btn-link">
          ← Guide
        </Link>
      </p>
      <PageHeader
        title="Diagnostic initial"
        description="Parlez-nous de votre organisation — quelques questions à la fois. Les propositions restent à votre confirmation."
      />
      <GuideDiagnosticClient />
    </>
  );
}
