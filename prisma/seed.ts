import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { addBusinessDays } from "../src/lib/dates";

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
  console.log("🌱 Seed squelette plateforme…");

  await prisma.historiqueTache.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.recommandation.deleteMany();
  await prisma.auditDocument.deleteMany();
  await prisma.auditMembre.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.risqueControle.deleteMany();
  await prisma.risque.deleteMany();
  await prisma.controleDocument.deleteMany();
  await prisma.controleSCI.deleteMany();
  await prisma.projetDocument.deleteMany();
  await prisma.jalon.deleteMany();
  await prisma.projetMembre.deleteMany();
  await prisma.conseil.deleteMany();
  await prisma.document.deleteMany();
  await prisma.objectifAnnuel.deleteMany();
  await prisma.projet.deleteMany();
  await prisma.utilisateur.deleteMany();

  const alice = await prisma.utilisateur.create({
    data: {
      nom: "Alice Martin",
      email: "alice.martin@exemple.fr",
      motDePasse: "demo-hash-alice",
    },
  });
  const bernard = await prisma.utilisateur.create({
    data: {
      nom: "Bernard Dupont",
      email: "bernard.dupont@exemple.fr",
      motDePasse: "demo-hash-bernard",
    },
  });
  const claire = await prisma.utilisateur.create({
    data: {
      nom: "Claire Bernard",
      email: "claire.bernard@exemple.fr",
      motDePasse: "demo-hash-claire",
    },
  });

  const projetMod = await prisma.projet.create({
    data: {
      nom: "Modernisation des procédures internes",
      description: "Revue du corpus procédural.",
      responsableId: alice.id,
      dateDebut: daysFromNow(-60),
      dateEcheance: daysFromNow(45),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 55,
      creeParId: alice.id,
      modifieParId: alice.id,
      membres: {
        create: [{ utilisateurId: bernard.id }, { utilisateurId: claire.id }],
      },
      jalons: {
        create: [
          {
            nom: "Cartographie validée",
            dateEcheance: daysFromNow(-10),
            atteint: true,
            dateAtteinte: daysFromNow(-12),
          },
          {
            nom: "Diffusion procédures",
            dateEcheance: daysFromNow(30),
            atteint: false,
          },
        ],
      },
    },
  });

  const projetDig = await prisma.projet.create({
    data: {
      nom: "Digitalisation du courrier entrant",
      description: "Dématérialisation du circuit courrier.",
      responsableId: bernard.id,
      dateDebut: daysFromNow(-30),
      dateEcheance: daysFromNow(20),
      statut: "EN_COURS",
      priorite: "MOYENNE",
      avancement: 35,
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.projet.create({
    data: {
      nom: "Préparation du rapport annuel",
      responsableId: claire.id,
      dateDebut: daysFromNow(-10),
      dateEcheance: daysFromNow(90),
      statut: "A_FAIRE",
      priorite: "BASSE",
      avancement: 5,
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  const reception = daysFromNow(-3);
  const conseil = await prisma.conseil.create({
    data: {
      objet: "Analyse du seuil de délégation",
      description: "Demande d'avis juridique court.",
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

  await prisma.tache.create({
    data: {
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
      titre: "Configurer le scanner multifonction",
      responsableId: claire.id,
      projetId: projetDig.id,
      dateEcheance: daysFromNow(7),
      statut: "EN_COURS",
      priorite: "MOYENNE",
      categorie: "PROJET",
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  const risque = await prisma.risque.create({
    data: {
      nom: "Accès applicatifs non maîtrisés",
      description: "Droits utilisateurs trop larges.",
      processus: "Sécurité informatique",
      responsableId: bernard.id,
      categorie: "CYBERSECURITE",
      probabilite: 4,
      impact: 4,
      criticite: 16,
      statut: "EN_TRAITEMENT",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.risque.create({
    data: {
      nom: "Dépassement budgétaire engagements",
      processus: "Finances",
      responsableId: alice.id,
      categorie: "FINANCIER",
      probabilite: 3,
      impact: 5,
      criticite: 15,
      statut: "IDENTIFIE",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const controle = await prisma.controleSCI.create({
    data: {
      nom: "Revue mensuelle des accès applicatifs",
      description: "Vérification des droits.",
      processusConcerne: "Sécurité informatique",
      responsableId: bernard.id,
      frequence: "MENSUELLE",
      dateDerniereRealisation: daysFromNow(-40),
      dateProchaineEcheance: daysFromNow(-5),
      statut: "EN_RETARD",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.risqueControle.create({
    data: { risqueId: risque.id, controleSCIId: controle.id },
  });

  await prisma.controleSCI.create({
    data: {
      nom: "Contrôle trimestriel des engagements budgétaires",
      processusConcerne: "Finances",
      responsableId: alice.id,
      frequence: "TRIMESTRIELLE",
      dateDerniereRealisation: daysFromNow(-80),
      dateProchaineEcheance: daysFromNow(4),
      statut: "A_REALISER",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.controleSCI.create({
    data: {
      nom: "Vérification semestrielle du registre des délégations",
      processusConcerne: "Gouvernance",
      responsableId: claire.id,
      frequence: "SEMESTRIELLE",
      dateDerniereRealisation: daysFromNow(-1),
      dateProchaineEcheance: daysFromNow(180),
      statut: "A_VALIDER",
      soumisParId: claire.id,
      dateSoumission: daysFromNow(-1),
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  const doc = await prisma.document.create({
    data: {
      nom: "Charte des délégations de signature",
      typeDocument: "CHARTE",
      version: "2.1",
      responsableId: alice.id,
      dateApprobation: daysFromNow(-200),
      dateDerniereRevue: daysFromNow(-200),
      frequenceRevue: "ANNUELLE",
      prochaineRevue: daysFromNow(-10),
      statut: "A_REVOIR",
      reference: "DIR-DEL-2025",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.document.create({
    data: {
      nom: "Procédure de contrôle des accès",
      typeDocument: "PROCEDURE",
      version: "1.0",
      responsableId: bernard.id,
      dateApprobation: daysFromNow(-100),
      frequenceRevue: "ANNUELLE",
      prochaineRevue: daysFromNow(60),
      statut: "EN_VIGUEUR",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.tache.create({
    data: {
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

  const audit = await prisma.audit.create({
    data: {
      titre: "Audit interne — processus Achats",
      perimetre: "Cycle Achats 2026",
      responsableId: alice.id,
      dateDebut: daysFromNow(-20),
      dateFin: daysFromNow(40),
      statut: "EN_COURS",
      creeParId: alice.id,
      modifieParId: alice.id,
      membres: { create: [{ utilisateurId: bernard.id }] },
    },
  });

  const reco = await prisma.recommandation.create({
    data: {
      auditId: audit.id,
      titre: "Formaliser le contrôle a posteriori des bons de commande",
      description: "Mettre en place un échantillon mensuel.",
      responsableId: bernard.id,
      dateEcheance: daysFromNow(25),
      statut: "OUVERTE",
    },
  });

  await prisma.tache.create({
    data: {
      titre: "Mettre en place l'échantillon mensuel BDC",
      responsableId: bernard.id,
      auditId: audit.id,
      recommandationId: reco.id,
      dateEcheance: daysFromNow(25),
      statut: "A_FAIRE",
      priorite: "HAUTE",
      categorie: "AUDIT",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.audit.create({
    data: {
      titre: "Revue qualité — Paie",
      perimetre: "Processus Paie",
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
        utilisateurId: alice.id,
        annee: 2026,
        objectif: "Clôturer 4 missions d'audit",
        attenduAnnuel: "4 missions",
        realiseADate: "1 en cours",
        progression: 25,
        dateEcheance: daysFromNow(120),
      },
      {
        utilisateurId: bernard.id,
        annee: 2026,
        objectif: "Taux de réalisation contrôles SCI ≥ 95 %",
        attenduAnnuel: "95 %",
        realiseADate: "70 %",
        progression: 70,
        dateEcheance: daysFromNow(120),
      },
      {
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

  console.log("✅ Seed terminé (utilisateurs, projets, conseils, SCI, risques, documents, audits, objectifs).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
