-- CreateTable
CREATE TABLE "ObjectifAttribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectifId" TEXT NOT NULL,
    "attributionId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectifAttribution_objectifId_fkey" FOREIGN KEY ("objectifId") REFERENCES "Objectif" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ObjectifAttribution_attributionId_fkey" FOREIGN KEY ("attributionId") REFERENCES "UniteAttribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessusQualite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "responsableRevueId" TEXT,
    "frequence" TEXT NOT NULL DEFAULT 'ANNUELLE',
    "derniereRevue" DATETIME,
    "prochaineRevue" DATETIME,
    "confluenceUrl" TEXT,
    "confluenceAJour" BOOLEAN,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ProcessusQualite_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusQualite_responsableRevueId_fkey" FOREIGN KEY ("responsableRevueId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualiteRevue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "processusId" TEXT NOT NULL,
    "dateRevue" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT,
    "procedureConformePratique" BOOLEAN,
    "pratiqueConformeProcedure" BOOLEAN,
    "raciAJour" BOOLEAN,
    "controlesPertinents" BOOLEAN,
    "confluenceAJour" BOOLEAN,
    "ecartsIdentifies" BOOLEAN,
    "ameliorationProposee" BOOLEAN,
    "commentaire" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualiteRevue_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QualiteRevue_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QualiteRevue_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EcartQualite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "processusId" TEXT NOT NULL,
    "revueId" TEXT,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "tacheId" TEXT,
    "projetId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "EcartQualite_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EcartQualite_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EcartQualite_revueId_fkey" FOREIGN KEY ("revueId") REFERENCES "QualiteRevue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exigence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'A_EVALUER',
    "responsableId" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Exigence_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exigence_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExigenceProcessus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exigenceId" TEXT NOT NULL,
    "processusId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExigenceProcessus_exigenceId_fkey" FOREIGN KEY ("exigenceId") REFERENCES "Exigence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExigenceProcessus_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExigenceControle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exigenceId" TEXT NOT NULL,
    "controleId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExigenceControle_exigenceId_fkey" FOREIGN KEY ("exigenceId") REFERENCES "Exigence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExigenceControle_controleId_fkey" FOREIGN KEY ("controleId") REFERENCES "ControleSCI" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExigenceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exigenceId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExigenceDocument_exigenceId_fkey" FOREIGN KEY ("exigenceId") REFERENCES "Exigence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExigenceDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Arbitrage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "problematique" TEXT,
    "regleRetenue" TEXT NOT NULL,
    "justification" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'EN_VIGUEUR',
    "processusId" TEXT,
    "risqueId" TEXT,
    "decisionId" TEXT,
    "responsableId" TEXT,
    "dateEffet" DATETIME,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Arbitrage_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Arbitrage_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Arbitrage_risqueId_fkey" FOREIGN KEY ("risqueId") REFERENCES "Risque" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Arbitrage_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Arbitrage_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "problematique" TEXT,
    "analyse" TEXT,
    "decisionTexte" TEXT NOT NULL,
    "decideurId" TEXT,
    "dateDecision" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'PROPOSEE',
    "processusId" TEXT,
    "decisionPrecedenteId" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Decision_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Decision_decideurId_fkey" FOREIGN KEY ("decideurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Decision_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Decision_decisionPrecedenteId_fkey" FOREIGN KEY ("decisionPrecedenteId") REFERENCES "Decision" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DecisionExigence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionId" TEXT NOT NULL,
    "exigenceId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DecisionExigence_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DecisionExigence_exigenceId_fkey" FOREIGN KEY ("exigenceId") REFERENCES "Exigence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Objectif" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "cible" TEXT,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "progressionMode" TEXT NOT NULL DEFAULT 'MANUELLE',
    "annee" INTEGER NOT NULL,
    "responsableId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "dateEcheance" DATETIME,
    "smartSpecifique" BOOLEAN NOT NULL DEFAULT false,
    "smartMesurable" BOOLEAN NOT NULL DEFAULT false,
    "smartAtteignable" BOOLEAN NOT NULL DEFAULT false,
    "smartRealiste" BOOLEAN NOT NULL DEFAULT false,
    "smartTemporel" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Objectif_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Objectif_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Objectif" ("annee", "cible", "code", "creeLe", "creeParId", "dateEcheance", "description", "id", "intitule", "modifieLe", "modifieParId", "priorite", "progression", "responsableId", "statut", "uniteId") SELECT "annee", "cible", "code", "creeLe", "creeParId", "dateEcheance", "description", "id", "intitule", "modifieLe", "modifieParId", "priorite", "progression", "responsableId", "statut", "uniteId" FROM "Objectif";
DROP TABLE "Objectif";
ALTER TABLE "new_Objectif" RENAME TO "Objectif";
CREATE INDEX "Objectif_uniteId_annee_statut_idx" ON "Objectif"("uniteId", "annee", "statut");
CREATE INDEX "Objectif_uniteId_intitule_idx" ON "Objectif"("uniteId", "intitule");
CREATE UNIQUE INDEX "Objectif_uniteId_code_key" ON "Objectif"("uniteId", "code");
CREATE TABLE "new_Processus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "responsableId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "criticite" INTEGER,
    "reference" TEXT,
    "parentId" TEXT,
    "macroprocessusId" TEXT,
    "contientDonneesPersonnelles" BOOLEAN NOT NULL DEFAULT false,
    "niveauConfidentialite" TEXT NOT NULL DEFAULT 'INTERNE',
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Processus_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Processus_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Processus_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Processus_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Processus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Processus" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Processus_macroprocessusId_fkey" FOREIGN KEY ("macroprocessusId") REFERENCES "Macroprocessus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Processus" ("archive", "code", "contientDonneesPersonnelles", "creeLe", "creeParId", "criticite", "description", "id", "macroprocessusId", "meta", "modifieLe", "modifieParId", "niveauConfidentialite", "nom", "parentId", "reference", "responsableId", "statut", "tags", "uniteId") SELECT "archive", "code", "contientDonneesPersonnelles", "creeLe", "creeParId", "criticite", "description", "id", "macroprocessusId", "meta", "modifieLe", "modifieParId", "niveauConfidentialite", "nom", "parentId", "reference", "responsableId", "statut", "tags", "uniteId" FROM "Processus";
DROP TABLE "Processus";
ALTER TABLE "new_Processus" RENAME TO "Processus";
CREATE INDEX "Processus_uniteId_archive_statut_idx" ON "Processus"("uniteId", "archive", "statut");
CREATE INDEX "Processus_parentId_idx" ON "Processus"("parentId");
CREATE INDEX "Processus_macroprocessusId_idx" ON "Processus"("macroprocessusId");
CREATE UNIQUE INDEX "Processus_uniteId_code_key" ON "Processus"("uniteId", "code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ObjectifAttribution_attributionId_idx" ON "ObjectifAttribution"("attributionId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjectifAttribution_objectifId_attributionId_key" ON "ObjectifAttribution"("objectifId", "attributionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessusQualite_processusId_key" ON "ProcessusQualite"("processusId");

-- CreateIndex
CREATE INDEX "QualiteRevue_processusId_dateRevue_idx" ON "QualiteRevue"("processusId", "dateRevue");

-- CreateIndex
CREATE INDEX "QualiteRevue_uniteId_idx" ON "QualiteRevue"("uniteId");

-- CreateIndex
CREATE INDEX "EcartQualite_processusId_idx" ON "EcartQualite"("processusId");

-- CreateIndex
CREATE INDEX "EcartQualite_uniteId_idx" ON "EcartQualite"("uniteId");

-- CreateIndex
CREATE INDEX "Exigence_uniteId_archive_statut_idx" ON "Exigence"("uniteId", "archive", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "Exigence_uniteId_code_key" ON "Exigence"("uniteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ExigenceProcessus_exigenceId_processusId_key" ON "ExigenceProcessus"("exigenceId", "processusId");

-- CreateIndex
CREATE UNIQUE INDEX "ExigenceControle_exigenceId_controleId_key" ON "ExigenceControle"("exigenceId", "controleId");

-- CreateIndex
CREATE UNIQUE INDEX "ExigenceDocument_exigenceId_documentId_key" ON "ExigenceDocument"("exigenceId", "documentId");

-- CreateIndex
CREATE INDEX "Arbitrage_uniteId_archive_statut_idx" ON "Arbitrage"("uniteId", "archive", "statut");

-- CreateIndex
CREATE INDEX "Arbitrage_processusId_idx" ON "Arbitrage"("processusId");

-- CreateIndex
CREATE INDEX "Arbitrage_risqueId_idx" ON "Arbitrage"("risqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Arbitrage_uniteId_code_key" ON "Arbitrage"("uniteId", "code");

-- CreateIndex
CREATE INDEX "Decision_uniteId_archive_statut_idx" ON "Decision"("uniteId", "archive", "statut");

-- CreateIndex
CREATE INDEX "Decision_processusId_idx" ON "Decision"("processusId");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_uniteId_code_key" ON "Decision"("uniteId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionExigence_decisionId_exigenceId_key" ON "DecisionExigence"("decisionId", "exigenceId");
