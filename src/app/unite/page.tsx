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
import { PageHeader, BtnLink } from "@/components/ui";
import { UniteForm } from "@/components/unite/UniteForm";
import { UnitePilotagePanel } from "@/components/unite/UnitePilotagePanel";
import { updateUnite } from "./actions";
import { MODULE_HELP } from "@/lib/catalog";
import {
  PRIORITE_LABELS,
  STATUT_OBJECTIF_LABELS,
  STATUT_PROCESSUS_LABELS,
  formatDate,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { listSectionRedactions } from "@/lib/section-redaction";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { getUnitePilotage } from "@/lib/unite-overview";

export const dynamic = "force-dynamic";

const EDIT_SECTIONS = [
  "VUE_ENSEMBLE",
  "OBJECTIFS",
  "ELEMENTS_ASSOCIES",
] as const;

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
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const sp = await searchParams;
  const edit = parseEdit(sp.edit);
  const user = await getCurrentUser();
  const uniteId = user.uniteId;

  const [unite, users, redactions, pilotage, objectifs, membres, processus] =
    await Promise.all([
      prisma.unite.findUnique({
        where: { id: uniteId },
        include: {
          responsable: true,
          adjoint: true,
        },
      }),
      listUtilisateursActifsForCurrentUnite(),
      listSectionRedactions("UNITE", uniteId),
      getUnitePilotage(uniteId),
      prisma.objectif.findMany({
        where: { uniteId },
        include: { responsable: true },
        orderBy: [{ annee: "desc" }, { intitule: "asc" }],
      }),
      prisma.utilisateur.findMany({
        where: { uniteId, actif: true },
        orderBy: { nom: "asc" },
        select: { id: true, nom: true, role: true, initiales: true, email: true },
      }),
      prisma.processus.findMany({
        where: { uniteId, archive: false },
        orderBy: { nom: "asc" },
        select: { id: true, code: true, nom: true, statut: true },
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
          "Fiche métier de l’unité : identité, objectifs, activité agrégée."
        }
        actions={
          <>
            <BtnLink href="/objectifs/nouveau">+ Nouvel objectif</BtnLink>
            <BtnLink href="/projets/nouveau" variant="ghost">
              + Nouveau projet
            </BtnLink>
            <BtnLink href="/audits/nouveau" variant="ghost">
              + Nouvelle mission
            </BtnLink>
            <BtnLink href="/taches/nouvelle" variant="ghost">
              + Nouvelle tâche
            </BtnLink>
            <BtnLink href="/processus/nouveau" variant="ghost">
              + Nouveau processus
            </BtnLink>
          </>
        }
      />
      <ModuleHelp {...MODULE_HELP.unite} />
      <FlashBanner ok={sp.ok} erreur={sp.erreur} />
      {!unite.actif ? (
        <div className="flash flash--warn">Cette unité est inactive.</div>
      ) : null}

      <EditableSection
        title="Vue d’ensemble"
        sectionKey="VUE_ENSEMBLE"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("VUE_ENSEMBLE")}
        defaultOpen
        editChildren={
          <UniteForm
            action={updateUnite}
            users={users}
            values={unite}
            cancelHref={baseHref}
          />
        }
      >
        <dl className="kv">
          <div>
            <dt>Code</dt>
            <dd>{unite.code}</dd>
          </div>
          <div>
            <dt>Nom</dt>
            <dd>{unite.nom}</dd>
          </div>
          <div>
            <dt>Mission</dt>
            <dd>{unite.description ?? "—"}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{unite.responsable?.nom ?? "—"}</dd>
          </div>
          <div>
            <dt>Adjoint</dt>
            <dd>{unite.adjoint?.nom ?? "—"}</dd>
          </div>
          <div>
            <dt>Statut</dt>
            <dd>{unite.actif ? "Actif" : "Inactif"}</dd>
          </div>
          <div>
            <dt>Membres</dt>
            <dd>{membres.length} collaborateur{membres.length === 1 ? "" : "s"}</dd>
          </div>
        </dl>
      </EditableSection>

      <CollapsibleSection title="Pilotage" defaultOpen badge="synthèse">
        <UnitePilotagePanel pilotage={pilotage} />
      </CollapsibleSection>

      <EditableSection
        title="Objectifs"
        sectionKey="OBJECTIFS"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("OBJECTIFS")}
        defaultOpen
        badge={`${objectifs.filter((o) => o.statut === "EN_COURS").length} en cours`}
        editChildren={
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Créez ou ouvrez un objectif pour le modifier. Les liens se gèrent
              sur la fiche de chaque objectif.
            </p>
            <div className="form-actions" style={{ marginBottom: "1rem" }}>
              <BtnLink href="/objectifs/nouveau">+ Nouvel objectif</BtnLink>
            </div>
            <ObjectifsList objectifs={objectifs} />
            <form action={updateUnite} className="entity-form">
              <input type="hidden" name="id" value={unite.id} />
              <input type="hidden" name="sectionKey" value="OBJECTIFS" />
              <SectionSaveActions cancelHref={baseHref} />
            </form>
          </>
        }
      >
        <div id="objectifs">
          <ObjectifsList objectifs={objectifs} />
        </div>
      </EditableSection>

      <CollapsibleSection
        title="Équipe"
        defaultOpen={false}
        badge={`${membres.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Collaborateurs rattachés à l’unité (lecture). Gestion des comptes et
          droits → Administration (roadmap).
        </p>
        {membres.length === 0 ? (
          <p className="empty">Aucun collaborateur actif.</p>
        ) : (
          <ul className="unite-equipe__list">
            {membres.map((m) => {
              let roleLabel = "Collaborateur";
              if (m.id === unite.responsableId) roleLabel = "Responsable";
              else if (m.id === unite.adjointId) roleLabel = "Adjoint";
              else if (m.role === "RESPONSABLE") {
                roleLabel = "Responsable (rôle)";
              }
              return (
                <li key={m.id} className="unite-equipe__row">
                  <strong>
                    {m.initiales ? `${m.initiales} · ` : ""}
                    {m.nom}
                  </strong>
                  <span className="muted">{roleLabel}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Processus"
        defaultOpen={false}
        badge={`${processus.length}`}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Processus de l’unité — détail et étapes sur chaque fiche Processus.
        </p>
        <div className="form-actions" style={{ marginBottom: "0.75rem" }}>
          <BtnLink href="/processus/nouveau" variant="ghost">
            + Nouveau processus
          </BtnLink>
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

      <EditableSection
        title="Éléments associés"
        sectionKey="ELEMENTS_ASSOCIES"
        baseHref={baseHref}
        edit={edit}
        canEdit={canEdit}
        redaction={redactions.get("ELEMENTS_ASSOCIES")}
        defaultOpen={false}
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
              <SectionSaveActions cancelHref={baseHref} />
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
    responsable: { nom: string };
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
              {PRIORITE_LABELS[o.priorite] ?? o.priorite} · {o.responsable.nom}
              {o.dateEcheance ? ` · éch. ${formatDate(o.dateEcheance)}` : ""}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
