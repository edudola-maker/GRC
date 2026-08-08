-- CreateTable Processus + enum TypeObjetMetier PROCESSUS (SQLite TEXT)

CREATE TABLE "Processus" (
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
    CONSTRAINT "Processus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Processus" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Processus_uniteId_code_key" ON "Processus"("uniteId", "code");
CREATE INDEX "Processus_uniteId_archive_statut_idx" ON "Processus"("uniteId", "archive", "statut");
CREATE INDEX "Processus_parentId_idx" ON "Processus"("parentId");
