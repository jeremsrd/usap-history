# Architecture du dépôt

```
usap-history/
├── CLAUDE.md                  # règles et pointeurs — court
├── docs/                      # documentation de référence ; journal/ = archives
├── prisma/
│   ├── schema.prisma
│   └── migrations/            # SQL écrit à la main, appliqué par `prisma db execute`
├── public/images/             # logos/, players/ (+ credits.json), saisons/, usap/
├── src/
│   ├── middleware.ts          # préfixe de langue (307 vers /fr), garde de /admin
│   ├── app/
│   │   ├── [locale]/          # layout racine (<html lang>) et toutes les pages
│   │   │   ├── page.tsx, opengraph-image.tsx
│   │   │   ├── saisons/, matchs/, joueurs/, adversaires/, arbitres/, stades/,
│   │   │   │   entraineurs/, presidents/          # liste + [slug] (saisons : [label])
│   │   │   ├── centurions/, realisateurs/, records/, palmares/, statistiques/
│   │   │   ├── mentions-legales/, confidentialite/
│   │   │   ├── login/
│   │   │   └── admin/         # protégé ; saisons, matchs, joueurs, adversaires…
│   │   ├── api/               # upload, revalidate (purge du cache)
│   │   ├── auth/callback/
│   │   ├── fonts/             # Archivo, pour les images de partage
│   │   ├── robots.ts, sitemap.ts, globals.css, favicon.ico
│   ├── components/            # Header, Footer, Lien, Ecusson, Provenance,
│   │                          #   Signalement, ScoreEvolution, IconeFait, …
│   ├── i18n/                  # fr.ts (source), ca.ts, dictionnaire.ts, langues.ts
│   ├── lib/                   # prisma, scoring, matchs, slugs, seo, cache, og,
│   │                          #   staff, periodes, constants, supabase/
│   └── types/
├── scripts/
│   ├── *.ts                   # chaîne de saisie, maintenance, audits (cf. docs/scripts.md)
│   ├── lib/                   # lnr, epcr, erc, espn, gallica, noms, joueurs, feuilles, …
│   ├── archive/               # scripts à usage unique — ne pas relancer
│   ├── launchd/               # LaunchAgent de la sauvegarde hebdomadaire
│   └── sauvegarde-base.sh     # chemin absolu dans le LaunchAgent : ne pas déplacer
└── .claude/                   # settings, hooks (session web), skills, rules
```

Les routes de détail utilisent `[slug]`, et la page retrouve l'entité par le
CUID en fin de slug. Pas de `tailwind.config.ts` : Tailwind v4 se configure dans
`globals.css`. Les scripts importent `./lib/…` et `../src/lib/…` en relatif :
déplacer un script actif demande de réécrire ses imports.
