import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { addBusinessDays } from "../src/lib/dates";
import { deriveInitiales } from "../src/lib/initiales";

const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const filePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;
const absolutePath = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath);

const adapter = new PrismaBetterSqlite3({ url: absolutePath });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("🌱 Seed — consolidation Administration…");

  // Nettoyage défensif (ordre FK : liens / sections avant Objectif).
  await prisma.$executeRawUnsafe(
    `UPDATE "Unite" SET "responsableId" = NULL, "adjointId" = NULL`,
  ).catch(() => undefined);
  await prisma.lienObjet.deleteMany().catch(() => undefined);
  await prisma.sectionRedaction.deleteMany().catch(() => undefined);
  await prisma.$executeRawUnsafe(`DELETE FROM "Objectif"`).catch(() => undefined);

  await prisma.journalEvenement.deleteMany();
  await prisma.historiqueTache.deleteMany();
  await prisma.tacheChecklistItem.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.missionValidationVisa.deleteMany();
  await prisma.missionValidationPoint.deleteMany();
  await prisma.missionChecklistItem.deleteMany();
  await prisma.recommandation.deleteMany();
  await prisma.missionDocument.deleteMany();
  await prisma.missionMembreRole.deleteMany();
  await prisma.missionMembre.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.lienObjet.deleteMany();
  await prisma.risqueControle.deleteMany();
  await prisma.risque.deleteMany();
  await prisma.controleDocument.deleteMany();
  await prisma.controleSCI.deleteMany();
  await prisma.projetDocument.deleteMany();
  await prisma.sectionRedaction.deleteMany();
  await prisma.modeleTacheProcessus.deleteMany();
  await prisma.modeleTacheEtape.deleteMany();
  await prisma.modeleTache.deleteMany();
  await prisma.processusRaciParticipant.deleteMany().catch(() => undefined);
  await prisma.processusRaciLigne.deleteMany().catch(() => undefined);
  await prisma.processusActifIT.deleteMany().catch(() => undefined);
  await prisma.processusContinuité.deleteMany().catch(() => undefined);
  await prisma.processusDependance.deleteMany().catch(() => undefined);
  await prisma.processusUniteApplicable.deleteMany().catch(() => undefined);
  await prisma.documentProcessus.deleteMany().catch(() => undefined);
  await prisma.processusEtape.deleteMany();
  await prisma.projetEtape.deleteMany().catch(() => undefined);
  await prisma.projetMembre.deleteMany();
  await prisma.conseil.deleteMany();
  await prisma.document.deleteMany();
  await prisma.objectif.deleteMany();
  await prisma.objectifAnnuel.deleteMany();
  await prisma.objectifModule.deleteMany();
  await prisma.parametreFonctionnel.deleteMany();
  await prisma.referentielValeur.deleteMany();
  await prisma.projet.deleteMany();
  await prisma.processus.deleteMany();
  await prisma.macroprocessusUniteApplicable.deleteMany().catch(() => undefined);
  await prisma.macroprocessus.deleteMany().catch(() => undefined);
  await prisma.actifIT.deleteMany().catch(() => undefined);
  await prisma.uniteAttribution.deleteMany().catch(() => undefined);
  await prisma.journalBordEntree.deleteMany().catch(() => undefined);
  await prisma.noteParticipant.deleteMany().catch(() => undefined);
  await prisma.noteTravail.deleteMany().catch(() => undefined);
  await prisma.historiqueModification.deleteMany().catch(() => undefined);
  await prisma.risqueReevaluation.deleteMany().catch(() => undefined);
  await prisma.sequenceCode.deleteMany();
  // Lever les FK Unite → Utilisateur avant suppression des utilisateurs.
  await prisma.unite.updateMany({
    data: { responsableId: null, adjointId: null },
  });
  await prisma.utilisateur.deleteMany();
  await prisma.unite.deleteMany();

  const unite = await prisma.unite.create({
    data: {
      id: "unite_grc_demo",
      code: "UNT-0001",
      nom: "Unité GRC",
      description:
        "Unité de gouvernance, risques et conformité — pilote les processus SCI, les missions d’assurance et le suivi des risques.",
      presentation:
        "L’unité GRC existe pour sécuriser le pilotage de l’organisation : elle structure les processus, évalue les risques, anime le SCI et conduit les missions d’assurance.\n\nSes activités principales couvrent la cartographie des processus, le référentiel des actifs, le suivi des contrôles et l’accompagnement des métiers.\n\nElle travaille pour les directions métier (clients internes) et rend compte à la gouvernance.",
      actif: true,
    },
  });
  const uniteId = unite.id;

  const uniteFinance = await prisma.unite.create({
    data: {
      code: "UNT-0002",
      nom: "Unité Finance (témoin)",
      description: "Unité témoin pour le basculement multi-unités (démo).",
      actif: true,
    },
  });

  await prisma.referentielValeur.createMany({
    data: [
      { type: "TAXINOMIE", code: "GOUVERNANCE", label: "Gouvernance", ordre: 1 },
      { type: "TAXINOMIE", code: "RESSOURCES_HUMAINES", label: "Ressources humaines", ordre: 2 },
      { type: "TAXINOMIE", code: "FINANCES", label: "Finances", ordre: 3 },
      { type: "TAXINOMIE", code: "INFORMATIQUE", label: "Informatique", ordre: 4 },
      { type: "TAXINOMIE", code: "JURIDIQUE", label: "Juridique", ordre: 5 },
      { type: "TAXINOMIE", code: "ACHATS", label: "Achats", ordre: 6 },
      { type: "TAXINOMIE", code: "AUTRE", label: "Autre", ordre: 99 },
    ],
  });

  await prisma.parametreFonctionnel.createMany({
    data: [
      {
        uniteId,
        cle: "CONSEIL_DELAI_CIBLE_JOURS",
        valeur: "5",
        description: "Délai cible des conseils (jours ouvrés)",
      },
      {
        uniteId: uniteFinance.id,
        cle: "CONSEIL_DELAI_CIBLE_JOURS",
        valeur: "5",
        description: "Délai cible des conseils (jours ouvrés)",
      },
    ],
  });


  // Types / templates / rôles mission (ids fixes de la migration — upsert)
  const missionTypes = [
    { id: "mtype_audit_general", code: "AUDIT_GENERAL", libelle: "Audit général", description: "Mission d'audit général structurée", ordre: 1 },
    { id: "mtype_audit_cible", code: "AUDIT_CIBLE", libelle: "Audit ciblé / spécifique", description: "Audit à périmètre restreint", ordre: 2 },
    { id: "mtype_revue_processus", code: "REVUE_PROCESSUS", libelle: "Revue de processus", description: "Revue méthodologique d'un processus", ordre: 3 },
    { id: "mtype_audit_interne", code: "AUDIT_INTERNE", libelle: "Audit interne", description: "Mission relevant de l'audit interne", ordre: 4 },
  ] as const;
  for (const t of missionTypes) {
    await prisma.missionType.upsert({
      where: { code: t.code },
      create: { ...t, actif: true },
      update: { libelle: t.libelle, description: t.description, actif: true, ordre: t.ordre },
    });
  }

  const emptyDef = {
    sections: [
      { key: "VUE_ENSEMBLE", title: "Vue d'ensemble", order: 0, defaultOpen: true },
      { key: "PLANIFICATION", title: "1. Planification", order: 1, defaultOpen: true },
      { key: "SUBSTANTIF", title: "2. Substantif", order: 2, defaultOpen: false },
      { key: "RECOMMANDATIONS", title: "3. Recommandations", order: 3, defaultOpen: false },
      { key: "RAPPORT", title: "4. Rapport", order: 4, defaultOpen: false },
      { key: "SUIVI", title: "5. Suivi des recommandations", order: 5, defaultOpen: false },
    ],
    roleCodes: ["RESPONSABLE_MANDAT", "AUDITEUR", "RESPONSABLE_UNITE"],
    checklistDefs: [],
    validationDefs: [],
  };

  const templates = [
    { id: "mtpl_audit_general_v1", code: "AUDIT_GENERAL_V1", libelle: "Audit général — structure standard", typeId: "mtype_audit_general", description: "Structure standard" },
    { id: "mtpl_revue_processus_v1", code: "REVUE_PROCESSUS_V1", libelle: "Revue de processus — structure standard", typeId: "mtype_revue_processus", description: null as string | null },
    { id: "mtpl_audit_cible_v1", code: "AUDIT_CIBLE_V1", libelle: "Audit ciblé — structure standard", typeId: "mtype_audit_cible", description: null as string | null },
    { id: "mtpl_audit_interne_v1", code: "AUDIT_INTERNE_V1", libelle: "Audit interne — structure standard", typeId: "mtype_audit_interne", description: null as string | null },
  ];
  for (const t of templates) {
    await prisma.missionTemplate.upsert({
      where: { code: t.code },
      create: { ...t, actif: true, definition: emptyDef },
      update: { libelle: t.libelle, typeId: t.typeId, description: t.description, actif: true, definition: emptyDef },
    });
  }

  const descriptifs = [
    { id: "mdesc_subventions", typeId: "mtype_audit_general", libelle: "Audit de conformité des subventions", ordre: 1 },
    { id: "mdesc_achats", typeId: "mtype_audit_general", libelle: "Audit du cycle Achats", ordre: 2 },
    { id: "mdesc_paie", typeId: "mtype_audit_general", libelle: "Audit du processus Paie", ordre: 3 },
  ];
  for (const d of descriptifs) {
    await prisma.missionDescriptifPreset.upsert({
      where: { id: d.id },
      create: { ...d, actif: true },
      update: { typeId: d.typeId, libelle: d.libelle, actif: true, ordre: d.ordre },
    });
  }

  const roles = [
    { id: "mrole_resp_mandat", code: "RESPONSABLE_MANDAT", libelle: "Responsable de mandat", ordre: 1 },
    { id: "mrole_auditeur", code: "AUDITEUR", libelle: "Auditeur", ordre: 2 },
    { id: "mrole_resp_unite", code: "RESPONSABLE_UNITE", libelle: "Responsable d'unité", ordre: 3 },
  ];
  for (const r of roles) {
    await prisma.missionRole.upsert({
      where: { code: r.code },
      create: { ...r, actif: true },
      update: { libelle: r.libelle, actif: true, ordre: r.ordre },
    });
  }

  const alice = await prisma.utilisateur.create({
    data: {
      uniteId,
      prenom: "Alice",
      nom: "Martin",
      fonction: "Responsable GRC",
      initiales: deriveInitiales("Alice Martin"),
      email: "alice.martin@exemple.fr",
      motDePasse: "demo-hash-alice",
      role: "RESPONSABLE",
    },
  });
  const bernard = await prisma.utilisateur.create({
    data: {
      uniteId,
      prenom: "Bernard",
      nom: "Dupont",
      fonction: "Collaborateur GRC",
      initiales: deriveInitiales("Bernard Dupont"),
      email: "bernard.dupont@exemple.fr",
      motDePasse: "demo-hash-bernard",
      role: "COLLABORATEUR",
    },
  });
  const claire = await prisma.utilisateur.create({
    data: {
      uniteId,
      prenom: "Claire",
      nom: "Bernard",
      fonction: "Analyste risques",
      initiales: deriveInitiales("Claire Bernard"),
      email: "claire.bernard@exemple.fr",
      motDePasse: "demo-hash-claire",
      role: "COLLABORATEUR",
    },
  });
  await prisma.utilisateur.create({
    data: {
      uniteId,
      prenom: "Dominique",
      nom: "Admin",
      fonction: "Administrateur plateforme",
      initiales: deriveInitiales("Dominique Admin"),
      email: "admin@exemple.fr",
      motDePasse: "demo-hash-admin",
      role: "ADMINISTRATEUR",
    },
  });
  // Compte inactif — visible dans /unite § Équipe pour illustrer le statut.
  await prisma.utilisateur.create({
    data: {
      uniteId,
      prenom: "Éric",
      nom: "Moreau",
      fonction: "Stagiaire (ancien)",
      initiales: deriveInitiales("Éric Moreau"),
      email: "eric.moreau@exemple.fr",
      motDePasse: "demo-hash-eric",
      role: "COLLABORATEUR",
      actif: false,
    },
  });

  await prisma.unite.update({
    where: { id: uniteId },
    data: {
      responsableId: alice.id,
      adjointId: bernard.id,
    },
  });

  await prisma.sequenceCode.createMany({
    data: [
      { uniteId, prefixe: "PRO", dernier: 3 },
      { uniteId, prefixe: "CNS", dernier: 3 },
      { uniteId, prefixe: "RSK", dernier: 2 },
      { uniteId, prefixe: "CTL", dernier: 3 },
      { uniteId, prefixe: "DOC", dernier: 2 },
      { uniteId, prefixe: "MIS", dernier: 2 },
      { uniteId, prefixe: "REC", dernier: 1 },
      { uniteId, prefixe: "OBJ", dernier: 3 },
      { uniteId, prefixe: "UNT", dernier: 2 },
      { uniteId, prefixe: "AIT", dernier: 4 },
      { uniteId, prefixe: "PRC", dernier: 8 },
      { uniteId, prefixe: "MAC", dernier: 3 },
    ],
  });

  const projetMod = await prisma.projet.create({
    data: {
      uniteId,
      code: "PRO-0001",
      nom: "Modernisation des procédures internes",
      description: "Revue du corpus procédural.",
      taxinomie: "GOUVERNANCE",
      tags: "SCI, procédures",
      responsableId: alice.id,
      dateDebut: daysFromNow(-60),
      dateFinPlanifiee: daysFromNow(30),
      dateEcheance: daysFromNow(45),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 55,
      creeParId: alice.id,
      modifieParId: alice.id,
      membres: {
        create: [{ utilisateurId: bernard.id }, { utilisateurId: claire.id }],
      },
    },
  });

  await prisma.projet.create({
    data: {
      uniteId,
      code: "PRO-0002",
      nom: "Digitalisation du courrier entrant",
      description: "Dématérialisation du circuit courrier.",
      taxinomie: "INFORMATIQUE",
      tags: "digital",
      responsableId: bernard.id,
      dateDebut: daysFromNow(-30),
      dateFinPlanifiee: daysFromNow(14),
      dateEcheance: daysFromNow(20),
      statut: "PLANIFIE",
      priorite: "MOYENNE",
      avancement: 35,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.projet.create({
    data: {
      uniteId,
      code: "PRO-0003",
      nom: "Automatiser le reporting mensuel",
      description: "Idée à explorer — boîte à idées.",
      taxinomie: "FINANCES",
      tags: "reporting, idée",
      responsableId: claire.id,
      statut: "IDEE",
      priorite: "BASSE",
      avancement: 0,
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  // Étapes pondérées (avancement = Σ poids × avancement)
  const projetsSeed = await prisma.projet.findMany({
    where: { uniteId },
    select: { id: true },
  });
  for (const pr of projetsSeed) {
    const exists = await prisma.projetEtape.count({ where: { projetId: pr.id } });
    if (exists > 0) continue;
    await prisma.projetEtape.createMany({
      data: [
        {
          projetId: pr.id,
          libelle: "Cadrage",
          ordre: 0,
          poids: 10,
          avancement: 100,
          termine: true,
        },
        {
          projetId: pr.id,
          libelle: "Analyse",
          ordre: 1,
          poids: 20,
          avancement: 100,
          termine: true,
        },
        {
          projetId: pr.id,
          libelle: "Travaux",
          ordre: 2,
          poids: 40,
          avancement: 45,
          termine: false,
        },
        {
          projetId: pr.id,
          libelle: "Revue",
          ordre: 3,
          poids: 20,
          avancement: 0,
          termine: false,
        },
        {
          projetId: pr.id,
          libelle: "Finalisation",
          ordre: 4,
          poids: 10,
          avancement: 0,
          termine: false,
        },
      ],
    });
    // 10+20+18 = 48 %
    await prisma.projet.update({
      where: { id: pr.id },
      data: { avancement: 48 },
    });
  }

  const reception = daysFromNow(-3);
  const conseil = await prisma.conseil.create({
    data: {
      uniteId,
      code: "CNS-0001",
      objet: "Analyse du seuil de délégation",
      description: "Demande d'avis juridique court.",
      taxinomie: "JURIDIQUE",
      tags: "LSubv, Gouvernance",
      demandeur: "Service Achats",
      entiteDemandeuse: "Direction des Achats",
      dateReception: reception,
      responsableId: claire.id,
      dateEcheance: addBusinessDays(reception, 5),
      statut: "EN_COURS",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const receptionClos = daysFromNow(-20);
  const conseilClos = await prisma.conseil.create({
    data: {
      uniteId,
      code: "CNS-0002",
      objet: "Revue du dispositif de gouvernance LSubv",
      description: "Conseil clôturé — jeu de données pour filtres.",
      taxinomie: "GOUVERNANCE",
      tags: "Gouvernance, LSubv",
      demandeur: "Direction Générale",
      entiteDemandeuse: "Cabinet DG",
      dateReception: receptionClos,
      dateCloture: daysFromNow(-10),
      dateReponse: daysFromNow(-10),
      responsableId: alice.id,
      dateEcheance: daysFromNow(-8),
      statut: "CLOTURE",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const receptionRetard = daysFromNow(-15);
  const conseilRetard = await prisma.conseil.create({
    data: {
      uniteId,
      code: "CNS-0003",
      objet: "Avis sur la clause de confidentialité",
      description: "Conseil en retard — taxinomie juridique.",
      taxinomie: "JURIDIQUE",
      tags: "Contrats",
      demandeur: "Service Juridique",
      entiteDemandeuse: "Direction Juridique",
      dateReception: receptionRetard,
      responsableId: bernard.id,
      dateEcheance: daysFromNow(-2),
      statut: "EN_COURS",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.journalEvenement.createMany({
    data: [
      {
        typeObjet: "CONSEIL",
        objetId: conseil.id,
        typeEvenement: "CREATION",
        message: "Conseil créé — Analyse du seuil de délégation",
        automatique: true,
        auteurId: alice.id,
        creeLe: reception,
      },
      {
        typeObjet: "CONSEIL",
        objetId: conseil.id,
        typeEvenement: "NOTE",
        message: "Premier échange téléphonique avec le demandeur.",
        automatique: false,
        auteurId: claire.id,
        creeLe: daysFromNow(-1),
      },
      {
        typeObjet: "CONSEIL",
        objetId: conseilClos.id,
        typeEvenement: "CREATION",
        message: "Conseil créé — Revue gouvernance",
        automatique: true,
        auteurId: alice.id,
        creeLe: receptionClos,
      },
      {
        typeObjet: "CONSEIL",
        objetId: conseilRetard.id,
        typeEvenement: "CREATION",
        message: "Conseil créé — Clause de confidentialité",
        automatique: true,
        auteurId: alice.id,
        creeLe: receptionRetard,
      },
    ],
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Analyser la question du seuil de délégation",
      responsableId: claire.id,
      conseilId: conseil.id,
      dateEcheance: conseil.dateEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "CONSEIL",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Finaliser la cartographie des processus",
      responsableId: alice.id,
      projetId: projetMod.id,
      dateEcheance: daysFromNow(-5),
      statut: "EN_COURS",
      priorite: "CRITIQUE",
      categorie: "PROJET",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Valider le plan de formation agents",
      responsableId: bernard.id,
      projetId: projetMod.id,
      dateEcheance: daysFromNow(3),
      statut: "A_VALIDER",
      priorite: "HAUTE",
      categorie: "PROJET",
      soumisParId: bernard.id,
      dateSoumission: daysFromNow(-1),
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Préparer la note de cadrage (terminée)",
      responsableId: claire.id,
      projetId: projetMod.id,
      dateEcheance: daysFromNow(-20),
      statut: "TERMINE",
      priorite: "MOYENNE",
      categorie: "PROJET",
      dateValidation: daysFromNow(-15),
      valideParId: alice.id,
      creeParId: claire.id,
      modifieParId: alice.id,
    },
  });

  const risque = await prisma.risque.create({
    data: {
      uniteId,
      code: "RSK-0001",
      nom: "Accès applicatifs non maîtrisés",
      description: "Droits utilisateurs trop larges.",
      taxinomie: "INFORMATIQUE",
      tags: "cyber, accès",
      processus: "Sécurité informatique",
      responsableId: bernard.id,
      categorie: "CYBERSECURITE",
      probabilite: 4,
      impact: 4,
      criticite: 16,
      strategie: "REDUIRE",
      statut: "EN_TRAITEMENT",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.risque.create({
    data: {
      uniteId,
      code: "RSK-0002",
      nom: "Dépassement budgétaire engagements",
      taxinomie: "FINANCES",
      tags: "budget",
      processus: "Finances",
      responsableId: alice.id,
      categorie: "FINANCIER",
      probabilite: 3,
      impact: 5,
      criticite: 15,
      strategie: null,
      statut: "IDENTIFIE",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const processusAcces = await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0001",
      nom: "Gestion des accès applicatifs",
      description:
        "Cycle de vie des droits d’accès aux applications métier de l’unité.",
      tags: "accès,SI",
      responsableId: bernard.id,
      statut: "ACTIF",
      criticite: 4,
      reference: "https://confluence.example/processus/acces",
      creeParId: bernard.id,
      modifieParId: bernard.id,
      etapes: {
        create: [
          { libelle: "Demande", ordre: 0 },
          { libelle: "Validation", ordre: 1 },
          { libelle: "Attribution", ordre: 2 },
          { libelle: "Revue périodique", ordre: 3 },
        ],
      },
    },
  });

  await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0002",
      nom: "Engagements budgétaires",
      description: "Instruction et suivi des engagements de dépense.",
      responsableId: alice.id,
      statut: "ACTIF",
      criticite: 3,
      creeParId: alice.id,
      modifieParId: alice.id,
      etapes: {
        create: [
          { libelle: "Demande d’engagement", ordre: 0 },
          { libelle: "Contrôle budgétaire", ordre: 1 },
          { libelle: "Validation", ordre: 2 },
        ],
      },
    },
  });

  const processusAudit = await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0004",
      nom: "Réaliser un audit",
      description:
        "Enchaînement type d’une mission d’assurance — le détail procédural est dans Confluence.",
      tags: "audit,mission",
      responsableId: alice.id,
      statut: "ACTIF",
      reference: "https://confluence.example/processus/realiser-audit",
      creeParId: alice.id,
      modifieParId: alice.id,
      etapes: {
        create: [
          { libelle: "Planification", ordre: 0 },
          { libelle: "Substantif", ordre: 1 },
          { libelle: "Recommandations", ordre: 2 },
          { libelle: "Rapport", ordre: 3 },
          { libelle: "Suivi", ordre: 4 },
        ],
      },
    },
  });

  const macroAudit = await prisma.macroprocessus.create({
    data: {
      uniteId,
      code: "MAC-0001",
      nom: "Audit",
      description: "Famille des activités d’audit et de revue d’assurance.",
      responsableId: alice.id,
      ordre: 1,
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  const macroEnquete = await prisma.macroprocessus.create({
    data: {
      uniteId,
      code: "MAC-0002",
      nom: "Enquête",
      description: "Famille des enquêtes (PC / RI).",
      responsableId: alice.id,
      ordre: 2,
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  const macroGouvernance = await prisma.macroprocessus.create({
    data: {
      uniteId,
      code: "MAC-0003",
      nom: "Gouvernance SI",
      description: "Processus transverses de gouvernance des systèmes d’information.",
      responsableId: bernard.id,
      ordre: 3,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0005",
      nom: "Revue de processus",
      description: "Revue périodique d’un processus métier.",
      responsableId: alice.id,
      statut: "ACTIF",
      macroprocessusId: macroAudit.id,
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0006",
      nom: "Conseil",
      description: "Activité de conseil structurée.",
      responsableId: alice.id,
      statut: "ACTIF",
      macroprocessusId: macroAudit.id,
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0007",
      nom: "Enquête PC",
      description: "Enquête de type PC.",
      responsableId: bernard.id,
      statut: "ACTIF",
      macroprocessusId: macroEnquete.id,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });
  await prisma.processus.create({
    data: {
      uniteId,
      code: "PRC-0008",
      nom: "Enquête RI",
      description: "Enquête de type RI.",
      responsableId: bernard.id,
      statut: "ACTIF",
      macroprocessusId: macroEnquete.id,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.processus.update({
    where: { id: processusAudit.id },
    data: { macroprocessusId: macroAudit.id },
  });
  await prisma.processus.update({
    where: { id: processusAcces.id },
    data: { macroprocessusId: macroGouvernance.id },
  });

  const actifIam = await prisma.actifIT.create({
    data: {
      uniteId,
      code: "AIT-0001",
      nom: "Annuaire / IAM",
      type: "SYSTEME",
      description: "Gestion des identités et des accès.",
      responsableId: bernard.id,
      statut: "ACTIF",
      hebergement: "On-premise",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });
  const actifErp = await prisma.actifIT.create({
    data: {
      uniteId,
      code: "AIT-0002",
      nom: "ERP métier",
      type: "APPLICATION",
      description: "Application cœur de métier.",
      responsableId: alice.id,
      statut: "ACTIF",
      fournisseur: "Éditeur exemple",
      hebergement: "SaaS",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  await prisma.actifIT.create({
    data: {
      uniteId,
      code: "AIT-0003",
      nom: "Compétence critique — instruction RI",
      type: "COMPETENCE_CRITIQUE",
      description: "Savoir-faire rare pour les enquêtes RI (pas une personne nominative).",
      responsableId: alice.id,
      statut: "ACTIF",
      criticite: 4,
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  await prisma.actifIT.create({
    data: {
      uniteId,
      code: "AIT-0004",
      nom: "Hébergeur documents",
      type: "PRESTATAIRE",
      description: "Tiers assurant l’hébergement documentaire.",
      responsableId: bernard.id,
      statut: "ACTIF",
      serviceFourni: "Hébergement et archivage documentaire",
      criticite: 3,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });
  await prisma.processusActifIT.createMany({
    data: [
      {
        processusId: processusAcces.id,
        actifITId: actifIam.id,
        lieParId: bernard.id,
      },
      {
        processusId: processusAcces.id,
        actifITId: actifErp.id,
        lieParId: bernard.id,
      },
    ],
  });

  // RACI démo sur le processus accès (facultatif)
  const etapesAcces = await prisma.processusEtape.findMany({
    where: { processusId: processusAcces.id },
    orderBy: { ordre: "asc" },
  });
  if (etapesAcces[0] && etapesAcces[1]) {
    const ligneDemande = await prisma.processusRaciLigne.create({
      data: {
        processusId: processusAcces.id,
        etapeId: etapesAcces[0].id,
        activite: etapesAcces[0].libelle,
        ordre: 0,
      },
    });
    const ligneValid = await prisma.processusRaciLigne.create({
      data: {
        processusId: processusAcces.id,
        etapeId: etapesAcces[1].id,
        activite: etapesAcces[1].libelle,
        ordre: 1,
      },
    });
    await prisma.processusRaciParticipant.createMany({
      data: [
        { ligneId: ligneDemande.id, role: "R", utilisateurId: bernard.id },
        { ligneId: ligneDemande.id, role: "A", utilisateurId: alice.id },
        { ligneId: ligneValid.id, role: "A", utilisateurId: alice.id },
        { ligneId: ligneValid.id, role: "C", utilisateurId: bernard.id },
      ],
    });
  }

  const modeleEntree = await prisma.modeleTache.create({
    data: {
      uniteId,
      code: "MDL-0001",
      nom: "Entrée d’un collaborateur",
      description:
        "Checklist standard d’onboarding opérationnel (accès, matériel, brief).",
      delaiJours: 5,
      responsableDefautId: bernard.id,
      categorieDefaut: "ADMINISTRATIF",
      actif: true,
      creeParId: bernard.id,
      etapes: {
        create: [
          { libelle: "Créer le compte applicatif", ordre: 0 },
          { libelle: "Attribuer les droits d’accès", ordre: 1 },
          { libelle: "Remettre le matériel", ordre: 2 },
          { libelle: "Brief sécurité / LPD", ordre: 3 },
          { libelle: "Confirmer la prise de poste", ordre: 4 },
        ],
      },
    },
  });

  await prisma.modeleTacheProcessus.create({
    data: {
      modeleTacheId: modeleEntree.id,
      processusId: processusAcces.id,
      lieParId: bernard.id,
    },
  });

  const modeleAudit = await prisma.modeleTache.create({
    data: {
      uniteId,
      code: "MDL-0002",
      nom: "Préparer le lancement d’une mission",
      description:
        "Étapes transverses avant démarrage substantif d’une mission d’assurance.",
      delaiJours: 10,
      responsableDefautId: alice.id,
      categorieDefaut: "MISSION",
      actif: true,
      creeParId: alice.id,
      etapes: {
        create: [
          { libelle: "Valider le périmètre", ordre: 0 },
          { libelle: "Constituer l’équipe", ordre: 1 },
          { libelle: "Planifier les entretiens", ordre: 2 },
          { libelle: "Préparer le dossier de travail", ordre: 3 },
        ],
      },
    },
  });

  await prisma.modeleTacheProcessus.create({
    data: {
      modeleTacheId: modeleAudit.id,
      processusId: processusAudit.id,
      lieParId: alice.id,
    },
  });

  await prisma.sequenceCode.create({
    data: { uniteId, prefixe: "MDL", dernier: 2 },
  });

  const etapesEntree = await prisma.modeleTacheEtape.findMany({
    where: { modeleTacheId: modeleEntree.id },
    orderBy: { ordre: "asc" },
  });
  const etapesAudit = await prisma.modeleTacheEtape.findMany({
    where: { modeleTacheId: modeleAudit.id },
    orderBy: { ordre: "asc" },
  });

  // Occurrences depuis modèles (snapshots — pas de sync)
  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Entrée d’un collaborateur — Claire Bernard",
      description: modeleEntree.description,
      responsableId: bernard.id,
      modeleTacheId: modeleEntree.id,
      dateEcheance: daysFromNow(3),
      statut: "EN_COURS",
      priorite: "MOYENNE",
      categorie: "ADMINISTRATIF",
      creeParId: bernard.id,
      modifieParId: bernard.id,
      checklistItems: {
        create: etapesEntree.map((e, i) => ({
          libelle: e.libelle,
          ordre: e.ordre,
          sourceModeleEtapeId: e.id,
          fait: i < 2,
          faitParId: i < 2 ? bernard.id : null,
          faitLe: i < 2 ? daysFromNow(-1) : null,
        })),
      },
    },
  });
  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Entrée d’un collaborateur — stagiaire été",
      description: modeleEntree.description,
      responsableId: claire.id,
      modeleTacheId: modeleEntree.id,
      dateEcheance: daysFromNow(-2),
      statut: "A_FAIRE",
      priorite: "HAUTE",
      categorie: "ADMINISTRATIF",
      creeParId: bernard.id,
      modifieParId: bernard.id,
      checklistItems: {
        create: etapesEntree.map((e) => ({
          libelle: e.libelle,
          ordre: e.ordre,
          sourceModeleEtapeId: e.id,
        })),
      },
    },
  });
  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Préparer le lancement — mission subventions",
      description: modeleAudit.description,
      responsableId: alice.id,
      modeleTacheId: modeleAudit.id,
      dateEcheance: daysFromNow(10),
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "MISSION",
      creeParId: alice.id,
      modifieParId: alice.id,
      checklistItems: {
        create: etapesAudit.map((e) => ({
          libelle: e.libelle,
          ordre: e.ordre,
          sourceModeleEtapeId: e.id,
        })),
      },
    },
  });

  const controle = await prisma.controleSCI.create({
    data: {
      uniteId,
      code: "CTL-0001",
      nom: "Revue mensuelle des accès applicatifs",
      description: "Vérification des droits.",
      taxinomie: "INFORMATIQUE",
      tags: "accès",
      processusConcerne: "Sécurité informatique",
      responsableId: bernard.id,
      typeControle: "MANUEL",
      frequence: "MENSUELLE",
      fenetreDeclenchementJours: 7,
      dateDerniereRealisation: daysFromNow(-40),
      dateProchaineEcheance: daysFromNow(-5),
      statut: "ACTIF",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.risqueControle.create({
    data: { risqueId: risque.id, controleSCIId: controle.id },
  });

  await prisma.lienObjet.create({
    data: {
      uniteId,
      typeA: "PROCESSUS",
      idA: processusAcces.id,
      typeB: "RISQUE",
      idB: risque.id,
      libelle: "Processus porteur",
      creeParId: bernard.id,
    },
  });
  await prisma.lienObjet.create({
    data: {
      uniteId,
      typeA: "CONTROLE_SCI",
      idA: controle.id,
      typeB: "PROCESSUS",
      idB: processusAcces.id,
      libelle: "Contrôle du processus",
      creeParId: bernard.id,
    },
  });

  const anneeCourante = new Date().getFullYear();
  const objSci = await prisma.objectif.create({
    data: {
      uniteId,
      code: "OBJ-0001",
      intitule: "Renforcer la surveillance du SCI",
      description:
        "Consolider le dispositif de contrôles et la couverture des risques prioritaires.",
      annee: anneeCourante,
      responsableId: alice.id,
      statut: "EN_COURS",
      priorite: "HAUTE",
      dateEcheance: daysFromNow(120),
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });
  const objAcces = await prisma.objectif.create({
    data: {
      uniteId,
      code: "OBJ-0002",
      intitule: "Maîtriser le cycle de vie des accès",
      description: "Fiabiliser l’entrée, la revue et la sortie des droits applicatifs.",
      annee: anneeCourante,
      responsableId: bernard.id,
      statut: "EN_COURS",
      priorite: "MOYENNE",
      dateEcheance: daysFromNow(90),
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });
  await prisma.objectif.create({
    data: {
      uniteId,
      code: "OBJ-0003",
      intitule: "Améliorer la qualité des missions d’assurance",
      description: "Standardiser le lancement et le suivi des missions.",
      annee: anneeCourante,
      responsableId: alice.id,
      statut: "EN_COURS",
      priorite: "MOYENNE",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.lienObjet.createMany({
    data: [
      {
        uniteId,
        typeA: "OBJECTIF",
        idA: objSci.id,
        typeB: "PROJET",
        idB: projetMod.id,
        libelle: "Contribue à l’objectif",
        creeParId: alice.id,
      },
      {
        uniteId,
        typeA: "OBJECTIF",
        idA: objSci.id,
        typeB: "CONTROLE_SCI",
        idB: controle.id,
        libelle: "Contrôle clé",
        creeParId: alice.id,
      },
      {
        uniteId,
        typeA: "OBJECTIF",
        idA: objSci.id,
        typeB: "RISQUE",
        idB: risque.id,
        libelle: "Risque couvert",
        creeParId: alice.id,
      },
      {
        uniteId,
        typeA: "OBJECTIF",
        idA: objAcces.id,
        typeB: "PROCESSUS",
        idB: processusAcces.id,
        libelle: "Processus porteur",
        creeParId: bernard.id,
      },
    ],
  });

  await prisma.controleSCI.create({
    data: {
      uniteId,
      code: "CTL-0002",
      nom: "Contrôle trimestriel des engagements budgétaires",
      taxinomie: "FINANCES",
      processusConcerne: "Finances",
      responsableId: alice.id,
      typeControle: "SEMI_AUTOMATIQUE",
      frequence: "TRIMESTRIELLE",
      fenetreDeclenchementJours: 14,
      dateDerniereRealisation: daysFromNow(-80),
      dateProchaineEcheance: daysFromNow(4),
      statut: "ACTIF",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.controleSCI.create({
    data: {
      uniteId,
      code: "CTL-0003",
      nom: "Vérification semestrielle du registre des délégations",
      taxinomie: "GOUVERNANCE",
      processusConcerne: "Gouvernance",
      responsableId: claire.id,
      typeControle: "MANUEL",
      frequence: "SEMESTRIELLE",
      fenetreDeclenchementJours: 30,
      dateDerniereRealisation: daysFromNow(-1),
      dateProchaineEcheance: daysFromNow(180),
      statut: "SUSPENDU",
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  // Action SCI hors fenêtre (échéance dans 180 j., fenêtre 30) — ne doit pas polluer Mes actions
  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Réaliser le contrôle : Vérification semestrielle délégations",
      responsableId: claire.id,
      controleSCIId: (
        await prisma.controleSCI.findFirst({ where: { code: "CTL-0003" } })
      )!.id,
      dateEcheance: daysFromNow(180),
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "SCI",
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  const doc = await prisma.document.create({
    data: {
      uniteId,
      code: "DOC-0001",
      nom: "Charte des délégations de signature",
      typeDocument: "CHARTE",
      taxinomie: "GOUVERNANCE",
      tags: "délégations",
      version: "2.1",
      responsableId: alice.id,
      dateApprobation: daysFromNow(-200),
      dateDerniereRevue: daysFromNow(-200),
      frequenceRevue: "ANNUELLE",
      prochaineRevue: daysFromNow(-10),
      fenetreDeclenchementJours: 30,
      statut: "A_REVOIR",
      reference: "https://confluence.exemple.fr/display/GOUV/Charte-delegations",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.document.create({
    data: {
      uniteId,
      code: "DOC-0002",
      nom: "Procédure de contrôle des accès",
      typeDocument: "PROCEDURE",
      taxinomie: "INFORMATIQUE",
      tags: "SCI, accès",
      version: "1.0",
      responsableId: bernard.id,
      dateApprobation: daysFromNow(-100),
      frequenceRevue: "ANNUELLE",
      prochaineRevue: daysFromNow(60),
      fenetreDeclenchementJours: 30,
      statut: "EN_VIGUEUR",
      reference: "https://confluence.exemple.fr/display/SCI/Controle-acces",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Revue annuelle — Charte des délégations",
      responsableId: alice.id,
      documentId: doc.id,
      dateEcheance: daysFromNow(-10),
      statut: "A_FAIRE",
      priorite: "HAUTE",
      categorie: "DOCUMENT",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const mission = await prisma.mission.create({
    data: {
      uniteId,
      code: "MIS-0001",
      titre: "Audit interne — processus Achats",
      typeId: "mtype_audit_general",
      templateId: "mtpl_audit_general_v1",
      descriptifPresetId: "mdesc_achats",
      nature: "Cycle Achats 2026",
      tags: "audit, achats",
      responsableId: alice.id,
      dateDebut: daysFromNow(-20),
      dateFin: daysFromNow(40),
      statut: "EN_COURS",
      creeParId: alice.id,
      modifieParId: alice.id,
      membres: {
        create: [
          {
            utilisateurId: alice.id,
            roles: {
              create: [{ roleId: "mrole_resp_mandat" }],
            },
          },
          {
            utilisateurId: bernard.id,
            roles: {
              create: [{ roleId: "mrole_auditeur" }],
            },
          },
          {
            utilisateurId: claire.id,
            roles: {
              create: [{ roleId: "mrole_resp_unite" }],
            },
          },
        ],
      },
    },
  });

  const reco = await prisma.recommandation.create({
    data: {
      uniteId,
      code: "REC-0001",
      missionId: mission.id,
      titre: "Formaliser le contrôle a posteriori des bons de commande",
      description: "Mettre en place un échantillon mensuel.",
      responsableId: bernard.id,
      dateEcheance: daysFromNow(25),
      statut: "OUVERTE",
    },
  });

  await prisma.tache.create({
    data: {
      uniteId,
      titre: "Mettre en place l'échantillon mensuel BDC",
      responsableId: bernard.id,
      missionId: mission.id,
      recommandationId: reco.id,
      dateEcheance: daysFromNow(25),
      statut: "A_FAIRE",
      priorite: "HAUTE",
      categorie: "MISSION",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.mission.create({
    data: {
      uniteId,
      code: "MIS-0002",
      titre: "Revue qualité — Paie",
      typeId: "mtype_revue_processus",
      templateId: "mtpl_revue_processus_v1",
      nature: "Processus Paie",
      responsableId: claire.id,
      dateDebut: daysFromNow(60),
      dateFin: daysFromNow(90),
      statut: "PLANIFIE",
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  await prisma.objectifAnnuel.createMany({
    data: [
      {
        uniteId,
        utilisateurId: alice.id,
        annee: 2026,
        objectif: "Clôturer 4 missions d'audit",
        attenduAnnuel: "4 missions",
        realiseADate: "1 en cours",
        progression: 25,
        dateEcheance: daysFromNow(120),
      },
      {
        uniteId,
        utilisateurId: bernard.id,
        annee: 2026,
        objectif: "Taux de réalisation contrôles SCI ≥ 95 %",
        attenduAnnuel: "95 %",
        realiseADate: "70 %",
        progression: 70,
        dateEcheance: daysFromNow(120),
      },
      {
        uniteId,
        utilisateurId: claire.id,
        annee: 2026,
        objectif: "Respect du délai 5 j. sur les conseils",
        attenduAnnuel: "≥ 90 %",
        realiseADate: "En cours",
        progression: 40,
        dateEcheance: daysFromNow(120),
      },
    ],
  });

  const annee = new Date().getFullYear();
  await prisma.objectifModule.createMany({
    data: [
      {
        uniteId,
        module: "MISSION",
        annee,
        libelle: "Missions réalisées",
        indicateurCle: "audits_realises",
        cibleNumerique: 4,
        uniteMesure: "missions",
      },
      {
        uniteId,
        module: "CONSEIL",
        annee,
        libelle: "Respect du délai cible",
        indicateurCle: "conseils_respect_delai_pct",
        cibleNumerique: 90,
        uniteMesure: "%",
      },
      {
        uniteId,
        module: "PROJET",
        annee,
        libelle: "Projets clôturés",
        indicateurCle: "projets_clotures",
        cibleNumerique: 2,
        uniteMesure: "projets",
      },
      {
        uniteId,
        module: "CONTROLE_SCI",
        annee,
        libelle: "Taux de réalisation des contrôles",
        indicateurCle: "controles_taux_pct",
        cibleNumerique: 95,
        uniteMesure: "%",
      },
      {
        uniteId,
        module: "RISQUE",
        annee,
        libelle: "Risques critiques ouverts (cible max.)",
        indicateurCle: "risques_critiques",
        cibleNumerique: 0,
        uniteMesure: "risques",
      },
      {
        uniteId,
        module: "DOCUMENT",
        annee,
        libelle: "Documents en vigueur",
        indicateurCle: "documents_en_vigueur",
        cibleNumerique: 10,
        uniteMesure: "documents",
      },
    ],
  });

  // Deuxième unité (témoin multi-unités — bascule via le sélecteur démo)
  const denis = await prisma.utilisateur.create({
    data: {
      uniteId: uniteFinance.id,
      prenom: "Denis",
      nom: "Leroy",
      initiales: deriveInitiales("Denis Leroy"),
      email: "denis.leroy@exemple.fr",
      motDePasse: "demo-hash-denis",
      role: "RESPONSABLE",
    },
  });
  await prisma.sequenceCode.createMany({
    data: [
      { uniteId: uniteFinance.id, prefixe: "PRO", dernier: 1 },
      { uniteId: uniteFinance.id, prefixe: "CNS", dernier: 0 },
      { uniteId: uniteFinance.id, prefixe: "RSK", dernier: 0 },
      { uniteId: uniteFinance.id, prefixe: "CTL", dernier: 0 },
      { uniteId: uniteFinance.id, prefixe: "DOC", dernier: 0 },
      { uniteId: uniteFinance.id, prefixe: "MIS", dernier: 0 },
      { uniteId: uniteFinance.id, prefixe: "REC", dernier: 0 },
    ],
  });
  await prisma.projet.create({
    data: {
      uniteId: uniteFinance.id,
      code: "PRO-0001",
      nom: "Migration reporting financier",
      description: "Projet témoin de l'unité Finance.",
      taxinomie: "FINANCES",
      responsableId: denis.id,
      dateDebut: daysFromNow(-14),
      dateEcheance: daysFromNow(70),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 20,
      creeParId: denis.id,
      modifieParId: denis.id,
    },
  });
  await prisma.objectifModule.create({
    data: {
      uniteId: uniteFinance.id,
      module: "PROJET",
      annee,
      libelle: "Projets clôturés",
      indicateurCle: "projets_clotures",
      cibleNumerique: 1,
      uniteMesure: "projets",
    },
  });

  console.log("✅ Seed Vague C terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
