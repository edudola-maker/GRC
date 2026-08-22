import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { ActifITForm } from "@/components/actifs-it/ActifITForm";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader } from "@/components/ui";
import {
  archiveActifIT,
  deleteActifIT,
  linkActifProcessus,
  unlinkActifProcessus,
  unarchiveActifIT,
  updateActifIT,
} from "../actions";
import {
  STATUT_ACTIF_IT_LABELS,
  TYPE_ACTIF_IT_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";

export const dynamic = "force-dynamic";

export default async function ActifITDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = sp.edit === "INFOS" || sp.edit === "PROCESSUS" ? sp.edit : null;
  const user = await getCurrentUser();

  const [actif, usersRaw, processusActifs, unites] = await Promise.all([
    prisma.actifIT.findUnique({
      where: { id },
      include: {
        responsable: true,
        unite: { select: { id: true, code: true, nom: true } },
        creePar: true,
        modifiePar: true,
        processus: {
          include: {
            processus: {
              select: { id: true, code: true, nom: true, statut: true },
            },
          },
          orderBy: { lieLe: "desc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    listUnitesActives(),
  ]);

  if (!actif || actif.uniteId !== user.uniteId) notFound();

  const users = usersRaw.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));
  const baseHref = `/actifs-it/${actif.id}`;
  const liesIds = new Set(actif.processus.map((l) => l.processusId));
  const disponibles = processusActifs.filter((p) => !liesIds.has(p.id));

  return (
    <>
      <BackLink href="/actifs-it" label="← Retour aux actifs" />
      <PageHeader
        title={`${actif.code} — ${actif.nom}`}
        actions={
          !actif.archive ? (
            <>
              <ConfirmActionButton
                action={archiveActifIT}
                id={actif.id}
                label="Archiver"
                confirmMessage="Archiver cet actif ?"
              />
              <ConfirmDeleteButton
                action={deleteActifIT}
                id={actif.id}
                label="Supprimer"
                confirmMessage="Supprimer définitivement cet actif ?"
              />
            </>
          ) : (
            <ConfirmActionButton
              action={unarchiveActifIT}
              id={actif.id}
              label="Restaurer"
              confirmMessage="Restaurer cet actif ?"
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
        canEdit={!actif.archive}
        defaultOpen
        editChildren={
          <ActifITForm
            action={updateActifIT}
            users={users}
            unites={unites}
            values={actif}
            cancelHref={baseHref}
            submitLabel="Enregistrer"
          />
        }
      >
        <dl className="detail-dl">
          <div>
            <dt>Code</dt>
            <dd>{actif.code}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{TYPE_ACTIF_IT_LABELS[actif.type] ?? actif.type}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_ACTIF_IT_LABELS[actif.statut] ?? actif.statut}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>
              {actif.unite.code} — {actif.unite.nom}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>
              {actif.responsable
                ? formatUtilisateurNom(actif.responsable)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Fournisseur</dt>
            <dd>{actif.fournisseur ?? "—"}</dd>
          </div>
          <div>
            <dt>Hébergement</dt>
            <dd>{actif.hebergement ?? "—"}</dd>
          </div>
          <div>
            <dt>Service fourni</dt>
            <dd>{actif.serviceFourni ?? "—"}</dd>
          </div>
          <div>
            <dt>Criticité</dt>
            <dd>{actif.criticite != null ? `${actif.criticite} / 5` : "—"}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{actif.description ?? "—"}</dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {formatUtilisateurNom(actif.creePar)} · Modifié par{" "}
          {formatUtilisateurNom(actif.modifiePar)} ·{" "}
          {formatDate(actif.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Processus dépendants"
        sectionKey="PROCESSUS"
        baseHref={baseHref}
        edit={edit}
        canEdit={!actif.archive}
        defaultOpen
        badge={`${actif.processus.length}`}
        editChildren={
          <div>
            <p className="muted" style={{ marginTop: 0 }}>
              Si cet actif devient indisponible, ces processus sont
              potentiellement impactés.
            </p>
            {actif.processus.length === 0 ? (
              <p className="empty">Aucun processus lié.</p>
            ) : (
              <ul className="unite-activite__list">
                {actif.processus.map((l) => (
                  <li key={l.id}>
                    <div>
                      <Link href={`/processus/${l.processus.id}`}>
                        <strong>
                          {l.processus.code} — {l.processus.nom}
                        </strong>
                      </Link>
                    </div>
                    <form action={unlinkActifProcessus}>
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="retour"
                        value={`${baseHref}?edit=PROCESSUS`}
                      />
                      <SubmitButton variant="ghost">Retirer</SubmitButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {disponibles.length > 0 ? (
              <form action={linkActifProcessus} className="inline-add-form">
                <input type="hidden" name="actifITId" value={actif.id} />
                <input
                  type="hidden"
                  name="retour"
                  value={`${baseHref}?edit=PROCESSUS`}
                />
                <select name="processusId" required defaultValue="">
                  <option value="" disabled>
                    Lier un processus…
                  </option>
                  {disponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.nom}
                    </option>
                  ))}
                </select>
                <SubmitButton>Lier</SubmitButton>
              </form>
            ) : null}
          </div>
        }
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Si cet actif devient indisponible, ces processus sont potentiellement
          impactés.
        </p>
        {actif.processus.length === 0 ? (
          <p className="empty">Aucun processus lié.</p>
        ) : (
          <ul className="unite-activite__list">
            {actif.processus.map((l) => (
              <li key={l.id}>
                <Link href={`/processus/${l.processus.id}`}>
                  <strong>
                    {l.processus.code} — {l.processus.nom}
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </EditableSection>

      <ElementsAssocies
        uniteId={actif.uniteId}
        type="ACTIF_IT"
        id={actif.id}
        retour={baseHref}
        editable={false}
      />

      <CollapsibleSection title="Notes" defaultOpen={false}>
        <p className="muted" style={{ margin: 0 }}>
          Référentiel léger — pas une CMDB. Sécurité de l’information avancée
          (CIA, données traitées…) : Roadmap.
        </p>
      </CollapsibleSection>
    </>
  );
}
