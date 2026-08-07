import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

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
  console.log("🌱 Initialisation des données de démonstration…");

  // Nettoyage (ordre respectant les clés étrangères)
  await prisma.controleDocument.deleteMany();
  await prisma.document.deleteMany();
  await prisma.historiqueTache.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.controleSCI.deleteMany();
  await prisma.projet.deleteMany();
  await prisma.utilisateur.deleteMany();

  const alice = await prisma.utilisateur.create({
    data: {
      nom: "Alice Martin",
      email: "alice.martin@exemple.fr",
      // Mot de passe de démo uniquement — authentification réelle plus tard
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

  const projetModernisation = await prisma.projet.create({
    data: {
      nom: "Modernisation des procédures internes",
      description:
        "Revue et mise à jour du corpus procédural de l'unité administrative.",
      responsableId: alice.id,
      dateDebut: daysFromNow(-60),
      dateEcheance: daysFromNow(45),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 55,
      commentaires: "Avancement conforme au planning.",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  const projetDigitalisation = await prisma.projet.create({
    data: {
      nom: "Digitalisation du courrier entrant",
      description: "Mise en place du circuit de dématérialisation du courrier.",
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
      description: "Collecte des éléments pour le rapport d'activité.",
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

  // Tâches — mélange : en retard, bientôt, à valider, ouvertes, conseil
  const tacheRetard = await prisma.tache.create({
    data: {
      titre: "Finaliser la cartographie des processus",
      description: "Mettre à jour la cartographie pour le comité de direction.",
      responsableId: alice.id,
      projetId: projetModernisation.id,
      dateEcheance: daysFromNow(-5),
      statut: "EN_COURS",
      priorite: "CRITIQUE",
      categorie: "PROJET",
      commentaires: "Retard lié à la disponibilité des contributeurs.",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.historiqueTache.create({
    data: {
      tacheId: tacheRetard.id,
      modifieParId: alice.id,
      champModifie: "statut",
      ancienneValeur: "A_FAIRE",
      nouvelleValeur: "EN_COURS",
    },
  });

  await prisma.tache.create({
    data: {
      titre: "Valider le plan de formation agents",
      description: "Soumettre le plan au responsable d'unité.",
      responsableId: bernard.id,
      projetId: projetModernisation.id,
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
      description: "Paramétrage et tests de numérisation.",
      responsableId: claire.id,
      projetId: projetDigitalisation.id,
      dateEcheance: daysFromNow(7),
      statut: "EN_COURS",
      priorite: "MOYENNE",
      categorie: "PROJET",
      creeParId: claire.id,
      modifieParId: claire.id,
    },
  });

  await prisma.tache.create({
    data: {
      titre: "Rédiger la note de cadrage archivage",
      description: "Note destinée au service archives.",
      responsableId: alice.id,
      dateEcheance: daysFromNow(14),
      statut: "A_FAIRE",
      priorite: "BASSE",
      categorie: "ADMINISTRATIF",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  await prisma.tache.create({
    data: {
      titre: "Contrôler la qualité des scans de la semaine",
      description: "Échantillon de 20 documents.",
      responsableId: bernard.id,
      projetId: projetDigitalisation.id,
      dateEcheance: daysFromNow(-2),
      statut: "A_VALIDER",
      priorite: "HAUTE",
      categorie: "SCI",
      soumisParId: bernard.id,
      dateSoumission: daysFromNow(-2),
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  // Exemple « Conseil » : tâche indépendante, sans projet
  await prisma.tache.create({
    data: {
      titre: "Analyser la question du seuil de délégation",
      description:
        "Demande d'une unité : rechercher le cadre applicable et proposer une réponse courte.",
      responsableId: claire.id,
      dateEcheance: daysFromNow(2),
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "CONSEIL",
      commentaires: "Demande reçue par téléphone — estimation 2 à 3 heures.",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  // Contrôles SCI
  await prisma.controleSCI.create({
    data: {
      nom: "Revue mensuelle des accès applicatifs",
      description: "Vérification des droits utilisateurs sur les applications métier.",
      processusConcerne: "Sécurité informatique",
      responsableId: bernard.id,
      frequence: "MENSUELLE",
      dateDerniereRealisation: daysFromNow(-40),
      dateProchaineEcheance: daysFromNow(-5),
      statut: "EN_RETARD",
      commentaires: "Échéance dépassée — à planifier en urgence.",
      creeParId: bernard.id,
      modifieParId: bernard.id,
    },
  });

  await prisma.controleSCI.create({
    data: {
      nom: "Contrôle trimestriel des engagements budgétaires",
      description: "Rapprochement engagements / consommations.",
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

  const controleAValider = await prisma.controleSCI.create({
    data: {
      nom: "Vérification semestrielle du registre des délégations",
      description: "Contrôle de cohérence et de validité des délégations de signature.",
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

  await prisma.controleSCI.create({
    data: {
      nom: "Audit annuel de la piste d'audit comptable",
      description: "Revue documentaire de la piste d'audit.",
      processusConcerne: "Comptabilité",
      responsableId: alice.id,
      frequence: "ANNUELLE",
      dateDerniereRealisation: daysFromNow(-300),
      dateProchaineEcheance: daysFromNow(60),
      statut: "A_REALISER",
      creeParId: alice.id,
      modifieParId: alice.id,
    },
  });

  // Document de démonstration (métadonnées uniquement — pas de fichier réel à cette étape)
  const preuve = await prisma.document.create({
    data: {
      nomFichier: "preuve-delegations-S1.pdf",
      nomStockage: "demo-preuve-delegations.pdf",
      chemin: "uploads/preuves/demo-preuve-delegations.pdf",
      typeMime: "application/pdf",
      taille: 245760,
      description: "Preuve de réalisation — registre des délégations",
      creeParId: claire.id,
    },
  });

  await prisma.controleDocument.create({
    data: {
      controleSCIId: controleAValider.id,
      documentId: preuve.id,
      typeLien: "preuve",
    },
  });

  console.log("✅ Données de démonstration créées.");
  console.log(`   Utilisateurs : 3`);
  console.log(`   Projets      : 3`);
  console.log(`   Tâches       : 6 (dont 1 Conseil sans projet)`);
  console.log(`   Contrôles SCI: 4`);
  console.log(`   Documents    : 1 (métadonnées)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
