import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmActionButton } from "@/components/FormControls";
import { MacroprocessusForm } from "@/components/macroprocessus/MacroprocessusForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader } from "@/components/ui";
import {
  archiveMacroprocessus,
  unarchiveMacroprocessus,
  updateMacroprocessus,
} from "../actions";
import { formatDate } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MacroprocessusDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "INFOS" ? "INFOS" : null;
  const user = await getCurrentUser();

  const [macro, usersRaw, unites] = await Promise.all([
    prisma.macroprocessus.findUnique({
      where: { id },
      include: {
        unite: { select: { id: true, code: true, nom: true } },
        responsable: true,
        creePar: true,
        modifiePar: true,
        unitesApplicables: {
          include: { unite: { select: { id: true, code: true, nom: true } } },
          orderBy: { unite: { nom: "asc" } },
        },
        processus: {
          where: { archive: false },
          select: { id: true, code: true, nom: true },
          orderBy: [{ code: "asc" }],
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.unite.findMany({
      where: { actif: true },
      select: { id: true, nom: true, code: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  if (!macro) notFound();

  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));
  const baseHref = `/macroprocessus/${macro.id}`;

  return (
    <>
      <BackLink href="/macroprocessus" label="← Retour aux macroprocessus" />
      <PageHeader
        title={`${macro.code} — ${macro.nom}`}
        description={
          macro.archive
            ? "Macroprocessus archivé"
            : "Famille d’activités — rattachez les processus ci-dessous."
        }
        actions={
          !macro.archive ? (
            <ConfirmActionButton
              action={archiveMacroprocessus}
              id={macro.id}
              label="Archiver"
              confirmMessage="Archiver ce macroprocessus ?"
            />
          ) : (
            <ConfirmActionButton
              action={unarchiveMacroprocessus}
              id={macro.id}
              label="Restaurer"
              confirmMessage="Restaurer ce macroprocessus ?"
            />
          )
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      <EditableSection
        title="Informations"
        sectionKey="INFOS"
        baseHref={baseHref}
        edit={edit}
        canEdit={!macro.archive}
        defaultOpen
        editChildren={
          <MacroprocessusForm
            action={updateMacroprocessus}
            users={users}
            unites={unites}
            values={{
              id: macro.id,
              code: macro.code,
              nom: macro.nom,
              description: macro.description,
              responsableId: macro.responsableId,
              ordre: macro.ordre,
              uniteId: macro.uniteId,
              applicableUniteIds: macro.unitesApplicables.map((a) => a.uniteId),
            }}
            cancelHref={baseHref}
            submitLabel="Enregistrer"
          />
        }
      >
        <dl className="detail-dl">
          <div>
            <dt>Code</dt>
            <dd>{macro.code}</dd>
          </div>
          <div>
            <dt>Unité propriétaire</dt>
            <dd>
              {macro.unite.code} — {macro.unite.nom}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>
              {macro.responsable
                ? formatUtilisateurNom(macro.responsable)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Ordre</dt>
            <dd>{macro.ordre}</dd>
          </div>
          <div>
            <dt>Description / finalité</dt>
            <dd>{macro.description ?? "—"}</dd>
          </div>
          <div>
            <dt>Unités applicables</dt>
            <dd>
              {macro.unitesApplicables.length === 0
                ? "—"
                : macro.unitesApplicables
                    .map((a) => `${a.unite.code} — ${a.unite.nom}`)
                    .join(", ")}
            </dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {formatUtilisateurNom(macro.creePar)} · Modifié par{" "}
          {formatUtilisateurNom(macro.modifiePar)} ·{" "}
          {formatDate(macro.modifieLe)}
        </p>
      </EditableSection>

      <CollapsibleSection
        title="Processus rattachés"
        badge={`${macro.processus.length}`}
        defaultOpen
      >
        {macro.processus.length === 0 ? (
          <p className="empty">Aucun processus rattaché à ce macroprocessus.</p>
        ) : (
          <ul className="unite-activite__list">
            {macro.processus.map((p) => (
              <li key={p.id}>
                <Link href={`/processus/${p.id}`}>
                  <strong>
                    {p.code} — {p.nom}
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </>
  );
}
