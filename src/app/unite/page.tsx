import Link from "next/link";
import { notFound } from "next/navigation";
import { FlashBanner } from "@/components/Flash";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { ModuleHelp } from "@/components/ModuleHelp";
import {
  EditableSection,
  SectionSaveActions,
} from "@/components/module/EditableSection";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { PilotageStrip } from "@/components/module/PilotageStrip";
import { PageHeader, BtnLink } from "@/components/ui";
import { updateUnite } from "./actions";
import { MODULE_HELP } from "@/lib/catalog";
import {
  PRIORITE_LABELS,
  ROLE_UTILISATEUR_LABELS,
  STATUT_MISSION_LABELS,
  STATUT_OBJECTIF_LABELS,
  STATUT_PROCESSUS_LABELS,
  formatDate,
} from "@/lib/labels";
import { isAdministrateur } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import { formatUtilisateurNom, getCurrentUser } from "@/lib/session";
import { getUnitePilotage } from "@/lib/unite-overview";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = ["OBJECTIFS", "ELEMENTS_ASSOCIES"] as const;

type EditSection = (typeof EDIT_SECTIONS)[number];

function parseEdit(raw: string | undefined): EditSection | null {
  if (!raw) return null;
  return (EDIT_SECTIONS as readonly string[]).includes(raw)
    ? (raw as EditSection)
    : null;
}

export default async function UnitePage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erreur?: string;
    edit?: string;
    focus?: string;
  }>;
}) {
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [unite, redactions, pilotage, objectifs, membres, processus, missions] =
    await Promise.all([
      prisma.unite.findUnique({
        where: { id: uniteId },
        include: {
          responsable: true,
          adjoint: true,
        },
      }),
      listSectionRedactions("UNITE", uniteId),
      getUnitePilotage(uniteId),
      prisma.objectif.findMany({
        where: { uniteId },
        include: { responsable: true },
        orderBy: [{ annee: "desc" }, { intitule: "asc" }],
      }),
      prisma.utilisateur.findMany({
        where: { uniteId },
        orderBy: [{ actif: "desc" }, { nom: "asc" }, { prenom: "asc" }],
        select: {
          id: true,
          nom: true,
          prenom: true,
          role: true,
          initiales: true,
          fonction: true,
          email: true,
          actif: true,
        },
      }),
      prisma.processus.findMany({
        where: { uniteId, archive: false },
        orderBy: { nom: "asc" },
        select: { id: true, code: true, nom: true, statut: true },
      }),
      prisma.mission.findMany({
        where: { uniteId, archive: false },
        include: {
          type: { select: { libelle: true } },
          responsable: { select: { nom: true, prenom: true } },
        },
        orderBy: [{ dateDebut: "desc" }, { titre: "asc" }],
      }),
    ]);

  if (!unite) notFound();

  const baseHref = "/unite";
  const canEdit = unite.actif;

  return (
    <>
      <PageHeader
        title={`${unite.code} — ${unite.nom}`}
        description={
          unite.description ??
          "Fiche métier de l’unité — agrégation, pas de double saisie."
        }
        help={<ModuleHelp {...MODULE_HELP.unite} />}
        actions={
          <>
            <BtnLink href="/objectifs/nouveau">+ Objectif</BtnLink>
            {isAdministrateur(user) ? (
              <BtnLink href="/administration/unites" variant="ghost">
                Administration
              </BtnLink>
            ) : null}
          </>
        }
      />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {!unite.actif ? (
        <div className="flash flash--warn">Cette unité est inactive.</div>
      ) : null}

      <CollapsibleSection title="Pilotage" defaultOpen>
        <PilotageStrip
          items={[
            {
              value: pilotage.objectifsEnCours,
              label: "objectifs",
              tone: "ok",
            },
            { value: pilotage.projetsActifs, label: "projets" },
            { value: pilotage.missionsEnCours, label: "missions" },
            { value: pilotage.processusActifs, label: "processus" },
            {
              value: pilotage.tachesEnRetard,
              label: "à traiter",
              tone: pilotage.tachesEnRetard > 0 ? "danger" : "default",
              href:
                pilotage.tachesEnRetard > 0
                  ? "/?vue=retard"
                  : undefined,
            },
          ]}
        />
        <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
          Compteurs calculés — « à traiter » ouvre les tâches en retard du
          tableau de bord.
        </p>
      </CollapsibleSection>

      <EditableSection
        title="Objectifs"
        sectionKey="OBJECTIFS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("OBJECTIFS")}
        defaultOpen
        badge={`${objectifs.filter((o) => o.statut === "EN_COURS").length}`}
        editChildren={
          <>
            <div className="form-actions" style={{ marginBottom: "0.75rem" }}>
              <BtnLink href="/objectifs/nouveau">+ Nouvel objectif</BtnLink>
            </div>
            <ObjectifsList objectifs={objectifs} />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input type="hidden" name="sectionKey" value="OBJECTIFS" />
              <SectionSaveActions baseHref={baseHref} sectionKey="OBJECTIFS" />
            </form>
          </>
        }
      >
        <div id="objectifs">
          <ObjectifsList objectifs={objectifs} />
        </div>
      </EditableSection>

      <div id="equipe">
        <CollapsibleSection
          title="Équipe"
          defaultOpen
          badge={`${membres.filter((m) => m.actif).length}/${membres.length}`}
        >
          <p className="muted" style={{ marginTop: 0 }}>
            Tous les utilisateurs rattachés à cette unité (référentiel
            Administration) — aucune ressaisie ici.
          </p>
          {membres.length === 0 ? (
            <p className="empty">Aucun collaborateur rattaché à l’unité.</p>
          ) : (
            <ul className="unite-equipe__list">
              {membres.map((m) => {
                let roleLabel =
                  ROLE_UTILISATEUR_LABELS[m.role] ?? "Collaborateur";
                if (m.id === unite.responsableId) {
                  roleLabel = "Responsable d’unité";
                } else if (m.id === unite.adjointId) {
                  roleLabel = "Adjoint";
                }
                return (
                  <li
                    key={m.id}
                    className={`unite-equipe__row${m.actif ? "" : " is-inactive"}`}
                  >
                    <span className="unite-equipe__id">
                      <span className="initiales-badge" aria-hidden>
                        {m.initiales?.trim() || "—"}
                      </span>
                      <span>
                        <strong>{formatUtilisateurNom(m)}</strong>
                        {m.fonction ? (
                          <span className="muted"> · {m.fonction}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="unite-equipe__meta muted">
                      {roleLabel}
                      {" · "}
                      {m.actif ? "Actif" : "Inactif"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title="Processus"
        defaultOpen={false}
        badge={`${processus.length}`}
      >
        <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
          <BtnLink href="/processus" variant="ghost">
            Voir tous
          </BtnLink>
        </div>
        {processus.length === 0 ? (
          <p className="empty">Aucun processus.</p>
        ) : (
          <ul className="unite-activite__list">
            {processus.map((p) => (
              <li key={p.id}>
                <Link href={`/processus/${p.id}`}>
                  <strong>
                    {p.code} — {p.nom}
                  </strong>
                </Link>
                <span className="muted">
                  {STATUT_PROCESSUS_LABELS[p.statut] ?? p.statut}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Missions"
        defaultOpen={false}
        badge={`${missions.length}`}
      >
        <div className="form-actions" style={{ marginBottom: "0.65rem" }}>
          <BtnLink href="/missions" variant="ghost">
            Voir toutes
          </BtnLink>
        </div>
        {missions.length === 0 ? (
          <p className="empty">Aucune mission.</p>
        ) : (
          <ul className="unite-activite__list">
            {missions.map((m) => (
              <li key={m.id}>
                <Link href={`/missions/${m.id}`}>
                  <strong>
                    {m.code} — {m.titre}
                  </strong>
                </Link>
                <span className="muted">
                  {m.type.libelle} ·{" "}
                  {STATUT_MISSION_LABELS[m.statut] ?? m.statut} ·{" "}
                  {formatUtilisateurNom(m.responsable)}
                  {m.dateDebut || m.dateFin
                    ? ` · ${m.dateDebut ? formatDate(m.dateDebut) : "—"} → ${m.dateFin ? formatDate(m.dateFin) : "—"}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
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
              uniteId={uniteId}
              type="UNITE"
              id={unite.id}
              retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
              editable
              wrapInSection={false}
            />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input
                type="hidden"
                name="sectionKey"
                value="ELEMENTS_ASSOCIES"
              />
              <SectionSaveActions baseHref={baseHref} sectionKey="ELEMENTS_ASSOCIES" />
            </form>
          </>
        }
      >
        <ElementsAssocies
          uniteId={uniteId}
          type="UNITE"
          id={unite.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>
    </>
  );
}

function ObjectifsList({
  objectifs,
}: {
  objectifs: Array<{
    id: string;
    code: string;
    intitule: string;
    annee: number;
    statut: string;
    priorite: string;
    dateEcheance: Date | null;
    responsable: { nom: string; prenom?: string | null };
  }>;
}) {
  if (objectifs.length === 0) {
    return (
      <p className="empty">
        Aucun objectif.{" "}
        <Link href="/objectifs/nouveau">Créer le premier</Link>.
      </p>
    );
  }

  return (
    <ul className="unite-objectifs__list">
      {objectifs.map((o) => (
        <li key={o.id} className="unite-objectifs__row">
          <div>
            <Link href={`/objectifs/${o.id}`}>
              <strong>
                {o.code} — {o.intitule}
              </strong>
            </Link>
            <span className="muted">
              {" "}
              · {o.annee} · {STATUT_OBJECTIF_LABELS[o.statut] ?? o.statut} ·{" "}
              {PRIORITE_LABELS[o.priorite] ?? o.priorite} ·{" "}
              {formatUtilisateurNom(o.responsable)}
              {o.dateEcheance ? ` · éch. ${formatDate(o.dateEcheance)}` : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
