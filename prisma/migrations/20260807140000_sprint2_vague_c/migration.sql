-- Vague C : Unité, ObjectifModule, référentiels, rattachement multi-unités

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- 1. Unités
CREATE TABLE "Unite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Unite_code_key" ON "Unite"("code");

INSERT INTO "Unite" ("id", "code", "nom", "actif", "creeLe", "modifieLe")
VALUES ('unite_grc_demo', 'U-GRC', 'Unité GRC', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Référentiels + objectifs module + paramètres
CREATE TABLE "ObjectifModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "indicateurCle" TEXT NOT NULL,
    "cibleNumerique" REAL,
    "realiseNumerique" REAL,
    "uniteMesure" TEXT,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "dateEcheance" DATETIME,
    "commentaires" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ObjectifModule_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ObjectifModule_uniteId_annee_idx" ON "ObjectifModule"("uniteId", "annee");
CREATE UNIQUE INDEX "ObjectifModule_uniteId_module_annee_indicateurCle_key" ON "ObjectifModule"("uniteId", "module", "annee", "indicateurCle");

CREATE TABLE "ReferentielValeur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL
);
CREATE INDEX "ReferentielValeur_type_actif_ordre_idx" ON "ReferentielValeur"("type", "actif", "ordre");
CREATE UNIQUE INDEX "ReferentielValeur_type_code_key" ON "ReferentielValeur"("type", "code");

CREATE TABLE "ParametreFonctionnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "description" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ParametreFonctionnel_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ParametreFonctionnel_uniteId_cle_key" ON "ParametreFonctionnel"("uniteId", "cle");

-- 3. Utilisateur + uniteId
CREATE TABLE "new_Utilisateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Utilisateur_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Utilisateur" ("id", "uniteId", "nom", "email", "motDePasse", "role", "actif", "creeLe", "modifieLe")
SELECT "id", 'unite_grc_demo', "nom", "email", "motDePasse", "role", "actif", "creeLe", "modifieLe" FROM "Utilisateur";
DROP TABLE "Utilisateur";
ALTER TABLE "new_Utilisateur" RENAME TO "Utilisateur";
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- 4. SequenceCode par unité
CREATE TABLE "new_SequenceCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "dernier" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SequenceCode_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SequenceCode" ("id", "uniteId", "prefixe", "dernier")
SELECT lower(hex(randomblob(12))), 'unite_grc_demo', "prefixe", "dernier" FROM "SequenceCode";
DROP TABLE "SequenceCode";
ALTER TABLE "new_SequenceCode" RENAME TO "SequenceCode";
CREATE UNIQUE INDEX "SequenceCode_uniteId_prefixe_key" ON "SequenceCode"("uniteId", "prefixe");

-- 5. Objets métier + uniteId
CREATE TABLE "new_Projet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
    "responsableId" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'IDEE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Projet_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Projet" ("id", "uniteId", "code", "nom", "description", "taxinomie", "tags", "responsableId", "dateDebut", "dateEcheance", "statut", "priorite", "avancement", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "nom", "description", "taxinomie", "tags", "responsableId", "dateDebut", "dateEcheance", "statut", "priorite", "avancement", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Projet";
DROP TABLE "Projet";
ALTER TABLE "new_Projet" RENAME TO "Projet";
CREATE INDEX "Projet_uniteId_archive_statut_idx" ON "Projet"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "Projet_uniteId_code_key" ON "Projet"("uniteId", "code");

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
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Conseil_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conseil_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Conseil" ("id", "uniteId", "code", "objet", "description", "taxinomie", "tags", "demandeur", "entiteDemandeuse", "dateReception", "responsableId", "dateEcheance", "statut", "dateReponse", "dateCloture", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "objet", "description", "taxinomie", "tags", "demandeur", "entiteDemandeuse", "dateReception", "responsableId", "dateEcheance", "statut", "dateReponse", "dateCloture", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Conseil";
DROP TABLE "Conseil";
ALTER TABLE "new_Conseil" RENAME TO "Conseil";
CREATE INDEX "Conseil_uniteId_archive_statut_idx" ON "Conseil"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "Conseil_uniteId_code_key" ON "Conseil"("uniteId", "code");

CREATE TABLE "new_Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
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
    CONSTRAINT "Tache_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
INSERT INTO "new_Tache" ("id", "uniteId", "titre", "description", "responsableId", "projetId", "conseilId", "controleSCIId", "auditId", "documentId", "recommandationId", "dateCreation", "dateEcheance", "statut", "priorite", "categorie", "commentaires", "soumisParId", "valideParId", "dateSoumission", "dateValidation", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "titre", "description", "responsableId", "projetId", "conseilId", "controleSCIId", "auditId", "documentId", "recommandationId", "dateCreation", "dateEcheance", "statut", "priorite", "categorie", "commentaires", "soumisParId", "valideParId", "dateSoumission", "dateValidation", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
CREATE INDEX "Tache_uniteId_statut_dateEcheance_idx" ON "Tache"("uniteId", "statut", "dateEcheance");

CREATE TABLE "new_ControleSCI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
    "processusConcerne" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "typeControle" TEXT NOT NULL DEFAULT 'MANUEL',
    "frequence" TEXT NOT NULL,
    "fenetreDeclenchementJours" INTEGER NOT NULL DEFAULT 30,
    "delaiRealisationJours" INTEGER,
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
    CONSTRAINT "ControleSCI_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ControleSCI_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ControleSCI" ("id", "uniteId", "code", "nom", "description", "taxinomie", "tags", "processusConcerne", "responsableId", "typeControle", "frequence", "fenetreDeclenchementJours", "delaiRealisationJours", "dateDerniereRealisation", "dateProchaineEcheance", "statut", "commentaires", "archive", "soumisParId", "valideParId", "dateSoumission", "dateValidation", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "nom", "description", "taxinomie", "tags", "processusConcerne", "responsableId", "typeControle", "frequence", "fenetreDeclenchementJours", "delaiRealisationJours", "dateDerniereRealisation", "dateProchaineEcheance", "statut", "commentaires", "archive", "soumisParId", "valideParId", "dateSoumission", "dateValidation", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "ControleSCI";
DROP TABLE "ControleSCI";
ALTER TABLE "new_ControleSCI" RENAME TO "ControleSCI";
CREATE INDEX "ControleSCI_uniteId_archive_statut_idx" ON "ControleSCI"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "ControleSCI_uniteId_code_key" ON "ControleSCI"("uniteId", "code");

CREATE TABLE "new_Risque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
    "processus" TEXT,
    "responsableId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "probabilite" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "criticite" INTEGER NOT NULL DEFAULT 1,
    "strategie" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'IDENTIFIE',
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Risque_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Risque_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Risque" ("id", "uniteId", "code", "nom", "description", "taxinomie", "tags", "processus", "responsableId", "categorie", "probabilite", "impact", "criticite", "strategie", "statut", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "nom", "description", "taxinomie", "tags", "processus", "responsableId", "categorie", "probabilite", "impact", "criticite", "strategie", "statut", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Risque";
DROP TABLE "Risque";
ALTER TABLE "new_Risque" RENAME TO "Risque";
CREATE INDEX "Risque_uniteId_archive_criticite_idx" ON "Risque"("uniteId", "archive", "criticite");
CREATE UNIQUE INDEX "Risque_uniteId_code_key" ON "Risque"("uniteId", "code");

CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "typeDocument" TEXT NOT NULL DEFAULT 'AUTRE',
    "taxinomie" TEXT,
    "tags" TEXT,
    "version" TEXT,
    "responsableId" TEXT,
    "dateApprobation" DATETIME,
    "dateDerniereRevue" DATETIME,
    "frequenceRevue" TEXT,
    "prochaineRevue" DATETIME,
    "fenetreDeclenchementJours" INTEGER NOT NULL DEFAULT 30,
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
    CONSTRAINT "Document_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("id", "uniteId", "code", "nom", "typeDocument", "taxinomie", "tags", "version", "responsableId", "dateApprobation", "dateDerniereRevue", "frequenceRevue", "prochaineRevue", "fenetreDeclenchementJours", "statut", "description", "reference", "nomFichier", "nomStockage", "chemin", "typeMime", "taille", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "nom", "typeDocument", "taxinomie", "tags", "version", "responsableId", "dateApprobation", "dateDerniereRevue", "frequenceRevue", "prochaineRevue", "fenetreDeclenchementJours", "statut", "description", "reference", "nomFichier", "nomStockage", "chemin", "typeMime", "taille", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE INDEX "Document_uniteId_archive_statut_idx" ON "Document"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "Document_uniteId_code_key" ON "Document"("uniteId", "code");

CREATE TABLE "new_Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "perimetre" TEXT,
    "taxinomie" TEXT,
    "tags" TEXT,
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
    CONSTRAINT "Audit_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Audit" ("id", "uniteId", "code", "titre", "perimetre", "taxinomie", "tags", "responsableId", "dateDebut", "dateFin", "statut", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta")
SELECT "id", 'unite_grc_demo', "code", "titre", "perimetre", "taxinomie", "tags", "responsableId", "dateDebut", "dateFin", "statut", "commentaires", "archive", "creeParId", "modifieParId", "creeLe", "modifieLe", "meta" FROM "Audit";
DROP TABLE "Audit";
ALTER TABLE "new_Audit" RENAME TO "Audit";
CREATE INDEX "Audit_uniteId_archive_statut_idx" ON "Audit"("uniteId", "archive", "statut");
CREATE UNIQUE INDEX "Audit_uniteId_code_key" ON "Audit"("uniteId", "code");

CREATE TABLE "new_ObjectifAnnuel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "objectif" TEXT NOT NULL,
    "attenduAnnuel" TEXT,
    "realiseADate" TEXT,
    "progression" INTEGER NOT NULL DEFAULT 0,
    "dateEcheance" DATETIME,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ObjectifAnnuel_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ObjectifAnnuel_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ObjectifAnnuel" ("id", "uniteId", "utilisateurId", "annee", "objectif", "attenduAnnuel", "realiseADate", "progression", "dateEcheance", "creeLe", "modifieLe")
SELECT "id", 'unite_grc_demo', "utilisateurId", "annee", "objectif", "attenduAnnuel", "realiseADate", "progression", "dateEcheance", "creeLe", "modifieLe" FROM "ObjectifAnnuel";
DROP TABLE "ObjectifAnnuel";
ALTER TABLE "new_ObjectifAnnuel" RENAME TO "ObjectifAnnuel";
CREATE INDEX "ObjectifAnnuel_uniteId_annee_idx" ON "ObjectifAnnuel"("uniteId", "annee");

CREATE TABLE "new_JournalEvenement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "typeEvenement" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "automatique" BOOLEAN NOT NULL DEFAULT true,
    "auteurId" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEvenement_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEvenement_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JournalEvenement" ("id", "uniteId", "typeObjet", "objetId", "typeEvenement", "message", "automatique", "auteurId", "creeLe")
SELECT "id", 'unite_grc_demo', "typeObjet", "objetId", "typeEvenement", "message", "automatique", "auteurId", "creeLe" FROM "JournalEvenement";
DROP TABLE "JournalEvenement";
ALTER TABLE "new_JournalEvenement" RENAME TO "JournalEvenement";
CREATE INDEX "JournalEvenement_typeObjet_objetId_creeLe_idx" ON "JournalEvenement"("typeObjet", "objetId", "creeLe");
CREATE INDEX "JournalEvenement_uniteId_creeLe_idx" ON "JournalEvenement"("uniteId", "creeLe");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
