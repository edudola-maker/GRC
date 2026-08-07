-- Sprint 2 Vague B : codes, taxinomie, tags, journal, nouveaux statuts/projets, SCI, risques

-- Compteurs de codes
CREATE TABLE IF NOT EXISTS "SequenceCode" (
    "prefixe" TEXT NOT NULL PRIMARY KEY,
    "dernier" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "JournalEvenement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeObjet" TEXT NOT NULL,
    "objetId" TEXT NOT NULL,
    "typeEvenement" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "automatique" BOOLEAN NOT NULL DEFAULT true,
    "auteurId" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEvenement_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "JournalEvenement_typeObjet_objetId_creeLe_idx" ON "JournalEvenement"("typeObjet", "objetId", "creeLe");

-- Migrer Projet (statuts + code/taxinomie/tags)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Projet" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_Projet_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Projet_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Projet_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Projet" (
  "id","code","nom","description","responsableId","dateDebut","dateEcheance","statut","priorite","avancement","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT
  "id",
  'PRO-TMP-' || "id",
  "nom","description","responsableId","dateDebut","dateEcheance",
  CASE "statut"
    WHEN 'A_FAIRE' THEN 'PLANIFIE'
    WHEN 'EN_COURS' THEN 'EN_COURS'
    WHEN 'EN_ATTENTE' THEN 'A_ETUDIER'
    WHEN 'TERMINE' THEN 'CLOTURE'
    WHEN 'ANNULE' THEN 'ABANDONNE'
    ELSE 'PLANIFIE'
  END,
  "priorite","avancement","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
FROM "Projet";

DROP TABLE "Projet";
ALTER TABLE "new_Projet" RENAME TO "Projet";
CREATE UNIQUE INDEX "Projet_code_key" ON "Projet"("code");

-- Conseil
CREATE TABLE "new_Conseil" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_Conseil_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Conseil_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Conseil_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Conseil" (
  "id","code","objet","description","demandeur","entiteDemandeuse","dateReception","responsableId","dateEcheance","statut","dateReponse","dateCloture","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT "id", 'CNS-TMP-'||"id", "objet","description","demandeur","entiteDemandeuse","dateReception","responsableId","dateEcheance","statut","dateReponse","dateCloture","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta" FROM "Conseil";
DROP TABLE "Conseil";
ALTER TABLE "new_Conseil" RENAME TO "Conseil";
CREATE UNIQUE INDEX "Conseil_code_key" ON "Conseil"("code");

-- ControleSCI
CREATE TABLE "new_ControleSCI" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_ControleSCI_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_ControleSCI_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_ControleSCI_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_ControleSCI_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "new_ControleSCI_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ControleSCI" (
  "id","code","nom","description","processusConcerne","responsableId","frequence","dateDerniereRealisation","dateProchaineEcheance","statut","commentaires","archive","soumisParId","valideParId","dateSoumission","dateValidation","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT "id",'CTL-TMP-'||"id","nom","description","processusConcerne","responsableId","frequence","dateDerniereRealisation","dateProchaineEcheance","statut","commentaires","archive","soumisParId","valideParId","dateSoumission","dateValidation","creeParId","modifieParId","creeLe","modifieLe","meta" FROM "ControleSCI";
DROP TABLE "ControleSCI";
ALTER TABLE "new_ControleSCI" RENAME TO "ControleSCI";
CREATE UNIQUE INDEX "ControleSCI_code_key" ON "ControleSCI"("code");

-- Risque
CREATE TABLE "new_Risque" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_Risque_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Risque_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Risque_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Risque" (
  "id","code","nom","description","processus","responsableId","categorie","probabilite","impact","criticite","statut","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT "id",'RSK-TMP-'||"id","nom","description","processus","responsableId","categorie","probabilite","impact","criticite","statut","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta" FROM "Risque";
DROP TABLE "Risque";
ALTER TABLE "new_Risque" RENAME TO "Risque";
CREATE UNIQUE INDEX "Risque_code_key" ON "Risque"("code");

-- Document
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_Document_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "new_Document_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Document_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" (
  "id","code","nom","typeDocument","version","responsableId","dateApprobation","dateDerniereRevue","frequenceRevue","prochaineRevue","statut","description","reference","nomFichier","nomStockage","chemin","typeMime","taille","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT "id",'DOC-TMP-'||"id","nom","typeDocument","version","responsableId","dateApprobation","dateDerniereRevue","frequenceRevue","prochaineRevue","statut","description","reference","nomFichier","nomStockage","chemin","typeMime","taille","archive","creeParId","modifieParId","creeLe","modifieLe","meta" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_code_key" ON "Document"("code");

-- Audit
CREATE TABLE "new_Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "meta" JSON,
    CONSTRAINT "new_Audit_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Audit_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "new_Audit_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Audit" (
  "id","code","titre","perimetre","responsableId","dateDebut","dateFin","statut","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta"
)
SELECT "id",'AUD-TMP-'||"id","titre","perimetre","responsableId","dateDebut","dateFin","statut","commentaires","archive","creeParId","modifieParId","creeLe","modifieLe","meta" FROM "Audit";
DROP TABLE "Audit";
ALTER TABLE "new_Audit" RENAME TO "Audit";
CREATE UNIQUE INDEX "Audit_code_key" ON "Audit"("code");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
