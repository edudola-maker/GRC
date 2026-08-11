import { PageHeader } from "@/components/ui";
import { FlashBanner } from "@/components/Flash";
import { ModuleHelp } from "@/components/ModuleHelp";
import { KpiZone } from "@/components/module/KpiZone";
import {
  ModeleTacheInventory,
  type ModeleTacheInventoryItem,
} from "@/components/modeles-taches/ModeleTacheInventory";
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

  const items: ModeleTacheInventoryItem[] = rows.map((m) => ({
    id: m.id,
    code: m.code,
    nom: m.nom,
    actif: m.actif,
    etapesCount: m._count.etapes,
    processusCount: m._count.processus,
    parametres: [
      m.delaiJours != null ? `${m.delaiJours} j` : null,
      m.categorieDefaut
        ? (CATEGORIE_TACHE_LABELS[m.categorieDefaut] ?? m.categorieDefaut)
        : null,
      m.responsableDefaut?.nom ?? null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <>
      <PageHeader
        title="Modèles de tâches"
        help={<ModuleHelp {...MODULE_HELP.modelesTaches} />}
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <KpiZone
        items={[
          { value: actifs, label: "actifs", tone: "ok" },
          { value: rows.length - actifs, label: "inactifs" },
          { value: rows.length, label: "total" },
        ]}
      />

      <ModeleTacheInventory
        items={items}
        createHref="/modeles-taches/nouveau"
        createLabel="Nouveau modèle"
      />
    </>
  );
}
