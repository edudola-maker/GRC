import { BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ROLE_UTILISATEUR_LABELS } from "@/lib/labels";
import {
  ACTION_LABELS,
  DOMAIN_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_DOMAINS,
  PERMISSION_MATRIX,
  isRbacPermissive,
  roleHasPermission,
  type PermissionDomain,
} from "@/lib/rbac";
import type { RoleUtilisateur } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const ROLE_DETAILS: {
  code: RoleUtilisateur;
  summary: string;
  points: string[];
}[] = [
  {
    code: "COLLABORATEUR",
    summary: "Accès opérationnel aux modules de son unité.",
    points: [
      "Dashboard collaborateur, tâches, objets métier de l’unité.",
      "Pas d’accès à l’Administration ni au dashboard responsable.",
    ],
  },
  {
    code: "RESPONSABLE",
    summary: "Pilotage de l’unité (fiche, objectifs, dashboard responsable).",
    points: [
      "Vue d’ensemble responsable et suivi d’équipe.",
      "Édition de la fiche métier « Mon unité » (périmètre courant).",
      "Distinct de la Fonction organisationnelle « Responsable d’unité ».",
    ],
  },
  {
    code: "ADMINISTRATEUR",
    summary: "Paramétrage transverse : utilisateurs, unités, rôles.",
    points: [
      "Accès au module Administration (toutes les unités).",
      "Peut aussi ouvrir le dashboard responsable (navigation).",
      "Au moins un administrateur actif doit toujours exister.",
    ],
  },
  {
    code: "LECTURE_SEULE",
    summary: "Consultation sans modification.",
    points: [
      "Voir les objets autorisés selon le périmètre.",
      "Pas de création / modification / validation.",
    ],
  },
];

const MATRIX_ROLES: RoleUtilisateur[] = [
  "LECTURE_SEULE",
  "COLLABORATEUR",
  "RESPONSABLE",
  "ADMINISTRATEUR",
];

export default function AdminRolesPage() {
  const permissive = isRbacPermissive();

  return (
    <>
      <BackLink href="/administration" label="← Retour à l’administration" />
      <PageHeader title="Rôles & permissions" />

      <section className="admin-roles">
        <h2 className="admin-roles__title">Mode d’accès</h2>
        <p>
          {permissive ? (
            <>
              <strong>Prototype permissif</strong> — les restrictions RBAC sont
              calculables mais non appliquées (
              <code>RBAC_ENFORCE≠1</code>). L’architecture est prête.
            </>
          ) : (
            <>
              <strong>RBAC actif</strong> — les permissions de la matrice sont
              appliquées.
            </>
          )}
        </p>
      </section>

      <section className="admin-roles">
        <h2 className="admin-roles__title">Rôles applicatifs</h2>
        <p className="muted">
          ≠ Fonctions organisationnelles (FCT). Un Collaborateur occupe une
          Fonction ; la Fonction peut être liée à un rôle applicatif.
        </p>
        <ul className="admin-roles__list">
          {ROLE_DETAILS.map((role) => (
            <li key={role.code} className="admin-roles__item">
              <h3>{ROLE_UTILISATEUR_LABELS[role.code]}</h3>
              <p className="admin-roles__code">{role.code}</p>
              <p>{role.summary}</p>
              <ul>
                {role.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-roles">
        <h2 className="admin-roles__title">Matrice de permissions</h2>
        <div className="table-wrap">
          <table className="data-table rbac-matrix">
            <thead>
              <tr>
                <th>Domaine</th>
                {PERMISSION_ACTIONS.map((a) => (
                  <th key={a}>{ACTION_LABELS[a]}</th>
                ))}
                <th>Selon rôle</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_DOMAINS.map((domain: PermissionDomain) => (
                <tr key={domain}>
                  <td>
                    <strong>{DOMAIN_LABELS[domain]}</strong>
                  </td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const who = MATRIX_ROLES.filter((r) =>
                      roleHasPermission(r, domain, action),
                    ).map((r) => ROLE_UTILISATEUR_LABELS[r]?.slice(0, 3) ?? r);
                    const any = who.length > 0;
                    return (
                      <td key={action} className={any ? "" : "muted"}>
                        {any ? "✓" : "—"}
                      </td>
                    );
                  })}
                  <td className="muted" style={{ fontSize: "0.75rem" }}>
                    {MATRIX_ROLES.filter((r) =>
                      PERMISSION_ACTIONS.some((a) =>
                        roleHasPermission(r, domain, a),
                      ),
                    )
                      .map((r) => ROLE_UTILISATEUR_LABELS[r])
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          Périmètres prévus : Mes objets · Mon unité · Unités autorisées ·
          Organisation. Exceptions individuelles = rare, visibles, identifiables
          (modèle <code>PermissionException</code>).
        </p>
        {/* silence unused matrix reference for tree-shake of docs */}
        <span className="sr-only">{Object.keys(PERMISSION_MATRIX).length}</span>
      </section>

      <section className="admin-roles admin-roles--aside">
        <h2 className="admin-roles__title">Fonctions</h2>
        <p>
          Gérer le référentiel organisationnel dans{" "}
          <a href="/fonctions">Fonctions (FCT)</a>.
        </p>
      </section>
    </>
  );
}
