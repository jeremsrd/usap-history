# Identité visuelle et thème

Principes en vigueur. Le récit page par page du chantier (5-7 septembre 2026 et
suites) est archivé dans `docs/journal/`, à ne lire que sur demande.

## Principes

- **Une seule audace par page**, et c'est une structure réelle de la donnée :
  épine alphabétique, frise des résultats, dos de maillot, tableau d'affichage.
- **Pas de** cartes arrondies à ombre douce, libellés en capitales espacées,
  icônes devant les titres, pastilles, emoji, dégradés, cases de chiffres
  centrées. La densité des tableaux est voulue (références : lfchistory.net).
- **Typographie** : une seule famille, Archivo. `font-display` (condensée, noire)
  pour titres et grands nombres ; largeur normale pour le corps ;
  `tabular-nums` sur les colonnes de chiffres.
- **Palette** autour du sang et or : rouge sang `#C8102E`, encre `#1b1214`,
  règles `#dccfcf` ; en sombre fond `#150b0d`, surfaces `#211416`, règles
  `#3b2629`. Rayon 3 px. Focus : anneau d'or deux pixels (`:focus-visible`).
- **Le sang dit « l'USAP »** (titres, noms de joueurs catalans) ; un adversaire
  ou un arbitre est en encre. **L'or dit « acquis »** : titres, distinctions,
  victoires.
- **Résultats** : V en or, N en encre, D en gris, lettres comme nombres, via
  `lettreResultat()` de `src/lib/matchs.ts`.
- **Écussons** : toute rencontre listée ou affichée porte les deux (`Ecusson`,
  20 px en liste), l'adverse avec la classe `logo-club` (liseré en sombre),
  jamais l'USAP ; pas de case vide sans écusson ; `alt=""`.
- **Portraits** : case vide sans photo dans les listes ; silhouette au trait
  seulement dans les deux XV d'une fiche de match.
- **Bouton** (un seul modèle) : plein sang, texte `primary-foreground`, or vif
  au survol, voix condensée.
- Les skills `.claude/skills/frontend-design` et `avoid-ai-design` ne
  connaissent pas les jetons ci-dessous : relire leur sortie.
- Un écusson, un portrait, une page ne se valident pas au journal d'exécution :
  les regarder rendus, dans les deux thèmes, en mobile (375 px) compris.

## Thème clair/sombre

- **Thème par défaut** : clair (light)
- **Gestion** : `next-themes` avec `attribute="class"` sur `<html>`
- **Stockage préférence** : localStorage (automatique via next-themes)
- **Fallback** : préférence système (prefers-color-scheme)
- **Toggle** : bouton Sun/Moon dans le Header
- **Convention** : toujours utiliser les couleurs sémantiques Tailwind (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `bg-muted`, etc.) plutôt que des couleurs hardcodées
- **USAP brand** : `usap-sang`, `usap-or`, `usap-fond`, `usap-carte` sont définis via CSS variables et s'adaptent au thème
- **Interdit** : `border-white/10`, `bg-white/5`, ou toute couleur hardcodée qui ne s'adapte pas au thème
- **UNE EXCEPTION, ET UNE SEULE : `usap-or-vif`**, ajouté le 10 septembre 2026
  pour le hero de l'accueil. `usap-or` vaut un or **sombre** en thème clair,
  ce qui est juste tant que le fond suit le thème ; sur le bandeau rouge du
  hero, qui est **sang dans les deux thèmes**, il donne 1,8:1 — illisible.
  `usap-or-vif` (`#FFD700`) vaut la même chose des deux côtés et donne 4,2:1,
  au-dessus du seuil AA des grands caractères (3:1), où ce texte se trouve.

  Ce n'est donc pas une couleur en dur déguisée en jeton : c'est un jeton dont
  la valeur ne varie pas **parce que la surface qu'il habille ne varie pas non
  plus**. La règle qui va avec : **ne l'employer que sur du sang**. Une
  surface qui choisit son camp impose son encre ; une surface qui suit le
  thème garde `usap-or`.

