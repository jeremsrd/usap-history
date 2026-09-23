---
paths:
  - "src/app/**"
  - "src/components/**"
---
# Pages et composants

- Couleurs : jetons sémantiques seulement ; `usap-or-vif` uniquement sur fond sang.
  Principes visuels : `docs/design.md`.
- Liens par `@/components/Lien` ; textes par `dictionnaire()` côté serveur,
  passés en props aux Client Components ; pas de HTML dans une chaîne traduite.
- Page publique nouvelle : `liensAlternatifs(langue, chemin)` dans
  `generateMetadata`, `Signalement` en pied, `Provenance` sur une fiche.
- Toute requête qui compte des matchs : `MATCH_JOUE`. Tout maximum sur une
  colonne que la source peut laisser à zéro : rendre `null` sur zéro.
- Cache : `export const revalidate = 604800` **en littéral** (Next refuse une
  constante), `generateStaticParams` vide sur les fiches `[slug]` ; une page qui
  lit `searchParams` met ses requêtes en `unstable_cache` (JSON seulement : les
  `Date` reviennent en chaîne). Relire le tableau du build. Détail : `docs/infra.md`.
- Admin : garde `auth.getUser()` + rôle dans chaque page et action ;
  `revalidatePath("/[locale]/…", "page")`.
- Une apostrophe en JSX s'écrit `{"L'histoire"}` ; `npm run lint` avant de pousser.
