/*
  Warnings:

  - Added the required column `nom` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ProjetMembre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    CONSTRAINT "ProjetMembre_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjetMembre_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jalon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateEcheance" DATETIME,
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "dateAtteinte" DATETIME,
    CONSTRAINT "Jalon_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjetDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjetDocument_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjetDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conseil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objet" TEXT NOT NULL,
    "description" TEXT,
    "demandeur" TEXT,
    "entiteDemandeuse" TEXT,
    "dateReception" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'RECU',
    "dateReponse" DATETIME,
    "dateCloture" DATETIME,
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Conseil_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "processus" TEXT,
    "responsableId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "probabilite" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "criticite" INTEGER NOT NULL DEFAULT 1,
    "statut" TEXT NOT NULL DEFAULT 'IDENTIFIE',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RisqueControle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "risqueId" TEXT NOT NULL,
    "controleSCIId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RisqueControle_risqueId_fkey" FOREIGN KEY ("risqueId") REFERENCES "Risque" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RisqueControle_controleSCIId_fkey" FOREIGN KEY ("controleSCIId") REFERENCES "ControleSCI" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "perimetre" TEXT,
    "responsableId" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Audit_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditMembre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    CONSTRAINT "AuditMembre_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditMembre_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditDocument_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommandation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'OUVERTE',
    "commentaires" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Recommandation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recommandation_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObjectifAnnuel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilisateurId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "objectif" TEXT NOT NULL,
    "attenduAnnuel" TEXT,
    "realiseADate" TEXT,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "dateEcheance" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ObjectifAnnuel_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ControleSCI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "processusConcerne" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "frequence" TEXT NOT NULL,
    "dateDerniereRealisation" DATETIME,
    "dateProchaineEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_REALISER',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "soumisParId" TEXT,
    "valideParId" TEXT,
    "dateSoumission" DATETIME,
    "dateValidation" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "ControleSCI_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ControleSCI" ("commentaires", "creeLe", "creeParId", "dateDerniereRealisation", "dateProchaineEcheance", "dateSoumission", "dateValidation", "description", "frequence", "id", "modifieLe", "modifieParId", "nom", "processusConcerne", "responsableId", "soumisParId", "statut", "valideParId") SELECT "commentaires", "creeLe", "creeParId", "dateDerniereRealisation", "dateProchaineEcheance", "dateSoumission", "dateValidation", "description", "frequence", "id", "modifieLe", "modifieParId", "nom", "processusConcerne", "responsableId", "soumisParId", "statut", "valideParId" FROM "ControleSCI";
DROP TABLE "ControleSCI";
ALTER TABLE "new_ControleSCI" RENAME TO "ControleSCI";
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "typeDocument" TEXT NOT NULL DEFAULT 'AUTRE',
    "version" TEXT,
    "responsableId" TEXT,
    "dateApprobation" DATETIME,
    "dateDerniereRevue" DATETIME,
    "frequenceRevue" TEXT,
    "prochaineRevue" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'BROUILLON',
    "description" TEXT,
    "reference" TEXT,
    "nomFichier" TEXT,
    "nomStockage" TEXT,
    "chemin" TEXT,
    "typeMime" TEXT,
    "taille" INTEGER,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Document_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("chemin", "creeLe", "creeParId", "description", "id", "modifieLe", "nom", "nomFichier", "nomStockage", "taille", "typeMime", "modifieParId", "statut", "typeDocument") SELECT "chemin", "creeLe", "creeParId", "description", "id", "modifieLe", COALESCE("nomFichier", 'Document'), "nomFichier", "nomStockage", "taille", "typeMime", "creeParId", 'EN_VIGUEUR', 'AUTRE' FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "projetId" TEXT,
    "conseilId" TEXT,
    "controleSCIId" TEXT,
    "auditId" TEXT,
    "documentId" TEXT,
    "recommandationId" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "categorie" TEXT NOT NULL DEFAULT 'AUTRE',
    "commentaires" TEXT,
    "soumisParId" TEXT,
    "valideParId" TEXT,
    "dateSoumission" DATETIME,
    "dateValidation" DATETIME,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Tache_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_conseilId_fkey" FOREIGN KEY ("conseilId") REFERENCES "Conseil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_controleSCIId_fkey" FOREIGN KEY ("controleSCIId") REFERENCES "ControleSCI" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_recommandationId_fkey" FOREIGN KEY ("recommandationId") REFERENCES "Recommandation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("categorie", "commentaires", "creeLe", "creeParId", "dateCreation", "dateEcheance", "dateSoumission", "dateValidation", "description", "id", "meta", "modifieLe", "modifieParId", "priorite", "projetId", "responsableId", "soumisParId", "statut", "titre", "valideParId") SELECT "categorie", "commentaires", "creeLe", "creeParId", "dateCreation", "dateEcheance", "dateSoumission", "dateValidation", "description", "id", "meta", "modifieLe", "modifieParId", "priorite", "projetId", "responsableId", "soumisParId", "statut", "titre", "valideParId" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjetMembre_projetId_utilisateurId_key" ON "ProjetMembre"("projetId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetDocument_projetId_documentId_key" ON "ProjetDocument"("projetId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "RisqueControle_risqueId_controleSCIId_key" ON "RisqueControle"("risqueId", "controleSCIId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditMembre_auditId_utilisateurId_key" ON "AuditMembre"("auditId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditDocument_auditId_documentId_key" ON "AuditDocument"("auditId", "documentId");
