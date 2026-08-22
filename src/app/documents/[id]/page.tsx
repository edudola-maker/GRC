import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
  SubmitButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { DocumentForm } from "@/components/EntityForms";
import { DocumentProcessusPanel } from "@/components/documents/DocumentProcessusPanel";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveDocument,
  creerTacheRevue,
  deleteDocument,
  unarchiveDocument,
  updateDocument,
} from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  FREQUENCE_REVUE_LABELS,
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_DOCUMENT_LABELS,
  STATUT_TACHE_LABELS,
  TYPE_DOCUMENT_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, listUtilisateursActifsForCurrentUnite } from "@/lib/session";
import { parseTags } from "@/lib/tags";
import { listUnitesActives } from "@/lib/unites-referentiel";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit =
    sp.edit === "INFOS_GENERALES" ||
    sp.edit === "ELEMENTS_ASSOCIES" ||
    sp.edit === "PROCESSUS"
      ? sp.edit
      : null;
  const user = await getCurrentUser();
  const [document, users, processusActifs, unites] = await Promise.all([
    prisma.document.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        tachesRevue: {
          include: { responsable: true },
          orderBy: { dateEcheance: "asc" },
        },
        processus: {
          include: {
            processus: { select: { id: true, code: true, nom: true } },
          },
          orderBy: { lieLe: "asc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      orderBy: { nom: "asc" },
      select: { id: true, code: true, nom: true },
    }),
    listUnitesActives(),
  ]);
  if (!document) notFound();

  const baseHref = `/documents/${document.id}`;
  const canEdit = !document.archive;
  const revueUrgence = urgenceEcheance(
    document.prochaineRevue,
    document.archive ||
      document.statut === "OBSOLETE" ||
      document.statut === "ARCHIVE",
  );
  const tags = parseTags(document.tags);
  const confluenceUrl =
    document.reference && /^https?:\/\//i.test(document.reference)
      ? document.reference
      : null;

  return (
    <>
      <BackLink href="/documents" label="← Retour aux documents" />
      <PageHeader
        title={`${document.code} — ${document.nom}`}
        description={document.description ?? "Aucune description."}
        actions={
          <>
            {document.archive ? (
              <ConfirmActionButton
                action={unarchiveDocument}
                id={document.id}
                label="Désarchiver"
                confirmMessage="Remettre ce document dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveDocument}
                id={document.id}
                label="Archiver"
                confirmMessage="Archiver ce document ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteDocument}
              id={document.id}
              confirmMessage="Supprimer définitivement ce document ? Les tâches de revue resteront."
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {document.archive ? (
        <div className="flash flash--warn" role="status">
          Ce document est archivé.
        </div>
      ) : null}
      {revueUrgence === "retard" ? (
        <div className="flash flash--error" role="status">
          Revue en retard (échéance {formatDate(document.prochaineRevue)}).
        </div>
      ) : null}

      <EditableSection
        title="Informations"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen
        editChildren={
          <DocumentForm
            action={updateDocument}
            users={users}
            unites={unites}
            values={document}
            cancelHref={baseHref}
            sectionKey="INFOS_GENERALES"
            submitLabel="Enregistrer"
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{document.code}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{TYPE_DOCUMENT_LABELS[document.typeDocument]}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{document.version ?? "—"}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{document.responsable?.nom ?? "—"}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_DOCUMENT_LABELS[document.statut]}</dd>
          </div>
          <div>
            <dt>Page Confluence</dt>
            <dd>
              {confluenceUrl ? (
                <a href={confluenceUrl} target="_blank" rel="noreferrer">
                  {document.reference}
                </a>
              ) : (
                (document.reference ?? "—")
              )}
            </dd>
          </div>
          <div>
            <dt>Fréquence de revue</dt>
            <dd>
              {document.frequenceRevue
                ? FREQUENCE_REVUE_LABELS[document.frequenceRevue]
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Fenêtre de déclenchement</dt>
            <dd>{document.fenetreDeclenchementJours} j.</dd>
          </div>
          <div>
            <dt>Approbation</dt>
            <dd>{formatDate(document.dateApprobation)}</dd>
          </div>
          <div>
            <dt>Dernière revue</dt>
            <dd>{formatDate(document.dateDerniereRevue)}</dd>
          </div>
          <div>
            <dt>Prochaine revue</dt>
            <dd>{formatDate(document.prochaineRevue)}</dd>
          </div>
          <div>
            <dt>Données personnelles</dt>
            <dd>
              {document.contientDonneesPersonnelles ? "Oui" : "Non"}
            </dd>
          </div>
          <div>
            <dt>Niveau de confidentialité</dt>
            <dd>
              {NIVEAU_CONFIDENTIALITE_LABELS[document.niveauConfidentialite] ??
                document.niveauConfidentialite}
            </dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {document.creePar.nom}
          {document.modifiePar
            ? ` · Modifié par ${document.modifiePar.nom}`
            : ""}{" "}
          · {formatDate(document.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Processus liés"
        sectionKey="PROCESSUS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen
        badge={`${document.processus.length}`}
        editChildren={
          <DocumentProcessusPanel
            documentId={document.id}
            links={document.processus}
            candidats={processusActifs}
            editable
          />
        }
      >
        <DocumentProcessusPanel
          documentId={document.id}
          links={document.processus}
          candidats={processusActifs}
          editable={false}
        />
      </EditableSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={`/documents/${document.id}`}
        edit={edit}
        canEdit={!document.archive}
        defaultOpen
        editChildren={
          <ElementsAssocies
            uniteId={user.uniteId}
            type="DOCUMENT"
            id={document.id}
            retour={`/documents/${document.id}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="DOCUMENT"
          id={document.id}
          retour={`/documents/${document.id}`}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Tâches de revue"
        badge={document.tachesRevue.length}
        defaultOpen
        className="collapsible-section--secondary"
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Actions découlant du document — exécution opérationnelle de la revue.
        </p>
        {!document.archive ? (
          <form
            action={creerTacheRevue}
            className="form-actions"
            style={{ marginBottom: "0.65rem" }}
          >
            <input type="hidden" name="documentId" value={document.id} />
            <SubmitButton>Créer une tâche de revue</SubmitButton>
            <BtnLink
              href={`/taches/nouvelle?documentId=${document.id}&categorie=DOCUMENT`}
              variant="ghost"
            >
              Formulaire complet
            </BtnLink>
          </form>
        ) : null}
        {document.tachesRevue.length === 0 ? (
          <p className="empty">Aucune tâche de revue.</p>
        ) : (
          <ul className="entity-list entity-list--compact">
            {document.tachesRevue.map((t) => {
              const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(
                t.statut,
              );
              const urgence = urgenceEcheance(t.dateEcheance, clos);
              return (
                <li key={t.id}>
                  <Link
                    href={`/taches/${t.id}`}
                    className={`entity-row entity-row--${urgence}`}
                  >
                    <div className="entity-row__main">
                      <strong>{t.titre}</strong>
                      <span className="entity-row__meta">
                        {CATEGORIE_TACHE_LABELS[t.categorie]} ·{" "}
                        {t.responsable.nom} · {STATUT_TACHE_LABELS[t.statut]}
                      </span>
                    </div>
                    <span className="entity-row__date">
                      {formatDate(t.dateEcheance)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Tags" defaultOpen>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </>
  );
}
