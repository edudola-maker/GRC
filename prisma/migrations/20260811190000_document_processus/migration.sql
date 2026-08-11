-- Document ↔ Processus (N–N métier)

CREATE TABLE "DocumentProcessus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "processusId" TEXT NOT NULL,
    "lieParId" TEXT NOT NULL,
    "lieLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentProcessus_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentProcessus_processusId_fkey" FOREIGN KEY ("processusId") REFERENCES "Processus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentProcessus_lieParId_fkey" FOREIGN KEY ("lieParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DocumentProcessus_documentId_processusId_key" ON "DocumentProcessus"("documentId", "processusId");
CREATE INDEX "DocumentProcessus_processusId_idx" ON "DocumentProcessus"("processusId");
CREATE INDEX "DocumentProcessus_documentId_idx" ON "DocumentProcessus"("documentId");
