import { PageHeader, BtnLink } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiStat, KpiZone } from "@/components/module/KpiZone";
import {
  InventoryEmpty,
  InventoryList,
  InventoryRow,
} from "@/components/inventory/InventoryRow";
import { MODULE_HELP } from "@/lib/catalog";
import { CATEGORIE_TACHE_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ModelesTachesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [rows, actifs] = await Promise.all([
    prisma.modeleTache.findMany({
      where: { uniteId },
      include: {
        responsableDefaut: true,
        _count: { select: { etapes: true, processus: true } },
      },
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
    }),
    prisma.modeleTache.count({ where: { uniteId, actif: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Modèles de tâches"
        description="Catalogue de checklists standard. Une tâche créée depuis un modèle reçoit une copie — sans synchronisation rétroactive."
        actions={
          <BtnLink href="/modeles-taches/nouveau">Nouveau modèle</BtnLink>
        }
      />
      <ModuleHelp {...MODULE_HELP.modelesTaches} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone>
        <KpiStat value={actifs} label="Actifs" />
        <KpiStat value={rows.length - actifs} label="Inactifs" />
        <KpiStat value={rows.length} label="Total" />
      </KpiZone>

      {rows.length === 0 ? (
        <InventoryEmpty>Aucun modèle pour cette unité.</InventoryEmpty>
      ) : (
        <InventoryList
          columns={["Code / nom", "Checklist", "État"]}
          secondaryColumns={["Paramètres", "Processus", ""]}
        >
          {rows.map((m) => (
            <li key={m.id}>
              <InventoryRow
                href={`/modeles-taches/${m.id}`}
                archived={!m.actif}
                primary={[
                  {
                    value: `${m.code} — ${m.nom}`,
                    emphasis: "title",
                  },
                  {
                    value: `${m._count.etapes} étape${m._count.etapes === 1 ? "" : "s"}`,
                  },
                  {
                    value: m.actif ? "Actif" : "Inactif",
                    emphasis: "status",
                    badgeTone: m.actif ? "ok" : "neutral",
                  },
                ]}
                secondary={[
                  {
                    value: [
                      m.delaiJours != null ? `${m.delaiJours} j` : null,
                      m.categorieDefaut
                        ? (CATEGORIE_TACHE_LABELS[m.categorieDefaut] ??
                          m.categorieDefaut)
                        : null,
                      m.responsableDefaut?.nom ?? null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—",
                    emphasis: "muted",
                  },
                  {
                    value: `${m._count.processus} processus`,
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
