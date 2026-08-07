-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Projet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'A_FAIRE',
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "commentaires" TEXT,
    "archive" BOOLEAN NOT NULL DEFAULT false,
    "creeParId" TEXT NOT NULL,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    "meta" JSONB,
    CONSTRAINT "Projet_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Projet_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Projet" ("avancement", "commentaires", "creeLe", "creeParId", "dateDebut", "dateEcheance", "description", "id", "meta", "modifieLe", "modifieParId", "nom", "priorite", "responsableId", "statut") SELECT "avancement", "commentaires", "creeLe", "creeParId", "dateDebut", "dateEcheance", "description", "id", "meta", "modifieLe", "modifieParId", "nom", "priorite", "responsableId", "statut" FROM "Projet";
DROP TABLE "Projet";
ALTER TABLE "new_Projet" RENAME TO "Projet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
