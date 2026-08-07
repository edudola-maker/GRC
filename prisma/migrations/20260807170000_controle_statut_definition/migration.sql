-- Contrôle SCI = définition permanente (Actif / Suspendu).
-- L'exécution opérationnelle passe par les tâches / occurrences.
-- Archivage via le booléen archive existant.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

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
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
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

INSERT INTO "new_ControleSCI" (
    "id", "uniteId", "code", "nom", "description", "taxinomie", "tags",
    "processusConcerne", "responsableId", "typeControle", "frequence",
    "fenetreDeclenchementJours", "delaiRealisationJours",
    "dateDerniereRealisation", "dateProchaineEcheance", "statut",
    "commentaires", "archive", "soumisParId", "valideParId",
    "dateSoumission", "dateValidation", "creeParId", "modifieParId",
    "creeLe", "modifieLe", "meta"
)
SELECT
    "id", "uniteId", "code", "nom", "description", "taxinomie", "tags",
    "processusConcerne", "responsableId", "typeControle", "frequence",
    "fenetreDeclenchementJours", "delaiRealisationJours",
    "dateDerniereRealisation", "dateProchaineEcheance",
    CASE
      WHEN "statut" IN ('SUSPENDU') THEN 'SUSPENDU'
      ELSE 'ACTIF'
    END,
    "commentaires", "archive", "soumisParId", "valideParId",
    "dateSoumission", "dateValidation", "creeParId", "modifieParId",
    "creeLe", "modifieLe", "meta"
FROM "ControleSCI";

DROP TABLE "ControleSCI";
ALTER TABLE "new_ControleSCI" RENAME TO "ControleSCI";

CREATE UNIQUE INDEX "ControleSCI_uniteId_code_key" ON "ControleSCI"("uniteId", "code");
CREATE INDEX "ControleSCI_uniteId_archive_statut_idx" ON "ControleSCI"("uniteId", "archive", "statut");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
