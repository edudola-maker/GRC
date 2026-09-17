import { FlashBanner } from "@/components/Flash";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { PageHeader, BtnLink } from "@/components/ui";
import { toneFromStatut } from "@/components/ui/StatusBadge";
import { getOrgContext, whereOrgUnites } from "@/lib/organisation";
import { STATUT_OBJECTIF_LABELS, formatDateDot } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ObjectifsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getOrgContext();
  const objectifs = await prisma.objectif.findMany({
    where: whereOrgUnites(ctx),
    include: {
      responsable: true,
      axeStrategique: { select: { code: true, titre: true } },
    },
    orderBy: [{ annee: "desc" }, { code: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Objectifs"
        actions={
          <>
            <BtnLink href="/strategie">Stratégie</BtnLink>
            <BtnLink href="/objectifs/nouveau">Nouvel objectif</BtnLink>
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {objectifs.length === 0 ? (
        <InventoryEmpty>
          Aucun objectif.{" "}
          <a href="/strategie">Définir la stratégie</a> puis créer un objectif.
        </InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code / intitulé", "Axe", "Progression", "Statut"]}
          secondaryColumns={["Responsable", "Échéance", ""]}
        >
          {objectifs.map((o) => (
            <li key={o.id}>
              <InventoryRow
                href={`/objectifs/${o.id}`}
                primary={[
                  {
                    value: `${o.code} — ${o.intitule}`,
                    emphasis: "title",
                  },
                  {
                    value: o.axeStrategique
                      ? `${o.axeStrategique.code}`
                      : "—",
                  },
                  {
                    value: `${o.progression}%`,
                  },
                  {
                    value: STATUT_OBJECTIF_LABELS[o.statut] ?? o.statut,
                    emphasis: "status",
                    badgeTone: toneFromStatut(o.statut),
                  },
                ]}
                secondary={[
                  {
                    value: formatUtilisateurNom(o.responsable),
                    emphasis: "muted",
                  },
                  {
                    value: formatDateDot(o.dateEcheance),
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
