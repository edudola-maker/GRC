/**
 * Jeux de données multi-Organisations (démo).
 * Même moteur, modules et profondeur différents.
 */
import type { PrismaClient, ProfilOrganisation } from "../src/generated/prisma/client";
import { MODULES_PAR_PROFIL } from "../src/lib/modules";
import { deriveInitiales } from "../src/lib/initiales";

function daysFromNow(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function ensureModules(
  prisma: PrismaClient,
  organisationId: string,
  profil: ProfilOrganisation,
) {
  for (const module of MODULES_PAR_PROFIL[profil]) {
    await prisma.organisationModule.upsert({
      where: {
        organisationId_module: { organisationId, module },
      },
      create: { organisationId, module, actif: true },
      update: { actif: true },
    });
  }
}

export async function createOrganisationWithModules(
  prisma: PrismaClient,
  data: {
    id: string;
    code: string;
    nom: string;
    nomCourt: string;
    description: string;
    vision: string;
    profil: ProfilOrganisation;
  },
) {
  const org = await prisma.organisation.create({
    data: {
      id: data.id,
      code: data.code,
      nom: data.nom,
      nomCourt: data.nomCourt,
      description: data.description,
      vision: data.vision,
      profilInitial: data.profil,
      statut: "ACTIF",
    },
  });
  await ensureModules(prisma, org.id, data.profil);
  return org;
}

export async function addMembership(
  prisma: PrismaClient,
  organisationId: string,
  utilisateurId: string,
  role: "ADMINISTRATEUR" | "RESPONSABLE" | "COLLABORATEUR",
  unitePrincipaleId?: string,
) {
  await prisma.organisationMembership.upsert({
    where: {
      organisationId_utilisateurId: { organisationId, utilisateurId },
    },
    create: {
      organisationId,
      utilisateurId,
      role,
      unitePrincipaleId: unitePrincipaleId ?? null,
      actif: true,
    },
    update: {
      role,
      unitePrincipaleId: unitePrincipaleId ?? null,
      actif: true,
    },
  });
}

/** Petite PME — suivi simple, risques légers. */
export async function seedPetitePme(
  prisma: PrismaClient,
  bridgeUserIds: { adminId: string; aliceId: string },
) {
  const org = await createOrganisationWithModules(prisma, {
    id: "org_pme_simple",
    code: "ORG-PME-SIMPLE",
    nom: "Dupont Atelier — Petite PME",
    nomCourt: "Petite PME",
    description: "Microentreprise / petite PME (~6 personnes).",
    vision: "Rester une référence locale de qualité artisanale d’ici 3 ans.",
    profil: "PME_SIMPLE",
  });

  const unite = await prisma.unite.create({
    data: {
      id: "unite_pme_simple",
      organisationId: org.id,
      code: "UNT-0001",
      nom: "Dupont Atelier",
      description: "Unité principale — toute l’activité.",
      actif: true,
    },
  });

  const julie = await prisma.utilisateur.create({
    data: {
      id: "user_pme_julie",
      uniteId: unite.id,
      prenom: "Julie",
      nom: "Dupont",
      fonction: "Dirigeante",
      initiales: deriveInitiales("Julie Dupont"),
      email: "julie.dupont@dupont-atelier.demo",
      motDePasse: "demo-hash-julie",
      role: "RESPONSABLE",
    },
  });
  const marc = await prisma.utilisateur.create({
    data: {
      id: "user_pme_marc",
      uniteId: unite.id,
      prenom: "Marc",
      nom: "Petit",
      fonction: "Production",
      initiales: deriveInitiales("Marc Petit"),
      email: "marc.petit@dupont-atelier.demo",
      motDePasse: "demo-hash-marc",
      role: "COLLABORATEUR",
    },
  });
  const sofia = await prisma.utilisateur.create({
    data: {
      id: "user_pme_sofia",
      uniteId: unite.id,
      prenom: "Sofia",
      nom: "Nguyen",
      fonction: "Commercial",
      initiales: deriveInitiales("Sofia Nguyen"),
      email: "sofia.nguyen@dupont-atelier.demo",
      motDePasse: "demo-hash-sofia",
      role: "COLLABORATEUR",
    },
  });

  await prisma.unite.update({
    where: { id: unite.id },
    data: { responsableId: julie.id },
  });

  await prisma.sequenceCode.createMany({
    data: [
      { uniteId: unite.id, prefixe: "PRO", dernier: 1 },
      { uniteId: unite.id, prefixe: "OBJ", dernier: 1 },
      { uniteId: unite.id, prefixe: "PRC", dernier: 1 },
      { uniteId: unite.id, prefixe: "RSK", dernier: 1 },
      { uniteId: unite.id, prefixe: "TAC", dernier: 3 },
    ],
  });

  const annee = new Date().getFullYear();
  const projet = await prisma.projet.create({
    data: {
      uniteId: unite.id,
      code: "PRO-0001",
      nom: "Moderniser le site vitrine",
      description: "Refonte légère du site et prise de rendez-vous en ligne.",
      taxinomie: "INFORMATIQUE",
      responsableId: sofia.id,
      dateDebut: daysFromNow(-20),
      dateEcheance: daysFromNow(40),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 35,
      creeParId: julie.id,
      modifieParId: julie.id,
    },
  });

  await prisma.objectif.create({
    data: {
      uniteId: unite.id,
      code: "OBJ-0001",
      intitule: "Augmenter le CA de 10 %",
      description: "Croissance organique sur les clients existants.",
      cible: "110 % base N-1",
      progression: 40,
      annee,
      responsableId: julie.id,
      statut: "EN_COURS",
      priorite: "HAUTE",
      dateEcheance: daysFromNow(200),
      smartMesurable: true,
      smartTemporel: true,
      creeParId: julie.id,
      modifieParId: julie.id,
    },
  });

  await prisma.processus.create({
    data: {
      uniteId: unite.id,
      code: "PRC-0001",
      nom: "Prise de commande",
      description: "De la demande client à la confirmation.",
      responsableId: sofia.id,
      statut: "ACTIF",
      criticite: 3,
      creeParId: julie.id,
      modifieParId: julie.id,
    },
  });

  await prisma.risque.create({
    data: {
      uniteId: unite.id,
      code: "RSK-0001",
      nom: "Dépendance à un fournisseur clé",
      description: "Un seul fournisseur pour la matière première critique.",
      taxinomie: "ACHATS",
      responsableId: julie.id,
      categorie: "OPERATIONNEL",
      probabilite: 3,
      impact: 4,
      criticite: 12,
      statut: "IDENTIFIE",
      creeParId: julie.id,
      modifieParId: julie.id,
    },
  });

  await prisma.tache.createMany({
    data: [
      {
        uniteId: unite.id,
        titre: "Valider maquette site",
        statut: "EN_COURS",
        priorite: "HAUTE",
        responsableId: sofia.id,
        dateEcheance: daysFromNow(3),
        dateDebut: daysFromNow(0),
        dateFinPlanifiee: daysFromNow(2),
        projetId: projet.id,
        creeParId: julie.id,
        modifieParId: julie.id,
      },
      {
        uniteId: unite.id,
        titre: "Relancer devis menuiserie",
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        responsableId: marc.id,
        dateEcheance: daysFromNow(-1),
        dateDebut: daysFromNow(-2),
        dateFinPlanifiee: daysFromNow(-1),
        creeParId: julie.id,
        modifieParId: julie.id,
      },
      {
        uniteId: unite.id,
        titre: "Préparer bilan mensuel",
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        responsableId: julie.id,
        dateEcheance: daysFromNow(12),
        dateDebut: daysFromNow(10),
        dateFinPlanifiee: daysFromNow(12),
        creeParId: julie.id,
        modifieParId: julie.id,
      },
    ],
  });

  await addMembership(prisma, org.id, julie.id, "RESPONSABLE", unite.id);
  await addMembership(prisma, org.id, marc.id, "COLLABORATEUR", unite.id);
  await addMembership(prisma, org.id, sofia.id, "COLLABORATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.adminId, "ADMINISTRATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.aliceId, "ADMINISTRATEUR", unite.id);

  return { org, unite };
}

/** PME structurée — core + risques/contrôles/qualité. */
export async function seedPmeStructuree(
  prisma: PrismaClient,
  bridgeUserIds: { adminId: string; aliceId: string },
) {
  const org = await createOrganisationWithModules(prisma, {
    id: "org_pme_struct",
    code: "ORG-PME-STRUCT",
    nom: "Horizon Services SA — PME structurée",
    nomCourt: "PME structurée",
    description: "PME ~35 collaborateurs, structuration progressive.",
    vision: "Professionnaliser le pilotage et la maîtrise opérationnelle.",
    profil: "PME_STRUCTUREE",
  });

  const unite = await prisma.unite.create({
    data: {
      id: "unite_pme_struct",
      organisationId: org.id,
      code: "UNT-0001",
      nom: "Direction générale",
      description: "Unité de pilotage principale.",
      actif: true,
    },
  });

  const nora = await prisma.utilisateur.create({
    data: {
      id: "user_pme_nora",
      uniteId: unite.id,
      prenom: "Nora",
      nom: "Keller",
      fonction: "Directrice",
      initiales: deriveInitiales("Nora Keller"),
      email: "nora.keller@horizon-services.demo",
      motDePasse: "demo-hash-nora",
      role: "RESPONSABLE",
    },
  });
  const paul = await prisma.utilisateur.create({
    data: {
      id: "user_pme_paul",
      uniteId: unite.id,
      prenom: "Paul",
      nom: "Moreau",
      fonction: "Responsable opérations",
      initiales: deriveInitiales("Paul Moreau"),
      email: "paul.moreau@horizon-services.demo",
      motDePasse: "demo-hash-paul",
      role: "COLLABORATEUR",
    },
  });

  await prisma.unite.update({
    where: { id: unite.id },
    data: { responsableId: nora.id },
  });

  await prisma.sequenceCode.createMany({
    data: [
      { uniteId: unite.id, prefixe: "PRO", dernier: 1 },
      { uniteId: unite.id, prefixe: "RSK", dernier: 1 },
      { uniteId: unite.id, prefixe: "CTL", dernier: 1 },
      { uniteId: unite.id, prefixe: "OBJ", dernier: 1 },
      { uniteId: unite.id, prefixe: "TAC", dernier: 2 },
    ],
  });

  await prisma.projet.create({
    data: {
      uniteId: unite.id,
      code: "PRO-0001",
      nom: "Déployer le suivi qualité",
      description: "Mise en place des revues processus et écarts.",
      taxinomie: "GOUVERNANCE",
      responsableId: paul.id,
      dateDebut: daysFromNow(-30),
      dateEcheance: daysFromNow(60),
      statut: "EN_COURS",
      priorite: "HAUTE",
      avancement: 45,
      creeParId: nora.id,
      modifieParId: nora.id,
    },
  });

  await prisma.risque.create({
    data: {
      uniteId: unite.id,
      code: "RSK-0001",
      nom: "Perte de savoir-faire clé",
      description: "Concentrations de compétences sur 2 personnes.",
      taxinomie: "RESSOURCES_HUMAINES",
      responsableId: nora.id,
      categorie: "OPERATIONNEL",
      probabilite: 3,
      impact: 5,
      criticite: 15,
      statut: "IDENTIFIE",
      creeParId: nora.id,
      modifieParId: nora.id,
    },
  });

  await prisma.controleSCI.create({
    data: {
      uniteId: unite.id,
      code: "CTL-0001",
      nom: "Revue mensuelle des accès",
      description: "Contrôle des droits applicatifs critiques.",
      processusConcerne: "Gestion des accès",
      frequence: "MENSUELLE",
      responsableId: paul.id,
      typeControle: "MANUEL",
      statut: "ACTIF",
      creeParId: nora.id,
      modifieParId: nora.id,
    },
  });

  await prisma.tache.createMany({
    data: [
      {
        uniteId: unite.id,
        titre: "Préparer revue qualité Q3",
        statut: "EN_COURS",
        priorite: "HAUTE",
        responsableId: paul.id,
        dateEcheance: daysFromNow(7),
        creeParId: nora.id,
        modifieParId: nora.id,
      },
      {
        uniteId: unite.id,
        titre: "Cartographier 5 processus critiques",
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        responsableId: paul.id,
        dateEcheance: daysFromNow(21),
        creeParId: nora.id,
        modifieParId: nora.id,
      },
    ],
  });

  await addMembership(prisma, org.id, nora.id, "RESPONSABLE", unite.id);
  await addMembership(prisma, org.id, paul.id, "COLLABORATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.adminId, "ADMINISTRATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.aliceId, "ADMINISTRATEUR", unite.id);

  return { org, unite };
}

/** Finance / Contrôle — core + risques + contrôles + objectifs. */
export async function seedFinanceControle(
  prisma: PrismaClient,
  bridgeUserIds: { adminId: string; aliceId: string },
) {
  const org = await createOrganisationWithModules(prisma, {
    id: "org_finance",
    code: "ORG-FINANCE",
    nom: "Direction Finance — Contrôle de gestion",
    nomCourt: "Finance",
    description: "Unité Finance / Contrôle — pilotage budgétaire et SCI.",
    vision: "Fiabiliser le reporting et anticiper les dérives.",
    profil: "FINANCE_CONTROLE",
  });

  const unite = await prisma.unite.create({
    data: {
      id: "unite_finance_demo",
      organisationId: org.id,
      code: "UNT-0001",
      nom: "Finance & Contrôle",
      description: "Pilotage budgétaire, reporting et contrôles.",
      actif: true,
    },
  });

  const denis = await prisma.utilisateur.create({
    data: {
      id: "user_fin_denis",
      uniteId: unite.id,
      prenom: "Denis",
      nom: "Leroy",
      fonction: "Contrôleur de gestion",
      initiales: deriveInitiales("Denis Leroy"),
      email: "denis.leroy@finance.demo",
      motDePasse: "demo-hash-denis",
      role: "RESPONSABLE",
    },
  });
  const emma = await prisma.utilisateur.create({
    data: {
      id: "user_fin_emma",
      uniteId: unite.id,
      prenom: "Emma",
      nom: "Blanc",
      fonction: "Analyste",
      initiales: deriveInitiales("Emma Blanc"),
      email: "emma.blanc@finance.demo",
      motDePasse: "demo-hash-emma",
      role: "COLLABORATEUR",
    },
  });

  await prisma.unite.update({
    where: { id: unite.id },
    data: { responsableId: denis.id },
  });

  await prisma.sequenceCode.createMany({
    data: [
      { uniteId: unite.id, prefixe: "PRO", dernier: 1 },
      { uniteId: unite.id, prefixe: "RSK", dernier: 1 },
      { uniteId: unite.id, prefixe: "CTL", dernier: 1 },
      { uniteId: unite.id, prefixe: "OBJ", dernier: 1 },
      { uniteId: unite.id, prefixe: "TAC", dernier: 2 },
    ],
  });

  await prisma.projet.create({
    data: {
      uniteId: unite.id,
      code: "PRO-0001",
      nom: "Migration reporting financier",
      description: "Projet témoin Finance — reporting consolidé.",
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

  await prisma.risque.create({
    data: {
      uniteId: unite.id,
      code: "RSK-0001",
      nom: "Erreur de reporting mensuel",
      description: "Risque d’écart non détecté avant clôture.",
      taxinomie: "FINANCES",
      responsableId: denis.id,
      categorie: "FINANCIER",
      probabilite: 2,
      impact: 4,
      criticite: 8,
      statut: "IDENTIFIE",
      creeParId: denis.id,
      modifieParId: denis.id,
    },
  });

  await prisma.controleSCI.create({
    data: {
      uniteId: unite.id,
      code: "CTL-0001",
      nom: "Réconciliation bancaire",
      description: "Contrôle de cohérence trésorerie / comptabilité.",
      processusConcerne: "Trésorerie",
      frequence: "MENSUELLE",
      responsableId: emma.id,
      typeControle: "MANUEL",
      statut: "ACTIF",
      creeParId: denis.id,
      modifieParId: denis.id,
    },
  });

  await prisma.tache.createMany({
    data: [
      {
        uniteId: unite.id,
        titre: "Clôturer reporting M-1",
        statut: "EN_COURS",
        priorite: "HAUTE",
        responsableId: emma.id,
        dateEcheance: daysFromNow(2),
        creeParId: denis.id,
        modifieParId: denis.id,
      },
      {
        uniteId: unite.id,
        titre: "Revue budget vs réalisé",
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        responsableId: denis.id,
        dateEcheance: daysFromNow(10),
        creeParId: denis.id,
        modifieParId: denis.id,
      },
    ],
  });

  await addMembership(prisma, org.id, denis.id, "RESPONSABLE", unite.id);
  await addMembership(prisma, org.id, emma.id, "COLLABORATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.adminId, "ADMINISTRATEUR", unite.id);
  await addMembership(prisma, org.id, bridgeUserIds.aliceId, "ADMINISTRATEUR", unite.id);

  return { org, unite, denis };
}
