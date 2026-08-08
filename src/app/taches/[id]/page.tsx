import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { TacheActionsRapides } from "@/components/TacheActionsRapides";
import { TacheChecklistPanel } from "@/components/taches/TacheChecklistPanel";
import { PageHeader, BtnLink } from "@/components/ui";
import { deleteTache } from "../actions";
import {
  CATEGORIE_TACHE_LABELS,
  PRIORITE_LABELS,
  STATUT_TACHE_LABELS,
  formatDate,
  urgenceEcheance,
} from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { listUtilisateursActifsForCurrentUnite } from "@/lib/session";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = ["CHECKLIST"] as const;
type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

const CHAMP_LABELS: Record<string, string> = {
  titre: "Titre",
  statut: "Statut",
  priorite: "Priorité",
  categorie: "Catégorie",
  responsable: "Responsable",
  responsableId: "Responsable",
  projet: "Projet",
  projetId: "Projet",
  dateEcheance: "Échéance",
};

function formatHistValue(champ: string, value: string | null) {
  if (value == null || value === "") return "—";
  if (champ === "statut") return STATUT_TACHE_LABELS[value] ?? value;
  if (champ === "priorite") return PRIORITE_LABELS[value] ?? value;
  if (champ === "categorie") return CATEGORIE_TACHE_LABELS[value] ?? value;
  if (champ === "dateEcheance") {
    try {
      return formatDate(value);
    } catch {
      return value;
    }
  }
  return value;
}

export default async function TacheDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);

  const [tache, users] = await Promise.all([
    prisma.tache.findUnique({
      where: { id },
      include: {
        responsable: true,
        projet: true,
        conseil: true,
        controleSCI: true,
        mission: true,
        document: true,
        recommandation: true,
        modeleTache: { select: { id: true, code: true, nom: true } },
        creePar: true,
        modifiePar: true,
        soumisPar: true,
        validePar: true,
        checklistItems: {
          include: { faitPar: { select: { nom: true } } },
          orderBy: { ordre: "asc" },
        },
        historique: {
          include: { modifiePar: true },
          orderBy: { modifieLe: "desc" },
          take: 20,
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
  ]);

  if (!tache) notFound();

  const clos = (TACHE_STATUTS_CLOS as readonly string[]).includes(tache.statut);
  const urgence = urgenceEcheance(tache.dateEcheance, clos);
  const baseHref = `/taches/${tache.id}`;
  const checklistVues = tache.checklistItems.map((i) => ({
    id: i.id,
    libelle: i.libelle,
    ordre: i.ordre,
    fait: i.fait,
    faitParNom: i.faitPar?.nom ?? null,
    faitLeLabel: i.faitLe ? formatDate(i.faitLe) : null,
  }));

  return (
    <>
      <BackLink href="/taches" label="← Retour aux tâches" />
      <PageHeader
        title={tache.titre}
        description={tache.description ?? "Aucune description."}
        actions={
          <>
            <BtnLink href={`/taches/${tache.id}/modifier`}>Modifier</BtnLink>
            <ConfirmDeleteButton
              action={deleteTache}
              id={tache.id}
              confirmMessage="Supprimer définitivement cette tâche ?"
            />
          </>
        }
      />

      <FlashBanner ok={sp.ok} erreur={sp.erreur} />

      {urgence === "retard" ? (
        <div className="flash flash--error" role="status">
          Cette tâche est en retard (échéance {formatDate(tache.dateEcheance)}).
        </div>
      ) : urgence === "bientot" ? (
        <div className="flash flash--warn" role="status">
          Échéance proche : {formatDate(tache.dateEcheance)}.
        </div>
      ) : null}

      <div className="detail-grid">
        <CollapsibleSection title="Informations" defaultOpen>
          <dl className="kv">
            <div>
              <dt>Catégorie</dt>
              <dd>{CATEGORIE_TACHE_LABELS[tache.categorie]}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{tache.responsable.nom}</dd>
            </div>
            <div>
              <dt>Projet</dt>
              <dd>
                {tache.projet ? (
                  <Link href={`/projets/${tache.projet.id}`}>
                    {tache.projet.nom}
                    {tache.projet.archive ? " (archivé)" : ""}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            {tache.conseil ? (
              <div>
                <dt>Conseil</dt>
                <dd>
                  <Link href={`/conseils/${tache.conseil.id}`}>
                    {tache.conseil.objet}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.controleSCI ? (
              <div>
                <dt>Contrôle SCI</dt>
                <dd>
                  <Link href={`/controles-sci/${tache.controleSCI.id}`}>
                    {tache.controleSCI.nom}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.mission ? (
              <div>
                <dt>Mission</dt>
                <dd>
                  <Link href={`/audits/${tache.mission.id}`}>
                    {tache.mission.titre}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.document ? (
              <div>
                <dt>Document</dt>
                <dd>
                  <Link href={`/documents/${tache.document.id}`}>
                    {tache.document.nom}
                  </Link>
                </dd>
              </div>
            ) : null}
            {tache.recommandation ? (
              <div>
                <dt>Recommandation</dt>
                <dd>{tache.recommandation.titre}</dd>
              </div>
            ) : null}
            {tache.modeleTache ? (
              <div>
                <dt>Modèle d’origine</dt>
                <dd>
                  <Link href={`/modeles-taches/${tache.modeleTache.id}`}>
                    {tache.modeleTache.code} — {tache.modeleTache.nom}
                  </Link>
                  <span className="muted">
                    {" "}
                    (référence informative — pas de sync)
                  </span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Statut</dt>
              <dd>{STATUT_TACHE_LABELS[tache.statut]}</dd>
            </div>
            <div>
              <dt>Priorité</dt>
              <dd>{PRIORITE_LABELS[tache.priorite]}</dd>
            </div>
            <div>
              <dt>Création</dt>
              <dd>{formatDate(tache.dateCreation)}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>
                {formatDate(tache.dateEcheance)}
                {urgence === "retard" ? (
                  <span className="tag tag--danger"> En retard</span>
                ) : null}
              </dd>
            </div>
          </dl>
          {tache.commentaires ? (
            <p className="detail-note">{tache.commentaires}</p>
          ) : null}

          {(tache.soumisPar || tache.validePar) && (
            <dl className="kv kv--compact">
              {tache.soumisPar ? (
                <div>
                  <dt>Soumis par</dt>
                  <dd>
                    {tache.soumisPar.nom} · {formatDate(tache.dateSoumission)}
                  </dd>
                </div>
              ) : null}
              {tache.validePar ? (
                <div>
                  <dt>Validé par</dt>
                  <dd>
                    {tache.validePar.nom} · {formatDate(tache.dateValidation)}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}

          <p className="detail-trace">
            Créé par {tache.creePar.nom} · Modifié par {tache.modifiePar.nom} ·{" "}
            {formatDate(tache.modifieLe)}
          </p>
        </CollapsibleSection>

        <div className="stack-panels">
          <TacheActionsRapides
            tacheId={tache.id}
            statut={tache.statut}
            priorite={tache.priorite}
            responsableId={tache.responsableId}
            users={users}
          />

          <CollapsibleSection title="Historique" defaultOpen={false}>
            {tache.historique.length === 0 ? (
              <p className="empty">Aucune modification enregistrée.</p>
            ) : (
              <ul className="history-list">
                {tache.historique.map((h) => (
                  <li key={h.id}>
                    <strong>{CHAMP_LABELS[h.champModifie] ?? h.champModifie}</strong>
                    <span>
                      {formatHistValue(h.champModifie, h.ancienneValeur)} →{" "}
                      {formatHistValue(h.champModifie, h.nouvelleValeur)}
                    </span>
                    <em>
                      {h.modifiePar.nom} · {formatDate(h.modifieLe)}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>
        </div>
      </div>

      <EditableSection
        title="Checklist d’exécution"
        sectionKey="CHECKLIST"
        baseHref={baseHref}
        edit={edit}
        canEdit
        defaultOpen
        badge={
          tache.checklistItems.length
            ? `${tache.checklistItems.filter((i) => i.fait).length}/${tache.checklistItems.length}`
            : "0"
        }
        editChildren={
          <>
            <TacheChecklistPanel
              tacheId={tache.id}
              items={checklistVues}
              structureEditable
            />
            <div className="form-actions">
              <BtnLink href={baseHref} variant="ghost">
                Terminer
              </BtnLink>
            </div>
          </>
        }
      >
        <TacheChecklistPanel
          tacheId={tache.id}
          items={checklistVues}
          structureEditable={false}
        />
      </EditableSection>

      <ElementsAssocies
        uniteId={tache.uniteId}
        type="TACHE"
        id={tache.id}
        retour={`/taches/${tache.id}`}
      />
    </>
  );
}
