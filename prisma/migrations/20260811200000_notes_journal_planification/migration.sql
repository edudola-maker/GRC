-- CreateTable
CREATE TABLE "NoteTravail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'TRAVAIL',
    "etapeMission" TEXT,
    "notesLibres" TEXT,
    "auteurId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "NoteTravail_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteTravail_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NoteQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "reponse" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "NoteQuestion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "NoteTravail" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NoteParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "utilisateurId" TEXT,
    "nomExterne" TEXT,
    CONSTRAINT "NoteParticipant_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "NoteTravail" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteParticipant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalBordEntree" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "texte" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "tacheId" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalBordEntree_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalBordEntree_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissionObjectif" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MissionObjectif_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissionRisque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "risqueId" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MissionRisque_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MissionRisque_risqueId_fkey" FOREIGN KEY ("risqueId") REFERENCES "Risque" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissionDocumentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "documentAttendu" TEXT NOT NULL,
    "interlocuteur" TEXT,
    "dateDemandee" DATETIME,
    "dateRecue" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'DEMANDE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MissionDocumentation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conseil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "description" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
    "demandeur" TEXT,
    "entiteDemandeuse" TEXT,
    "dateReception" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'RECU',
    "dateReponse" DATETIME,
    "dateCloture" DATETIME,
    "commentaires" TEXT,
    "raisonnement" TEXT,
    "reponseConclusion" TEXT,
    "conseilPrecedentId" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Conseil_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_conseilPrecedentId_fkey" FOREIGN KEY ("conseilPrecedentId") REFERENCES "Conseil" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conseil" ("archive", "code", "commentaires", "creeLe", "creeParId", "dateCloture", "dateEcheance", "dateReception", "dateReponse", "demandeur", "description", "entiteDemandeuse", "id", "meta", "modifieLe", "modifieParId", "objet", "raisonnement", "responsableId", "statut", "tags", "taxinomie", "uniteId") SELECT "archive", "code", "commentaires", "creeLe", "creeParId", "dateCloture", "dateEcheance", "dateReception", "dateReponse", "demandeur", "description", "entiteDemandeuse", "id", "meta", "modifieLe", "modifieParId", "objet", "raisonnement", "responsableId", "statut", "tags", "taxinomie", "uniteId" FROM "Conseil";
DROP TABLE "Conseil";
ALTER TABLE "new_Conseil" RENAME TO "Conseil";
CREATE INDEX "Conseil_uniteId_archive_statut_idx" ON "Conseil"("uniteId", "archive", "statut");
CREATE INDEX "Conseil_conseilPrecedentId_idx" ON "Conseil"("conseilPrecedentId");
CREATE UNIQUE INDEX "Conseil_uniteId_code_key" ON "Conseil"("uniteId", "code");
CREATE TABLE "new_Risque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
    "processus" TEXT,
    "processusId" TEXT,
    "responsableId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "probabilite" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "criticite" INTEGER NOT NULL DEFAULT 1,
    "probabiliteResiduelle" INTEGER,
    "impactResiduel" INTEGER,
    "criticiteResiduelle" INTEGER,
    "strategie" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'IDENTIFIE',
    "commentaires" TEXT,
    "justificationEvaluation" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "contenuVersion" INTEGER NOT NULL DEFAULT 1,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Risque_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Risque" ("archive", "categorie", "code", "commentaires", "contenuVersion", "creeLe", "creeParId", "criticite", "criticiteResiduelle", "description", "id", "impact", "impactResiduel", "justificationEvaluation", "meta", "modifieLe", "modifieParId", "nom", "probabilite", "probabiliteResiduelle", "processus", "processusId", "responsableId", "statut", "strategie", "tags", "taxinomie", "uniteId") SELECT "archive", "categorie", "code", "commentaires", "contenuVersion", "creeLe", "creeParId", "criticite", "criticiteResiduelle", "description", "id", "impact", "impactResiduel", "justificationEvaluation", "meta", "modifieLe", "modifieParId", "nom", "probabilite", "probabiliteResiduelle", "processus", "processusId", "responsableId", "statut", "strategie", "tags", "taxinomie", "uniteId" FROM "Risque";
DROP TABLE "Risque";
ALTER TABLE "new_Risque" RENAME TO "Risque";
CREATE INDEX "Risque_uniteId_archive_criticite_idx" ON "Risque"("uniteId", "archive", "criticite");
CREATE INDEX "Risque_processusId_idx" ON "Risque"("processusId");
CREATE UNIQUE INDEX "Risque_uniteId_code_key" ON "Risque"("uniteId", "code");
CREATE TABLE "new_Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "projetId" TEXT,
    "conseilId" TEXT,
    "controleSCIId" TEXT,
    "missionId" TEXT,
    "documentId" TEXT,
    "recommandationId" TEXT,
    "noteTravailId" TEXT,
    "risqueId" TEXT,
    "modeleTacheId" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebut" DATETIME,
    "dateEcheance" DATETIME,
    "chargeJours" REAL,
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
    CONSTRAINT "Tache_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_conseilId_fkey" FOREIGN KEY ("conseilId") REFERENCES "Conseil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_controleSCIId_fkey" FOREIGN KEY ("controleSCIId") REFERENCES "ControleSCI" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_recommandationId_fkey" FOREIGN KEY ("recommandationId") REFERENCES "Recommandation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_noteTravailId_fkey" FOREIGN KEY ("noteTravailId") REFERENCES "NoteTravail" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_risqueId_fkey" FOREIGN KEY ("risqueId") REFERENCES "Risque" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_modeleTacheId_fkey" FOREIGN KEY ("modeleTacheId") REFERENCES "ModeleTache" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("categorie", "chargeJours", "commentaires", "conseilId", "controleSCIId", "creeLe", "creeParId", "dateCreation", "dateDebut", "dateEcheance", "dateSoumission", "dateValidation", "description", "documentId", "id", "meta", "missionId", "modeleTacheId", "modifieLe", "modifieParId", "priorite", "projetId", "recommandationId", "responsableId", "soumisParId", "statut", "titre", "uniteId", "valideParId") SELECT "categorie", "chargeJours", "commentaires", "conseilId", "controleSCIId", "creeLe", "creeParId", "dateCreation", "dateDebut", "dateEcheance", "dateSoumission", "dateValidation", "description", "documentId", "id", "meta", "missionId", "modeleTacheId", "modifieLe", "modifieParId", "priorite", "projetId", "recommandationId", "responsableId", "soumisParId", "statut", "titre", "uniteId", "valideParId" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
CREATE INDEX "Tache_uniteId_statut_dateEcheance_idx" ON "Tache"("uniteId", "statut", "dateEcheance");
CREATE INDEX "Tache_modeleTacheId_idx" ON "Tache"("modeleTacheId");
CREATE INDEX "Tache_noteTravailId_idx" ON "Tache"("noteTravailId");
CREATE INDEX "Tache_risqueId_idx" ON "Tache"("risqueId");
CREATE TABLE "new_Unite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "adjointId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Unite_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Unite_adjointId_fkey" FOREIGN KEY ("adjointId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Unite" ("actif", "adjointId", "code", "creeLe", "description", "id", "modifieLe", "nom", "responsableId") SELECT "actif", "adjointId", "code", "creeLe", "description", "id", "modifieLe", "nom", "responsableId" FROM "Unite";
DROP TABLE "Unite";
ALTER TABLE "new_Unite" RENAME TO "Unite";
CREATE UNIQUE INDEX "Unite_code_key" ON "Unite"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NoteTravail_typeObjet_objetId_date_idx" ON "NoteTravail"("typeObjet", "objetId", "date");

-- CreateIndex
CREATE INDEX "NoteTravail_uniteId_date_idx" ON "NoteTravail"("uniteId", "date");

-- CreateIndex
CREATE INDEX "NoteTravail_etapeMission_idx" ON "NoteTravail"("etapeMission");

-- CreateIndex
CREATE INDEX "NoteQuestion_noteId_ordre_idx" ON "NoteQuestion"("noteId", "ordre");

-- CreateIndex
CREATE INDEX "NoteParticipant_noteId_idx" ON "NoteParticipant"("noteId");

-- CreateIndex
CREATE INDEX "JournalBordEntree_typeObjet_objetId_date_idx" ON "JournalBordEntree"("typeObjet", "objetId", "date");

-- CreateIndex
CREATE INDEX "JournalBordEntree_uniteId_date_idx" ON "JournalBordEntree"("uniteId", "date");

-- CreateIndex
CREATE INDEX "JournalBordEntree_tacheId_idx" ON "JournalBordEntree"("tacheId");

-- CreateIndex
CREATE INDEX "MissionObjectif_missionId_ordre_idx" ON "MissionObjectif"("missionId", "ordre");

-- CreateIndex
CREATE INDEX "MissionRisque_missionId_ordre_idx" ON "MissionRisque"("missionId", "ordre");

-- CreateIndex
CREATE INDEX "MissionRisque_risqueId_idx" ON "MissionRisque"("risqueId");

-- CreateIndex
CREATE INDEX "MissionDocumentation_missionId_ordre_idx" ON "MissionDocumentation"("missionId", "ordre");
