-- AlterTable
ALTER TABLE "Projet" ADD COLUMN "meta" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT NOT NULL,
    "projetId" TEXT,
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
    CONSTRAINT "Tache_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tache_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tache_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tache" ("commentaires", "creeLe", "creeParId", "dateCreation", "dateEcheance", "dateSoumission", "dateValidation", "description", "id", "modifieLe", "modifieParId", "priorite", "projetId", "responsableId", "soumisParId", "statut", "titre", "valideParId") SELECT "commentaires", "creeLe", "creeParId", "dateCreation", "dateEcheance", "dateSoumission", "dateValidation", "description", "id", "modifieLe", "modifieParId", "priorite", "projetId", "responsableId", "soumisParId", "statut", "titre", "valideParId" FROM "Tache";
DROP TABLE "Tache";
ALTER TABLE "new_Tache" RENAME TO "Tache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
