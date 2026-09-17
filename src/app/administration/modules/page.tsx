import { FlashBanner } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/FormControls";
import type { CleModule } from "@/generated/prisma/client";
import { MODULE_CATALOG } from "@/lib/modules";
import { getOrgContext } from "@/lib/organisation";
import { toggleOrganisationModule } from "./actions";

export const dynamic = "force-dynamic";

const GROUPE_LABELS: Record<string, string> = {
  core: "Cœur produit",
  gouvernance: "Gouvernance",
  metier: "Métier",
  admin: "Administration",
};

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getOrgContext();

  const byGroupe = MODULE_CATALOG.reduce(
    (acc, m) => {
      (acc[m.groupe] ??= []).push(m);
      return acc;
    },
    {} as Record<string, typeof MODULE_CATALOG>,
  );

  return (
    <>
      <PageHeader title="Modules activés" />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        Organisation :{" "}
        <strong>{ctx.organisation.nomCourt || ctx.organisation.nom}</strong>
        . Désactiver un module masque la navigation — les données sont
        conservées.
      </p>

      {Object.entries(byGroupe).map(([groupe, mods]) => (
        <section key={groupe} className="stack-panels" style={{ marginBottom: "1.5rem" }}>
          <h2 className="section-title">{GROUPE_LABELS[groupe] ?? groupe}</h2>
          <ul className="module-toggle-list">
            {mods.map((m) => {
              const actif = ctx.modules.has(m.cle as CleModule);
              return (
                <li key={m.cle} className="module-toggle-row">
                  <span>
                    <strong>{m.label}</strong>
                    <span className="muted"> · {m.cle}</span>
                  </span>
                  <form action={toggleOrganisationModule}>
                    <input type="hidden" name="module" value={m.cle} />
                    <input
                      type="hidden"
                      name="actif"
                      value={actif ? "0" : "1"}
                    />
                    <SubmitButton variant={actif ? "ghost" : "primary"} pendingLabel="…">
                      {actif ? "Désactiver" : "Activer"}
                    </SubmitButton>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
