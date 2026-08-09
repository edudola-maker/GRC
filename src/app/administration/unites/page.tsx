import { FlashBanner } from "@/components/Flash";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { PageHeader, BtnLink } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUnitesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const unites = await prisma.unite.findMany({
    include: {
      responsable: true,
      adjoint: true,
      _count: { select: { utilisateurs: true } },
    },
    orderBy: [{ actif: "desc" }, { code: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Unités"
        description="Administration technique des unités — distincte de la fiche métier « Mon unité »."
        actions={
          <BtnLink href="/administration/unites/nouveau">Nouvelle unité</BtnLink>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {unites.length === 0 ? (
        <InventoryEmpty>Aucune unité.</InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code / nom", "Responsable", "Statut"]}
          secondaryColumns={["Adjoint", "Utilisateurs", ""]}
        >
          {unites.map((u) => (
            <li key={u.id}>
              <InventoryRow
                href={`/administration/unites/${u.id}`}
                archived={!u.actif}
                primary={[
                  {
                    value: `${u.code} — ${u.nom}`,
                    emphasis: "title",
                  },
                  {
                    value: u.responsable
                      ? formatUtilisateurNom(u.responsable)
                      : "—",
                  },
                  {
                    value: u.actif ? "Actif" : "Inactif",
                    emphasis: "status",
                    badgeTone: u.actif ? "ok" : "neutral",
                  },
                ]}
                secondary={[
                  {
                    value: u.adjoint
                      ? formatUtilisateurNom(u.adjoint)
                      : "—",
                    emphasis: "muted",
                  },
                  {
                    value: `${u._count.utilisateurs} utilisateur${u._count.utilisateurs === 1 ? "" : "s"}`,
                    emphasis: "muted",
                  },
                  { value: "", emphasis: "muted" },
                ]}
              />
            </li>
          ))}
        </InventoryList>
      )}
    </>
  );
}
