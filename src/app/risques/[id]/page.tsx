import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { FlashBanner, BackLink } from "@/components/Flash";
import { RisqueForm } from "@/components/EntityForms";
import { HistoriqueTimeline } from "@/components/historique/HistoriqueTimeline";
import { JournalTimeline } from "@/components/historique/JournalTimeline";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { PageHeader } from "@/components/ui";
import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import { QuickTacheForm } from "@/components/taches/QuickTacheForm";
import { RisqueReevaluationForm } from "@/components/risques/RisqueReevaluationForm";
import { archiveRisque, deleteRisque, updateRisque } from "../actions";
import { listerHistorique } from "@/lib/historique";
import { listerJournal } from "@/lib/journal";
import {
  CATEGORIE_RISQUE_LABELS,
  STATUT_CONTROLE_LABELS,
  STATUT_RISQUE_LABELS,
  STRATEGIE_RISQUE_LABELS,
  criticiteNiveau,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import {
  CHAMP_RISQUE_LABELS,
  formatRisqueHistValue,
} from "@/lib/risque-historique";
import { parseTags } from "@/lib/tags";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,} from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RisqueDetailPage({
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
    sp.edit === "REEVALUATION"
      ? sp.edit
      : null;
  const user = await getCurrentUser();

  const [risque, users, historique, journal, reevaluations, processus] =
    await Promise.all([
    prisma.risque.findUnique({
      where: { id },
      include: {
        unite: { select: { id: true, nom: true, code: true } },
        responsable: true,
        creePar: true,
        processusRef: { select: { id: true, code: true, nom: true } },
        controles: {
          include: {
            controle: {
              include: { responsable: true },
            },
          },
          orderBy: { creeLe: "asc" },
        },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listerHistorique("RISQUE", id),
    listerJournal("RISQUE", id),
    prisma.risqueReevaluation.findMany({
      where: { risqueId: id },
      include: { auteur: true },
      orderBy: [{ dateReevaluation: "desc" }, { creeLe: "desc" }],
    }),
    prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false },
      orderBy: { nom: "asc" },
      select: { id: true, code: true, nom: true },
    }),
  ]);

  if (!risque) notFound();

  const niveau = criticiteNiveau(risque.criticite);
  const tags = parseTags(risque.tags);
  const baseHref = `/risques/${risque.id}`;
  const canEdit = !risque.archive;
  const processusOptions = processus.map((p) => ({
    id: p.id,
    label: `${p.code} — ${p.nom}`,
  }));

  return (
    <>
      <BackLink href="/risques" label="← Retour aux risques" />
      <PageHeader
        title={`${risque.code} — ${risque.nom}`}
        actions={
          <>
            <ConfirmActionButton
              action={archiveRisque}
              id={risque.id}
              fields={{ archive: risque.archive ? "0" : "1" }}
              label={risque.archive ? "Désarchiver" : "Archiver"}
              confirmMessage={
                risque.archive
                  ? "Remettre ce risque dans la liste active ?"
                  : "Archiver ce risque ?"
              }
            />
            <ConfirmDeleteButton
              action={deleteRisque}
              id={risque.id}
              confirmMessage="Supprimer définitivement ce risque ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <TrackRecentView
        href={`/risques/${risque.id}`}
        label={`${risque.code} — ${risque.nom}`}
      />

      {risque.archive ? (
        <div className="flash flash--warn" role="status">
          Ce risque est archivé.
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
          <RisqueForm
            action={updateRisque}
            users={users}
            values={risque}
            cancelHref={baseHref}
            sectionKey="INFOS_GENERALES"
            submitLabel="Enregistrer"
            processusOptions={processusOptions}
          />
        }
      >
        {risque.description ? (
          <p className="detail-note" style={{ marginTop: 0 }}>
            {risque.description}
          </p>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            Aucune description.
          </p>
        )}
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{risque.code}</dd>
          </div>
          <div>
            <dt>Unité</dt>
            <dd>{risque.unite?.nom ?? "—"}</dd>
          </div>
          <div>
            <dt>Catégorie</dt>
            <dd>{CATEGORIE_RISQUE_LABELS[risque.categorie]}</dd>
          </div>
          <div>
            <dt>Processus lié</dt>
            <dd>
              {risque.processusRef ? (
                <Link href={`/processus/${risque.processusRef.id}`}>
                  {risque.processusRef.code} — {risque.processusRef.nom}
                </Link>
              ) : risque.processus ? (
                <span className="muted" title="Libellé libre historique">
                  {risque.processus}
                </span>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Évaluation inhérente</dt>
            <dd>
              <span className={`criticite-pill criticite-pill--${niveau}`}>
                P{risque.probabilite} · I{risque.impact} · {risque.criticite}
              </span>
            </dd>
          </div>
          <div>
            <dt>Évaluation résiduelle</dt>
            <dd>
              {risque.probabiliteResiduelle != null &&
              risque.impactResiduel != null &&
              risque.criticiteResiduelle != null ? (
                <span
                  className={`criticite-pill criticite-pill--${criticiteNiveau(risque.criticiteResiduelle)}`}
                >
                  P{risque.probabiliteResiduelle} · I{risque.impactResiduel} ·{" "}
                  {risque.criticiteResiduelle}
                </span>
              ) : (
                "Non renseigné"
              )}
            </dd>
          </div>
          <div>
            <dt>Stratégie</dt>
            <dd>
              {risque.strategie
                ? STRATEGIE_RISQUE_LABELS[risque.strategie]
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{risque.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_RISQUE_LABELS[risque.statut]}</dd>
          </div>
          <div>
            <dt>Contrôles SCI liés</dt>
            <dd>
              {risque.controles.length === 0 ? (
                "Aucun"
              ) : (
                <ul className="inline-link-list">
                  {risque.controles.map(({ controle: c }) => (
                    <li key={c.id}>
                      <Link href={`/controles-sci/${c.id}`}>
                        {c.code} — {c.nom}
                      </Link>
                      <span className="muted">
                        {" "}
                        · {STATUT_CONTROLE_LABELS[c.statut]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
        {risque.justificationEvaluation ? (
          <p className="detail-note">{risque.justificationEvaluation}</p>
        ) : null}
        {risque.commentaires ? (
          <p className="detail-note">{risque.commentaires}</p>
        ) : null}
      </EditableSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={`/risques/${risque.id}`}
        edit={edit}
        canEdit={!risque.archive}
        defaultOpen
        editChildren={
          <ElementsAssocies
            uniteId={user.uniteId}
            type="RISQUE"
            id={risque.id}
            retour={`/risques/${risque.id}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="RISQUE"
          id={risque.id}
          retour={`/risques/${risque.id}`}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      {!risque.archive ? (
        <CollapsibleSection title="Actions" defaultOpen>
          <QuickTacheForm
            users={users.map((u) => ({
              id: u.id,
              nom: formatUtilisateurNom(u),
            }))}
            retour={`/risques/${risque.id}`}
            defaults={{ responsableId: risque.responsableId }}
            hidden={{ risqueId: risque.id }}
          />
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection title="Tags" defaultOpen>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>

      <EditableSection
        title="Réévaluations"
        sectionKey="REEVALUATION"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen={false}
        badge={`${reevaluations.length}`}
        editChildren={
          <RisqueReevaluationForm values={risque} cancelHref={baseHref} />
        }
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Actes de revue du risque — tracés même sans changement de notes.
          Distinct de l’Historique (modifications de champs) et du Journal.
        </p>
        {reevaluations.length === 0 ? (
          <p className="empty">Aucune réévaluation documentée.</p>
        ) : (
          <ul className="reevaluation-list">
            {reevaluations.map((r) => {
              const changed =
                r.probabiliteAvant !== r.probabiliteApres ||
                r.impactAvant !== r.impactApres ||
                r.probabiliteResiduelleAvant !== r.probabiliteResiduelleApres ||
                r.impactResiduelAvant !== r.impactResiduelApres;
              const fmt = (p: number, i: number, c: number) =>
                `P${p} · I${i} · ${c}`;
              const fmtRes = (
                p: number | null,
                i: number | null,
                c: number | null,
              ) =>
                p != null && i != null && c != null
                  ? fmt(p, i, c)
                  : "non renseigné";
              return (
                <li key={r.id} className="reevaluation-item">
                  <div className="reevaluation-item__head">
                    <strong>{formatDate(r.dateReevaluation)}</strong>
                    <span className="muted">
                      {" "}
                      · {formatUtilisateurNom(r.auteur)}
                      {changed ? "" : " · notes inchangées"}
                    </span>
                  </div>
                  <p className="reevaluation-item__scores">
                    Inhérent : {fmt(r.probabiliteAvant, r.impactAvant, r.criticiteAvant)}
                    {" → "}
                    {fmt(r.probabiliteApres, r.impactApres, r.criticiteApres)}
                    <br />
                    Résiduel :{" "}
                    {fmtRes(
                      r.probabiliteResiduelleAvant,
                      r.impactResiduelAvant,
                      r.criticiteResiduelleAvant,
                    )}
                    {" → "}
                    {fmtRes(
                      r.probabiliteResiduelleApres,
                      r.impactResiduelApres,
                      r.criticiteResiduelleApres,
                    )}
                  </p>
                  <p className="detail-note">{r.commentaire}</p>
                </li>
              );
            })}
          </ul>
        )}
      </EditableSection>

      <CollapsibleSection
        title="Historique"
        defaultOpen={false}
        badge={`v${risque.contenuVersion}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Modifications de contenu enregistrées (qui / quand / avant → après).
          Version contenu actuelle : {risque.contenuVersion}
          {" — "}base pour de futures validations (version visée).
        </p>
        <HistoriqueTimeline
          entries={historique}
          champLabels={CHAMP_RISQUE_LABELS}
          formatValue={formatRisqueHistValue}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Journal d’activité"
        defaultOpen={false}
        badge={`${journal.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Événements fonctionnels (création, statut, archivage, liaisons,
          réévaluation) — distinct de l’historique des champs.
        </p>
        <p className="detail-trace" style={{ marginTop: 0 }}>
          Créé par {risque.creePar.nom} · {formatDate(risque.creeLe)}
        </p>
        <JournalTimeline entries={journal} />
      </CollapsibleSection>
    </>
  );
}
