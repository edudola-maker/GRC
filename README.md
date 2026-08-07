# GRC — Pilotage & Monitoring

Application web interne de pilotage pour une unité administrative.

**Vision produit / feuille de route :** [ROADMAP.md](./ROADMAP.md)  
**Ancrage architecture :** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Sprint 1 — Socle utilisable au quotidien

- **Projets** — créer, modifier, consulter, archiver / désarchiver, supprimer
- **Tâches** — créer, modifier, supprimer, actions rapides (statut, priorité, responsable), échéance, projet optionnel, détection automatique des retards
- **Pilotage** — indicateurs calculés uniquement sur les données SQLite réelles
- **Backlog** — tâches ouvertes filtrables

## Démarrage local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (`prisma/dev.db`)
- Tailwind CSS

## Notes

- Sans authentification pour l’instant : le premier utilisateur actif sert d’auteur des créations/modifications.
- Les projets archivés sont exclus des listes actives et du tableau de bord ; ils restent consultables.
- Ne pas démarrer les modules futurs (Risques, Documents, Équipe…) tant qu’ils ne sont pas demandés.
