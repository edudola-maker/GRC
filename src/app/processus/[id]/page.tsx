import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ConfirmActionButton,
  ConfirmDeleteButton,
} from "@/components/FormControls";
import { TrackRecentView } from "@/components/dashboard/ReprendreTravail";
import { ProcessusForm } from "@/components/EntityForms";
import { FlashBanner, BackLink } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { ProcessusEtapesPanel } from "@/components/processus/ProcessusEtapesPanel";
import { ProcessusModelesTachesPanel } from "@/components/processus/ProcessusModelesTachesPanel";
import { ProcessusRaciPanel } from "@/components/processus/ProcessusRaciPanel";
import { ProcessusActifsITPanel } from "@/components/processus/ProcessusActifsITPanel";
import { ProcessusContinuitéPanel } from "@/components/processus/ProcessusContinuitéPanel";
import { ProcessusQualitePanel } from "@/components/processus/ProcessusQualitePanel";
import { ProcessusCouvertureBadges } from "@/components/processus/ProcessusCouvertureBadges";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { CriticiteBadge } from "@/components/risques/CriticiteBadge";
import { PageHeader, BtnLink } from "@/components/ui";
import {
  archiveProcessus,
  deleteProcessus,
  unarchiveProcessus,
  updateProcessus,
} from "../actions";
import {
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_ACTIF_IT_LABELS,
  STATUT_PROCESSUS_LABELS,
  TYPE_ACTIF_IT_LABELS,
  FREQUENCE_REVUE_QUALITE_LABELS,
  formatDate,
} from "@/lib/labels";
import { buildProcessusCouverture } from "@/lib/processus-couverture";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/tags";
import { listSectionRedactions } from "@/lib/section-redaction";
import {
  formatUtilisateurNom,
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { listUnitesActives } from "@/lib/unites-referentiel";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "INFOS_GENERALES",
  "ETAPES",
  "RACI",
  "ACTIFS_IT",
  "CONTINUITE",
  "ELEMENTS_ASSOCIES",
  "LPD",
] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function ProcessusDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();

  const [processus, users, redactions, risques, documentsLies, actifsDisponibles, unites, macros, fonctions] =
    await Promise.all([
    prisma.processus.findUnique({
      where: { id },
      include: {
        responsable: true,
        creePar: true,
        modifiePar: true,
        unite: true,
        macroprocessus: { select: { id: true, code: true, nom: true } },
        unitesApplicables: { select: { uniteId: true } },
        etapes: { orderBy: { ordre: "asc" } },
        raciLignes: {
          include: {
            participants: {
              include: {
                utilisateur: true,
                fonction: {
                  include: {
                    affectations: {
                      where: { type: "TITULAIRE" },
                      include: {
                        utilisateur: {
                          select: { id: true, nom: true, prenom: true },
                        },
                      },
                      take: 3,
                    },
                  },
                },
              },
            },
          },
          orderBy: { ordre: "asc" },
        },
        actifsIT: {
          include: {
            actifIT: {
              select: {
                id: true,
                code: true,
                nom: true,
                type: true,
                statut: true,
                archive: true,
              },
            },
          },
          orderBy: { lieLe: "asc" },
        },
        continuite: true,
        qualite: true,
        qualiteRevues: {
          include: {
            responsable: { select: { nom: true, prenom: true } },
          },
          orderBy: { dateRevue: "desc" },
          take: 8,
        },
        ecartsQualite: {
          orderBy: { creeLe: "desc" },
          take: 20,
        },
        dependDe: {
          include: {
            dependDe: { select: { id: true, code: true, nom: true } },
          },
        },
        dependants: {
          include: {
            processus: { select: { id: true, code: true, nom: true } },
          },
        },
        modelesTache: {
          include: {
            modeleTache: {
              select: {
                id: true,
                code: true,
                nom: true,
                actif: true,
                delaiJours: true,
                _count: { select: { etapes: true } },
              },
            },
          },
          orderBy: { lieLe: "asc" },
        },
        _count: { select: { exigences: true } },
      },
    }),
    listUtilisateursActifsForCurrentUnite(),
    listSectionRedactions("PROCESSUS", id),
    prisma.risque.findMany({
      where: { processusId: id, archive: false },
      include: {
        controles: {
          include: {
            controle: { select: { id: true, code: true, nom: true } },
          },
        },
      },
      orderBy: [{ criticite: "desc" }, { code: "asc" }],
    }),
    prisma.documentProcessus.findMany({
      where: { processusId: id, document: { archive: false } },
      include: {
        document: { select: { id: true, code: true, nom: true, statut: true } },
      },
      orderBy: { lieLe: "asc" },
    }),
    prisma.actifIT.findMany({
      where: { uniteId: user.uniteId, archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    listUnitesActives(),
    prisma.macroprocessus.findMany({
      where: { archive: false },
      select: { id: true, code: true, nom: true },
      orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    }),
    prisma.fonction.findMany({
      where: { uniteId: user.uniteId, archive: false, actif: true },
      select: { id: true, code: true, nom: true },
      orderBy: { nom: "asc" },
    }),
  ]);
  if (!processus) notFound();

  const canEdit = !processus.archive;
  const baseHref = `/processus/${processus.id}`;
  const tags = parseTags(processus.tags);
  const confluenceUrl =
    processus.reference && /^https?:\/\//i.test(processus.reference)
      ? processus.reference
      : null;

  const userOpts = users.map((u) => ({
    id: u.id,
    nom: formatUtilisateurNom(u),
  }));
  const fonctionOpts = fonctions.map((f) => ({
    id: f.id,
    nom: `${f.code} — ${f.nom}`,
  }));
  const formValues = {
    ...processus,
    macroprocessusId: processus.macroprocessusId,
    uniteId: processus.uniteId,
    applicableUniteIds: processus.unitesApplicables.map((a) => a.uniteId),
  };
  const liesActifIds = new Set(processus.actifsIT.map((l) => l.actifITId));
  const actifsOpts = actifsDisponibles
    .filter((a) => !liesActifIds.has(a.id))
    .map((a) => ({ id: a.id, label: `${a.code} — ${a.nom}` }));
  const actifsLies = processus.actifsIT
    .filter((l) => !l.actifIT.archive)
    .map((l) => ({
      lienId: l.id,
      id: l.actifIT.id,
      code: l.actifIT.code,
      nom: l.actifIT.nom,
      typeLabel: TYPE_ACTIF_IT_LABELS[l.actifIT.type] ?? l.actifIT.type,
      statutLabel: STATUT_ACTIF_IT_LABELS[l.actifIT.statut] ?? l.actifIT.statut,
    }));
  const raciLignes = processus.raciLignes.map((l) => ({
    id: l.id,
    activite: l.activite,
    etapeId: l.etapeId,
    ordre: l.ordre,
    participants: l.participants.map((p) => {
      const titulaireNoms =
        p.fonction?.affectations.map((a) =>
          formatUtilisateurNom(a.utilisateur),
        ) ?? [];
      const label =
        p.fonction?.nom ??
        p.libelleFonction ??
        (p.utilisateur ? formatUtilisateurNom(p.utilisateur) : null);
      return {
        id: p.id,
        role: p.role,
        utilisateurId: p.utilisateurId,
        fonctionId: p.fonctionId,
        label,
        titulaireNoms,
      };
    }),
  }));
  const dependDe = processus.dependDe.map((d) => ({
    lienId: d.id,
    id: d.dependDe.id,
    code: d.dependDe.code,
    nom: d.dependDe.nom,
  }));
  const dependants = processus.dependants.map((d) => ({
    lienId: d.id,
    id: d.processus.id,
    code: d.processus.code,
    nom: d.processus.nom,
  }));
  const dependIds = new Set([
    processus.id,
    ...dependDe.map((d) => d.id),
  ]);
  const processusDepOpts = (
    await prisma.processus.findMany({
      where: { uniteId: user.uniteId, archive: false, id: { notIn: [...dependIds] } },
      select: { id: true, code: true, nom: true },
      orderBy: { nom: "asc" },
    })
  ).map((p) => ({ id: p.id, label: `${p.code} — ${p.nom}` }));
  const continuiteValues = processus.continuite
    ? {
        criticite: processus.continuite.criticite,
        consequencesInterruption: processus.continuite.consequencesInterruption,
        mtpdValeur: processus.continuite.mtpdValeur,
        mtpdUnite: processus.continuite.mtpdUnite,
        rtoValeur: processus.continuite.rtoValeur,
        rtoUnite: processus.continuite.rtoUnite,
        rpoValeur: processus.continuite.rpoValeur,
        rpoUnite: processus.continuite.rpoUnite,
        periodesCritiques: processus.continuite.periodesCritiques,
        modeDegradeMesures: processus.continuite.modeDegradeMesures,
        commentaire: processus.continuite.commentaire,
        dateDerniereRevue: processus.continuite.dateDerniereRevue,
        dateProchaineRevue: processus.continuite.dateProchaineRevue,
      }
    : null;
  const qualiteValues = processus.qualite
    ? {
        responsableRevueId: processus.qualite.responsableRevueId,
        frequence: processus.qualite.frequence,
        derniereRevue: processus.qualite.derniereRevue,
        prochaineRevue: processus.qualite.prochaineRevue,
        confluenceUrl: processus.qualite.confluenceUrl,
        confluenceAJour: processus.qualite.confluenceAJour,
      }
    : null;
  const qualiteRevues = processus.qualiteRevues.map((r) => ({
    id: r.id,
    dateRevue: r.dateRevue,
    responsableNom: r.responsable
      ? formatUtilisateurNom(r.responsable)
      : null,
    commentaire: r.commentaire,
    procedureConformePratique: r.procedureConformePratique,
    pratiqueConformeProcedure: r.pratiqueConformeProcedure,
    raciAJour: r.raciAJour,
    controlesPertinents: r.controlesPertinents,
    confluenceAJour: r.confluenceAJour,
    ecartsIdentifies: r.ecartsIdentifies,
    ameliorationProposee: r.ameliorationProposee,
  }));
  const qualiteEcarts = processus.ecartsQualite.map((e) => ({
    id: e.id,
    titre: e.titre,
    description: e.description,
    statut: e.statut,
    creeLe: e.creeLe,
  }));

  const controlesCount = risques.reduce((s, r) => s + r.controles.length, 0);
  const couverture = buildProcessusCouverture({
    aRaci: processus.raciLignes.length > 0,
    risquesCount: risques.length,
    controlesCount,
    aQualite: Boolean(processus.qualite),
    exigencesCount: processus._count.exigences,
    aContinuite: Boolean(processus.continuite),
  });

  return (
    <>
      <BackLink href="/processus" label="← Retour aux processus" />
      <PageHeader
        title={`${processus.code} — ${processus.nom}`}
        description={
          processus.description ??
          "Processus = quoi ; procédure détaillée = Confluence."
        }
        actions={
          <>
            <BtnLink
              href={`/rapports/processus/${processus.id}`}
              variant="ghost"
            >
              Exporter PDF
            </BtnLink>
            {processus.archive ? (
              <ConfirmActionButton
                action={unarchiveProcessus}
                id={processus.id}
                label="Désarchiver"
                confirmMessage="Remettre ce processus dans la liste active ?"
              />
            ) : (
              <ConfirmActionButton
                action={archiveProcessus}
                id={processus.id}
                label="Archiver"
                confirmMessage="Archiver ce processus ?"
              />
            )}
            <ConfirmDeleteButton
              action={deleteProcessus}
              id={processus.id}
              confirmMessage="Supprimer définitivement ce processus ?"
            />
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      <TrackRecentView
        href={baseHref}
        label={`${processus.code} — ${processus.nom}`}
      />
      <ProcessusCouvertureBadges items={couverture} />
      {processus.archive ? (
        <div className="flash flash--warn">Ce processus est archivé.</div>
      ) : null}

      <EditableSection
        title="Informations générales"
        sectionKey="INFOS_GENERALES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("INFOS_GENERALES")}
        defaultOpen
        editChildren={
          <ProcessusForm
            action={updateProcessus}
            users={userOpts}
            values={formValues}
            macros={macros}
            unites={unites}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="INFOS_GENERALES"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{processus.code}</dd>
          </div>
          <div>
            <dt>Unité propriétaire</dt>
            <dd>{processus.unite.nom}</dd>
          </div>
          <div>
            <dt>Macroprocessus</dt>
            <dd>
              {processus.macroprocessus ? (
                <Link href={`/macroprocessus/${processus.macroprocessus.id}`}>
                  {processus.macroprocessus.code} — {processus.macroprocessus.nom}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{processus.responsable.nom}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{STATUT_PROCESSUS_LABELS[processus.statut]}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{processus.description ?? "—"}</dd>
          </div>
          <div>
            <dt>Lien Confluence</dt>
            <dd>
              {confluenceUrl ? (
                <a href={confluenceUrl} target="_blank" rel="noreferrer">
                  {processus.reference}
                </a>
              ) : (
                (processus.reference ?? "—")
              )}
            </dd>
          </div>
        </dl>
        <p className="detail-trace">
          Créé par {processus.creePar.nom} · Modifié par{" "}
          {processus.modifiePar.nom} · {formatDate(processus.modifieLe)}
        </p>
      </EditableSection>

      <EditableSection
        title="Étapes du processus"
        sectionKey="ETAPES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ETAPES")}
        defaultOpen
        badge={`${processus.etapes.length}`}
        editChildren={
          <>
            <ProcessusEtapesPanel
              processusId={processus.id}
              etapes={processus.etapes}
              editable
            />
            <form action={updateProcessus} className="entity-form">
              <input type="hidden" name="id" value={processus.id} />
              <input type="hidden" name="sectionKey" value="ETAPES" />
              <SectionSaveActions baseHref={baseHref} sectionKey="ETAPES" />
            </form>
          </>
        }
      >
        <ProcessusEtapesPanel
          processusId={processus.id}
          etapes={processus.etapes}
          editable={false}
        />
      </EditableSection>

      <EditableSection
        title="Responsabilités (RACI)"
        sectionKey="RACI"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen={false}
        badge={`${raciLignes.length}`}
        editChildren={
          <ProcessusRaciPanel
            processusId={processus.id}
            lignes={raciLignes}
            etapes={processus.etapes.map((e) => ({
              id: e.id,
              libelle: e.libelle,
            }))}
            users={userOpts}
            fonctions={fonctionOpts}
            editable
          />
        }
      >
        <ProcessusRaciPanel
          processusId={processus.id}
          lignes={raciLignes}
          etapes={processus.etapes.map((e) => ({
            id: e.id,
            libelle: e.libelle,
          }))}
          users={userOpts}
          fonctions={fonctionOpts}
          editable={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Risques & Contrôles"
        defaultOpen
        badge={`${risques.length}`}
      >
        {risques.length === 0 ? (
          <p className="empty">
            Aucun risque lié à ce processus.{" "}
            <Link href="/risques/nouveau">Créer un risque</Link>.
          </p>
        ) : (
          <ul className="unite-activite__list">
            {risques.map((r) => {
              const ctlCodes = r.controles.map(({ controle: c }) => c);
              return (
                <li key={r.id}>
                  <div>
                    <Link href={`/risques/${r.id}`}>
                      <strong>
                        {r.code} — {r.nom}
                      </strong>
                    </Link>
                    <span
                      className="muted"
                      style={{
                        display: "inline-flex",
                        gap: "0.35rem",
                        alignItems: "center",
                        marginLeft: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Inhérent</span>
                      <CriticiteBadge value={r.criticite} />
                      <span>Résiduel</span>
                      <CriticiteBadge value={r.criticiteResiduelle} />
                    </span>
                    {ctlCodes.length > 0 ? (
                      <p
                        className="muted"
                        style={{
                          margin: "0.2rem 0 0",
                          fontSize: "0.82rem",
                        }}
                      >
                        CTL :{" "}
                        {ctlCodes.map((c, i) => (
                          <span key={c.id}>
                            {i > 0 ? ", " : null}
                            <Link href={`/controles-sci/${c.id}`}>
                              {c.code}
                            </Link>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <EditableSection
        title="Actifs"
        sectionKey="ACTIFS_IT"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen={false}
        badge={`${actifsLies.length}`}
        editChildren={
          <ProcessusActifsITPanel
            processusId={processus.id}
            lies={actifsLies}
            disponibles={actifsOpts}
            editable
          />
        }
      >
        <ProcessusActifsITPanel
          processusId={processus.id}
          lies={actifsLies}
          disponibles={actifsOpts}
          editable={false}
        />
      </EditableSection>

      <EditableSection
        title="Continuité des activités"
        sectionKey="CONTINUITE"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        defaultOpen={false}
        badge={continuiteValues?.criticite ?? undefined}
        editChildren={
          <ProcessusContinuitéPanel
            processusId={processus.id}
            values={continuiteValues}
            actifsLies={actifsLies.map((a) => ({
              id: a.id,
              code: a.code,
              nom: a.nom,
            }))}
            dependDe={dependDe}
            dependants={dependants}
            processusOptions={processusDepOpts}
            editable
          />
        }
      >
        <ProcessusContinuitéPanel
          processusId={processus.id}
          values={continuiteValues}
          actifsLies={actifsLies.map((a) => ({
            id: a.id,
            code: a.code,
            nom: a.nom,
          }))}
          dependDe={dependDe}
          dependants={dependants}
          processusOptions={processusDepOpts}
          editable={false}
        />
      </EditableSection>

      <CollapsibleSection
        title="Qualité"
        defaultOpen={false}
        badge={
          qualiteValues
            ? FREQUENCE_REVUE_QUALITE_LABELS[qualiteValues.frequence] ??
              qualiteValues.frequence
            : undefined
        }
      >
        <ProcessusQualitePanel
          processusId={processus.id}
          values={qualiteValues}
          users={userOpts}
          revues={qualiteRevues}
          ecarts={qualiteEcarts}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Documents du processus"
        defaultOpen={false}
        badge={`${documentsLies.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Procédures / documents rattachés à ce processus (relation dédiée).
        </p>
        {documentsLies.length === 0 ? (
          <p className="empty">Aucun document lié.</p>
        ) : (
          <ul className="unite-activite__list">
            {documentsLies.map((l) => (
              <li key={l.id}>
                <Link href={`/documents/${l.document.id}`}>
                  <strong>
                    {l.document.code} — {l.document.nom}
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Modèles de tâches associés"
        defaultOpen
        badge={`${processus.modelesTache.length}`}
      >
        <ProcessusModelesTachesPanel
          modeles={processus.modelesTache.map((l) => ({
            id: l.modeleTache.id,
            code: l.modeleTache.code,
            nom: l.modeleTache.nom,
            actif: l.modeleTache.actif,
            delaiJours: l.modeleTache.delaiJours,
            etapesCount: l.modeleTache._count.etapes,
          }))}
        />
      </CollapsibleSection>

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen
        editChildren={
          <>
            <ElementsAssocies
              uniteId={user.uniteId}
              type="PROCESSUS"
              id={processus.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              wrapInSection={false}
            />
            <form action={updateProcessus} className="entity-form">
              <input type="hidden" name="id" value={processus.id} />
              <input type="hidden" name="sectionKey" value="ELEMENTS_ASSOCIES" />
              <SectionSaveActions
                baseHref={baseHref}
                sectionKey="ELEMENTS_ASSOCIES"
              />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="PROCESSUS"
          id={processus.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <EditableSection
        title="Protection des données"
        sectionKey="LPD"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("LPD")}
        defaultOpen={false}
        editChildren={
          <ProcessusForm
            action={updateProcessus}
            users={userOpts}
            values={processus}
            cancelHref={baseHref}
            submitLabel="Finaliser"
            section="LPD"
            draftActions
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Données personnelles</dt>
            <dd>
              {processus.contientDonneesPersonnelles ? "Oui" : "Non"}
            </dd>
          </div>
          <div>
            <dt>Niveau de confidentialité</dt>
            <dd>
              {NIVEAU_CONFIDENTIALITE_LABELS[processus.niveauConfidentialite] ??
                processus.niveauConfidentialite}
            </dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>
              {tags.length ? tags.map((t) => `#${t}`).join(" ") : "—"}
            </dd>
          </div>
        </dl>
      </EditableSection>
    </>
  );
}
