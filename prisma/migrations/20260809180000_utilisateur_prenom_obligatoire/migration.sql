-- Prénom obligatoire : backfill puis recreation SQLite (NOT NULL).

UPDATE "Utilisateur"
SET
  "prenom" = TRIM(SUBSTR("nom", 1, INSTR("nom" || ' ', ' ') - 1)),
  "nom" = CASE
    WHEN INSTR("nom", ' ') > 0 THEN TRIM(SUBSTR("nom", INSTR("nom", ' ') + 1))
    ELSE "nom"
  END
WHERE "prenom" IS NULL OR TRIM("prenom") = '';

UPDATE "Utilisateur"
SET "prenom" = "nom"
WHERE "prenom" IS NULL OR TRIM("prenom") = '';

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Utilisateur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uniteId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "fonction" TEXT,
    "initiales" TEXT,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATEUR',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Utilisateur_uniteId_fkey" FOREIGN KEY ("uniteId") REFERENCES "Unite" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Utilisateur" ("id", "uniteId", "nom", "prenom", "fonction", "initiales", "email", "motDePasse", "role", "actif", "creeLe", "modifieLe")
SELECT "id", "uniteId", "nom", COALESCE("prenom", "nom"), "fonction", "initiales", "email", "motDePasse", "role", "actif", "creeLe", "modifieLe" FROM "Utilisateur";

DROP TABLE "Utilisateur";
ALTER TABLE "new_Utilisateur" RENAME TO "Utilisateur";
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

PRAGMA foreign_keys=ON;
