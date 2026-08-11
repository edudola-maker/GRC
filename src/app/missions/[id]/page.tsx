import Link from "next/link";
import { MissionForm } from "@/components/EntityForms";
import { ElementsAssocies } from "@/components/liens/ElementsAssocies";
import { CollapsibleSection } from "@/components/module/CollapsibleSection";
import { EditableSection } from "@/components/module/EditableSection";
import { MissionEtapesCards } from "@/components/missions/MissionEtapesNav";
import { MissionPageChrome } from "@/components/missions/MissionPageChrome";
import { updateMission } from "../actions";
import {
  NIVEAU_CONFIDENTIALITE_LABELS,
  STATUT_MISSION_LABELS,
  formatDate,
} from "@/lib/labels";
import { deriveInitiales } from "@/lib/initiales";
import { requireMissionDetail } from "@/lib/mission-data";
import { etapeCouranteRecommandee } from "@/lib/mission-etapes";
import { prisma } from "@/lib/prisma";
import {
  formatSectionEtatLabel,
} from "@/lib/section-redaction";
import {
  getCurrentUser,
  listUtilisateursActifsForCurrentUnite,
} from "@/lib/session";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function MissionCockpitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string; edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const edit =
    sp.edit === "VUE_ENSEMBLE" || sp.edit === "ELEMENTS_ASSOCIES"
      ? sp.edit
      : null;
  const user = await getCurrentUser();
  const { mission, redactions, etapes, equipe } = await requireMissionDetail(id);

  const [users, types, templates, descriptifs] = await Promise.all([
    listUtilisateursActifsForCurrentUnite(),
    prisma.missionType.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
      select: { id: true, libelle: true },
    }),
    prisma.missionTemplate.findMany({
      where: { actif: true },
      orderBy: { libelle: "asc" },
      select: { id: true, libelle: true, typeId: true },
    }),
    prisma.missionDescriptifPreset.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
      select: { id: true, libelle: true, typeId: true },
    }),
  ]);

  const tags = parseTags(mission.tags);
  const canEdit = !mission.archive;
  const baseHref = `/missions/${mission.id}`;
  const descriptif =
    mission.descriptifPreset?.libelle ?? mission.descriptifLibre ?? "—";
  const recommandee = etapeCouranteRecommandee(etapes);
  const editingVue = edit === "VUE_ENSEMBLE";

  return (
    <MissionPageChrome
      mission={mission}
      etapes={etapes}
      activeCockpit
      ok={sp.ok}
      erreur={sp.erreur}
    >
      <CollapsibleSection
        title="Vue d'ensemble"
        defaultOpen
        badge={
          formatSectionEtatLabel(redactions.get("VUE_ENSEMBLE")) ?? undefined
        }
        headerActions={
          canEdit && !edit ? (
            <Link
              href={`${baseHref}?edit=VUE_ENSEMBLE#VUE_ENSEMBLE`}
              scroll={false}
              className="btn btn--ghost collapsible-section__modify"
            >
              Modifier
            </Link>
          ) : null
        }
      >
        {editingVue && canEdit ? (
          <div className="entity-form-wrap">
            <MissionForm
              action={updateMission}
              users={users}
              types={types}
              templates={templates}
              descriptifs={descriptifs}
              values={mission}
              cancelHref={baseHref}
              submitLabel="Finaliser"
              draftActions
              sectionKey="VUE_ENSEMBLE"
            />
          </div>
        ) : (
          <>
            <dl className="kv">
              <div>
                <dt>Code</dt>
                <dd>{mission.code}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{mission.type.libelle}</dd>
              </div>
              <div>
                <dt>Descriptif</dt>
                <dd>{descriptif}</dd>
              </div>
              <div>
                <dt>Unité</dt>
                <dd>{mission.unite.nom}</dd>
              </div>
              <div>
                <dt>Responsable</dt>
                <dd>
                  <span
                    className="initiales-badge"
                    title={mission.responsable.nom}
                  >
                    {mission.responsable.initiales?.trim() ||
                      deriveInitiales(mission.responsable.nom)}
                  </span>{" "}
                  {mission.responsable.nom}
                </dd>
              </div>
              <div>
                <dt>Équipe</dt>
                <dd>
                  {equipe.length
                    ? equipe
                        .map(
                          (m) =>
                            `${m.initiales} (${m.roleLabels.join(", ") || "—"})`,
                        )
                        .join(" · ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>
                  {STATUT_MISSION_LABELS[mission.statut] ?? mission.statut}
                </dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {formatDate(mission.dateDebut)} →{" "}
                  {formatDate(mission.dateFin)}
                </dd>
              </div>
              <div>
                <dt>Nature / périmètre</dt>
                <dd>{mission.nature ?? "—"}</dd>
              </div>
              <div>
                <dt>Données personnelles</dt>
                <dd>
                  {mission.contientDonneesPersonnelles ? "Oui" : "Non"}
                </dd>
              </div>
              <div>
                <dt>Niveau de confidentialité</dt>
                <dd>
                  {NIVEAU_CONFIDENTIALITE_LABELS[
                    mission.niveauConfidentialite
                  ] ?? mission.niveauConfidentialite}
                </dd>
              </div>
            </dl>
            {mission.analyseTravaux ? (
              <CollapsibleSection title="Réflexion / analyse" defaultOpen>
                <p className="detail-note" style={{ margin: 0 }}>
                  {mission.analyseTravaux}
                </p>
              </CollapsibleSection>
            ) : null}
            {mission.commentaires ? (
              <p className="detail-note">{mission.commentaires}</p>
            ) : null}
            <p className="detail-trace">
              Créé par {mission.creePar.nom} · Modifié par{" "}
              {mission.modifiePar.nom} · {formatDate(mission.modifieLe)}
            </p>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Progression des étapes" defaultOpen>
        {recommandee ? (
          <p className="muted" style={{ marginTop: 0 }}>
            Étape courante recommandée :{" "}
            <strong>
              {recommandee.ordre}. {recommandee.title}
            </strong>{" "}
            — pas de blocage : les autres étapes restent accessibles.
          </p>
        ) : (
          <p className="muted" style={{ marginTop: 0 }}>
            Les cinq étapes sont marquées terminées / validées.
          </p>
        )}
        <MissionEtapesCards
          etapes={etapes}
          recommandeeSlug={recommandee?.slug}
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
          <ElementsAssocies
            uniteId={user.uniteId}
            type="MISSION"
            id={mission.id}
            retour={`${baseHref}?edit=ELEMENTS_ASSOCIES`}
            editable
            wrapInSection={false}
          />
        }
      >
        <ElementsAssocies
          uniteId={user.uniteId}
          type="MISSION"
          id={mission.id}
          retour={baseHref}
          editable={false}
          wrapInSection={false}
        />
      </EditableSection>

      <CollapsibleSection title="Tags" defaultOpen>
        <p style={{ margin: 0 }}>
          {tags.length ? tags.map((t) => `#${t}`).join(" ") : "Aucun tag."}
        </p>
      </CollapsibleSection>
    </MissionPageChrome>
  );
}
