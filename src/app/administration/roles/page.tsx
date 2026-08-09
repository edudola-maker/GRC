import { BackLink } from "@/components/Flash";
import { PageHeader } from "@/components/ui";
import { ROLE_UTILISATEUR_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

const ROLE_DETAILS: {
  code: keyof typeof ROLE_UTILISATEUR_LABELS;
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
      "Distinct du rôle de mission « Responsable d’unité ».",
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
];

export default function AdminRolesPage() {
  return (
    <>
      <BackLink href="/administration" label="← Retour à l’administration" />
      <PageHeader
        title="Rôles"
        description="Rôles applicatifs (compte) — distincts des rôles portés dans une mission d’assurance."
      />

      <section className="admin-roles">
        <h2 className="admin-roles__title">Rôles applicatifs</h2>
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

      <section className="admin-roles admin-roles--aside">
        <h2 className="admin-roles__title">Rôles de mission</h2>
        <p>
          Les rôles de mission (ex. Responsable de mandat, Auditeur, Responsable
          d’unité) sont définis dans le moteur Missions et s’appliquent
          uniquement au sein d’une instance de mission. Ils ne remplacent pas le
          rôle applicatif du compte.
        </p>
      </section>
    </>
  );
}
