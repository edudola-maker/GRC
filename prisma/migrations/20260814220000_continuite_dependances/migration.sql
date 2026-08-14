-- CreateTable
CREATE TABLE "ProcessusContinuité" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "criticite" TEXT,
    "consequencesInterruption" TEXT,
    "mtpdValeur" INTEGER,
    "mtpdUnite" TEXT,
    "rtoValeur" INTEGER,
    "rtoUnite" TEXT,
    "rpoValeur" INTEGER,
    "rpoUnite" TEXT,
    "periodesCritiques" TEXT,
    "modeDegradeMesures" TEXT,
    "commentaire" TEXT,
    "dateDerniereRevue" DATETIME,
    "dateProchaineRevue" DATETIME,
    "modifieParId" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "ProcessusContinuité_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusContinuité_modifieParId_fkey" FOREIGN KEY ("modifieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessusDependance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processusId" TEXT NOT NULL,
    "dependDeId" TEXT NOT NULL,
    "commentaire" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessusDependance_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessusDependance_dependDeId_fkey" FOREIGN KEY ("dependDeId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessusContinuité_processusId_key" ON "ProcessusContinuité"("processusId");

-- CreateIndex
CREATE INDEX "ProcessusDependance_dependDeId_idx" ON "ProcessusDependance"("dependDeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessusDependance_processusId_dependDeId_key" ON "ProcessusDependance"("processusId", "dependDeId");
