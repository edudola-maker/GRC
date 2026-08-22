import Link from "next/link";
import { FlashBanner } from "@/components/Flash";
import { InventoryCreateLink } from "@/components/inventory/InventoryCreateLink";
import { ModuleHelp } from "@/components/ModuleHelp";
import { PageHeader } from "@/components/ui";
import { MODULE_HELP } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MacroprocessusPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const rows = await prisma.macroprocessus.findMany({
    where: { uniteId },
    include: {
      responsable: true,
      _count: { select: { processus: true } },
    },
    orderBy: [{ archive: "asc" }, { ordre: "asc" }, { nom: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Macroprocessus"
        help={<ModuleHelp {...MODULE_HELP.macroprocessus} />}
        actions={
          <InventoryCreateLink
            href="/macroprocessus/nouveau"
            label="Nouveau macroprocessus"
          />
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {rows.length === 0 ? (
        <p className="empty">
          Aucun macroprocessus pour cette unité.{" "}
          <Link href="/macroprocessus/nouveau">Créer le premier</Link>.
        </p>
      ) : (
        <ul className="entity-list entity-list--compact">
          {rows.map((m) => (
            <li key={m.id} className="entity-row">
              <div className="entity-row__main">
                <Link href={`/macroprocessus/${m.id}`}>
                  <strong>
                    {m.code} — {m.nom}
                  </strong>
                  {m.archive ? (
                    <span className="muted"> (archivé)</span>
                  ) : null}
                </Link>
                <span className="entity-row__meta">
                  {m.responsable
                    ? formatUtilisateurNom(m.responsable)
                    : "Sans responsable"}{" "}
                  · {m._count.processus} processus · ordre {m.ordre}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
