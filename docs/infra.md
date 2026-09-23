# Commandes, SEO, cache, administration

## Commandes

```bash
npm run dev                          # serveur de développement (Turbopack)
npx tsc --noEmit                     # vérification des types — src/ SEULEMENT
npm run lint                         # ESLint sur src/ — À PASSER AVANT DE POUSSER
npx tsx scripts/<script>.ts          # exécuter un script d'import
npx tsx scripts/<script>.ts --dry    # simulation, pour les scripts de masse

# Les scripts, que tsconfig.json exclut : à typer explicitement
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext \
  --moduleResolution bundler --esModuleInterop scripts/<script>.ts
```

⚠️ **`tsc` NE SUFFIT PAS AVANT DE POUSSER : VERCEL PASSE ESLINT, ET UNE
ERREUR ESLINT CASSE LE DÉPLOIEMENT.** Le 14 septembre 2026, le commit des
images de partage a été refusé en production pour deux apostrophes en clair
dans du JSX — « L'histoire de l'USA Perpignan » —, que
`react/no-unescaped-entities` tient pour une erreur et que `tsc --noEmit`
ne voit pas. Le site est resté sur le commit précédent le temps de corriger.
Passer `npm run lint` avant chaque poussée, et `npx next build` quand la
séance a touché à autre chose que des pages — un fichier `opengraph-image`,
une route de métadonnées. Une chaîne à apostrophe dans du JSX s'écrit
`{"L'histoire…"}`.

⚠️ **`npm run lint` NE VOIT QUE `src/`, ET C'EST VOULU.** Le script vaut
`eslint src` depuis le 20 septembre 2026 ; il valait `eslint` nu, qui balayait
tout le dépôt et rendait **539 erreurs, toutes dans `scripts/`** pour zéro
dans `src/`. C'est pourtant la commande qu'on tape d'instinct avant de
pousser, et elle alarmait pour rien — **un compteur dont on apprend à ignorer
le total ne garde plus rien**, c'est ainsi que 22 faux hommes ont vécu en
ÉCRITURE jusqu'au 30 août 2026. Elle rend désormais quatre avertissements et
aucune erreur.

**Le changement était dû, et non confortable** : `next lint`, que ce fichier
recommandait, est **déprécié et disparaît avec Next.js 16** — il l'annonce à
chaque exécution. La commande recommandée allait donc cesser d'exister, et
celle qui reste devait d'abord signifier la bonne chose.

**Et `scripts/` n'est plus regardé par personne** : `tsconfig.json` l'exclut,
`npm run lint` ne le voit plus, Vercel ne le construit pas. Ses 539 erreurs
ESLint sont toujours là. Le seul contrôle d'un script reste donc le `tsc`
explicite ci-dessus, à passer sur les fichiers touchés — et il ne dit rien du
lint.

⚠️ **CE PROJET N'A PAS DE FORMATEUR, ET IL NE FAUT PAS EN LANCER UN.** Ni
prettier en dépendance, ni `.prettierrc` : le style du dépôt — lignes longues,
`select` d'une seule traite — est tenu à la main, et il est cohérent. Un
`npx prettier --write` sur une page en réécrit deux cents lignes dans un autre
style, et `npx` l'installe volontiers sans qu'on l'ait demandé. Passé une fois
le 10 septembre 2026 par réflexe, annulé aussitôt.

⚠️ **`prettier --check` MENT SUR UN CHEMIN QUI CONTIENT `[locale]`** : les
crochets y sont lus comme une classe de caractères, aucun fichier ne
correspond, et il annonce « All files formatted correctly » — pour zéro
fichier. C'est ce qui a fait croire un moment que la page était conforme quand
`--write` la réécrivait. La leçon vaut pour **tout** outil qui prend des
motifs : sur ce dépôt, la moitié des chemins portent des crochets, et un
outil qui ne trouve rien annonce le plus souvent que tout va bien.

⚠️ `tsconfig.json` porte `"exclude": ["node_modules", "scripts"]` : un
`npx tsc --noEmit` **ne vérifie aucun script**, et `tsx` ne fait que retirer
les types sans les contrôler. Un script peut donc être exécuté cent fois sans
qu'une erreur de typage se manifeste — deux `possibly null` dormaient ainsi
dans `seed-opponent-sheet.ts`. D'où la seconde commande, à passer sur les
scripts touchés. Deux erreurs préexistantes subsistent dans
`fix-opponent-lineup.ts` (`Bilan` inféré `never`), sans effet à l'exécution.

⚠️ `DATABASE_URL` pointe sur la base Supabase **de production** : un script
lancé écrit directement sur les données du site. Toujours passer par `--dry`
d'abord quand le script modifie de l'existant.

⚠️ **ET ELLE PARTAGE SES QUINZE CONNEXIONS AVEC LE SITE EN PRODUCTION.**
`DATABASE_URL` pointe sur le port **5432** du pooler Supabase — mode session,
`pool_size: 15` —, et c'est le même URL que Vercel utilise. Le 20 septembre
2026, lendemain de Montpellier-USAP, le premier script de la chaîne a rendu
`FATAL: (EMAXCONNSESSION) max clients reached in session mode` sans que rien
ne tourne en local : les fonctions du site, sous le trafic d'après-match,
tenaient les quinze. Le contournement, sans toucher aux fichiers : passer la
commande par le port **6543**, mode transaction, en surchargeant la variable
— `DATABASE_URL="…:6543/postgres?pgbouncer=true" npx tsx scripts/…` —, ce
qui a suffi pour toute la chaîne. **Le remède de fond est le cache des
pages**, posé le lendemain — cf. « Le cache des pages » — : les fonctions
qui tenaient les quinze connexions n'ont plus lieu de s'exécuter à chaque
visite.

**ELLE EST REVENUE LE SOIR MÊME, CACHE EN PLACE, ET LA CAUSE EST VUE.** À
19 h, la première course de la sauvegarde automatique a trouvé le guichet
plein ; `pg_stat_activity` montrait **quatorze connexions oisives**, jusqu'à
neuf minutes sans une requête, toutes tenues par Supavisor pour le compte
des instances Vercel. Le cache a réduit les rendus, pas les instances
restées chaudes : chacune garde sa connexion Prisma ouverte en mode
session, sans s'en servir, et à quinze instances le guichet est plein pour
tout le monde — scripts et sauvegarde compris.

**La correction est dans Vercel, pas dans le code** : passer `DATABASE_URL`
du site sur le mode transaction du même pooler —
`:6543/postgres?pgbouncer=true&connection_limit=1` à la place de
`:5432/postgres`, Settings → Environment Variables, puis redéployer. Le mode
session prête une connexion à une instance pour toute sa vie ; le mode
transaction la rend après chaque requête et en sert des centaines — c'est
celui fait pour des fonctions éphémères, celui que Supabase et Prisma
recommandent l'un et l'autre pour Vercel, et celui par lequel toute la
chaîne de scripts est passée le 20 septembre, feuilles et transactions
comprises. `connection_limit=1` retient Prisma d'en ouvrir plusieurs par
instance. Le mode session, et ses quinze places, reviennent alors
entièrement aux scripts et à `pg_dump`, qui ne sait pas passer par l'autre.
Monter `pool_size` serait reculer le mur, pas le retirer.

**FAIT PAR JÉRÉMY LE 20 SEPTEMBRE 2026 AU SOIR**, et mesuré : quatorze
connexions oisives avant le redéploiement, **trois** après — celles que le
pooler garde pour lui en mode transaction. Le site répond sur les pages
dynamiques et sur un rendu neuf. Le `.env` local, lui, reste sur 5432 : les
scripts et `pg_dump` ont besoin du mode session, et il est désormais à eux.
La variable est passée en « Secret » dans Vercel par la même occasion, elle
était lisible en clair.

**La base est sur le plan Pro de Supabase depuis le 20 septembre 2026**,
pris pour les **sauvegardes quotidiennes** — sept jours de rétention,
restaurables depuis le tableau de bord —, que le plan gratuit ne fait pas.
Il rend aussi `pool_size` réglable et supprime la mise en pause après sept
jours sans activité. La sauvegarde est dans Supabase : la copie locale est
`scripts/sauvegarde-base.sh`, passée une première fois le 20 septembre —
à refaire avant une grosse reprise, c'est une habitude, pas une urgence.

⚠️ **La base est distante, et elle coupe les connexions oisives.** Un script
qui tient une connexion Prisma pendant une longue moisson HTTP la voit tomber
en cours de route : Prisma rend alors `P1017`, « Server has closed the
connection », et tout le travail est perdu. C'est arrivé à
`audit-opponent-lineups.ts` le 1er septembre 2026, après vingt minutes et
sans qu'une seule ligne de résultat ait été écrite — il télécharge 488
feuilles entre ses requêtes.

Il porte depuis `avecReconnexion()`, qui rejoue la requête après une attente
croissante et **annonce la reprise** par une ligne `↻` — une connexion qui
lâche à répétition dit quelque chose du réseau, un script qui s'en remet en
silence le cacherait. Tout script long qui interroge la base entre deux
appels réseau est exposé de la même façon ; le remède est là, à recopier.

**ET IL N'Y A PAS BESOIN D'APPELS RÉSEAU POUR Y AVOIR DROIT.** Ce fichier
disait « entre deux appels réseau », et c'était trop étroit :
`seed-carrieres.ts` ne sort pas de la base, il écrivait seulement **six mille
lignes une par une** — chaque `create` un aller-retour, une bonne demi-heure
d'exécution. Ce qui expose un script, c'est sa **durée**, pas ce qu'il fait
pendant, et le 22 septembre 2026 il a échoué deux fois dans la journée : la
connexion coupée à la 2 344ᵉ ligne, puis l'ordinateur mis en veille pour la
nuit. Deux causes sans rapport, une seule vraie raison — la fenêtre était
ouverte trente-cinq minutes.

**Et l'état laissé derrière est pire que vide** : la table à moitié
reconstruite a l'air normale — les lignes écrites sont justes, aucun
compteur ne manque —, et rien ne dit que les trois mille sept cents
suivantes n'existent pas. Une table vidée se voit ; une table à moitié
remplie se lit comme une table.

**LE REMÈDE N'EST DONC PAS DE MIEUX ENCAISSER LA PANNE, C'EST DE FERMER LA
FENÊTRE.** `avecReconnexion()` a été posé d'abord, et il ne servait à rien
contre une veille : il rejoue une requête, il ne rejoue pas une demi-heure.
L'écriture passe désormais par **`createMany` par lots de mille** — sept
requêtes au lieu de six mille, **1 min 07 au lieu de trente-cinq minutes**,
et la fenêtre disparaît avec le temps d'exécution. Les passages, qui ont
besoin des identifiants que `createMany` ne rend pas, se déduisent d'une
**relecture** des carrières catalanes, dont le compte est confronté à ce que
la boucle avait prévu : un écart lève plutôt que de laisser une table
incomplète passer pour complète.

La règle, pour tout script qui efface avant d'écrire : **il doit réécrire
vite**. Une reconstruction qui dure est une reconstruction qu'on retrouvera
un jour à moitié faite. Et après un script long, **compter ce qu'il devait
écrire** plutôt que lire son code de sortie — celui de la première tentative
valait zéro, le `tail` du pipe ayant avalé le plantage.

⚠️ **LA LNR PLAFONNE LE DÉBIT, et `lirePage` attend entre ses tentatives.**
Elle réessayait trois fois **sans aucune attente** — trois requêtes de plus
dans le même instant, ajoutées à celles qui venaient de déclencher la
limitation, et les trois tentatives épuisées en quelques millisecondes. Une
reprise de 2007-2008 est morte ainsi à la dix-huitième journée, emportant les
dix-sept précédentes. Elle attend désormais 2, 4 puis 8 secondes et annonce
la reprise par une ligne `↻`. Un statut HTTP refusé y compte comme une panne :
c'est sous cette forme que le plafonnement se manifeste.

⚠️ **L'AUDIT COMPLET SE LANCE SAISON PAR SAISON, JAMAIS D'UN BLOC.**

```bash
for S in 2026-2027 2025-2026 2024-2025 2023-2024 2022-2023 2021-2022 \
         2020-2021 2019-2020 2018-2019 2017-2018 2016-2017 2015-2016 \
         2014-2015 2013-2014 2012-2013 2011-2012 2010-2011 2009-2010 \
         2008-2009 2007-2008 2006-2007 2005-2006 2004-2005 \
         1924-1925 1913-1914; do
  npx tsx scripts/audit-opponent-lineups.ts "$S" --usap
done
```

**ET ELLE S'EST OUBLIÉE UNE SECONDE FOIS, LE 23 SEPTEMBRE 2026** : elle
listait vingt-trois saisons quand **vingt-cinq** portent des matchs joués.
Les deux finales d'avant-guerre venues de Gallica — 1913-1914 et 1924-1925,
trente lignes de composition chacune — n'y étaient pas, personne ne les
ayant ajoutées en les écrivant. Leurs rencontres sortent en « hors périmètre
LNR », ce qui est attendu, mais le **contrôle des camps entrelacés** ne
tournait pas sur elles. La liste se compare à la base, elle ne se recopie
pas : `season.findMany({ where: { matches: { some: MATCH_JOUE } } })` la
donne en une requête.

**LA BOUCLE S'OUBLIE, ET ELLE A COÛTÉ QUATRE FAUX HOMMES.** Elle s'arrêtait à
2008-2009 quand 2007-2008 et 2006-2007 étaient entrées en base : ces deux
saisons n'avaient donc **jamais** été auditées, et personne ne s'en apercevait
puisque le total global, lui, ne se lit nulle part. Le premier passage y a
trouvé « Ruan Smith » là où la LNR écrit « Ryan Smith », sur quatre feuilles de
Montauban de 2006 à 2008 (cf. « Limites connues »). **Ajouter la saison à la
boucle fait partie de sa reprise**, au même titre que ses compositions.

`npx tsx scripts/audit-opponent-lineups.ts` sans argument parcourt toutes les
rencontres en une fois, et **la LNR le plafonne** : le 1er septembre 2026,
trois tentatives d'affilée ont rendu 175, 54 puis 268 matchs examinés, pour
323, 444 et 44 feuilles « injoignables ». Le réseau était sain avant et après
chaque exécution — ce n'est pas une panne, c'est une limitation de débit.
Vingt-deux processus courts passent sous le seuil là où un seul long ne passe
plus, et la même journée l'a vérifié deux fois.

La boucle a deux autres mérites : une coupure ne coûte qu'une saison au lieu
de tout, et elle **donne le détail par saison**, que l'exécution globale ne
donne pas. L'état attendu est **0 anomalie sur chaque saison** ; les
26 rencontres de 2026-2027 sont écartées comme à venir, et 22 matchs de coupe
d'Europe sortent du périmètre LNR. Le nombre d'examinés, lui, suit la base et
se périme tout seul — il ne se recopie pas ici.

**Une rencontre dont la base n'a aucune composition adverse est comptée à
part**, et non auditée : la confronter ligne à ligne rendrait vingt et un
« MANQUANT » qui n'annoncent rien. Elles sont dix-sept, et pour de bon — le
Brive-Perpignan du 26 avril 2008 et l'Auch-Perpignan du 30 mai 2008, dont la
LNR corrompt un enregistrement qu'aucune source ne répare, plus les quinze
rencontres de 2005-2006 dont elle publie une composition fabriquée. Sans ce cas à part,
elles portaient quarante-deux anomalies à chaque exécution et le total cessait
d'être un signal, exactement comme les vingt-six rencontres à venir de
2026-2027 avant qu'on ne les écarte.

**Le Stade Français-Perpignan du 13 mai 2007 n'y est pas**, bien qu'il n'ait
pas davantage de composition : la LNR n'en publie aucune non plus, si bien que
la lecture échoue avant la confrontation et qu'il sort en « feuille non lue ».
Les deux états se distinguent — l'un dit que la source manque, l'autre que la
base manque là où la source est lisible.

Trois choses à regarder sur chaque saison, dans cet ordre : `0 avec au moins
une anomalie`, qui est le seul chiffre à porter un signal ; **aucune ligne
`LNR injoignable`**, sans quoi la saison n'a pas été vue en entier quel que
soit le total affiché ; et **aucune ligne `↻`**, qui annoncerait que la base
a lâché et que la suite peut échouer. Si une saison échoue, laisser passer un
moment avant de la relancer : c'est l'enchaînement rapide qui fait tomber les
deux services, pas la charge d'une saison isolée.

⚠️ **`prisma migrate dev` VEUT RÉINITIALISER CETTE BASE. Ne pas le lancer.**
Le dossier `prisma/migrations/` ne décrit pas l'état réel : des colonnes y
manquent — les `slug` de plusieurs tables, des index de `season_coaches` —,
posées en leur temps sans migration. Prisma lit donc une dérive, conclut que
la base doit être reconstruite et propose d'effacer toutes les données. Il
s'arrête avant d'agir, mais il ne faut pas s'en remettre à cela.

**La bonne façon d'ajouter une table** est d'écrire le SQL, de le déposer dans
`prisma/migrations/<horodatage>_<nom>/migration.sql` pour la trace, puis de
l'appliquer seul :

```bash
# le SQL, sans rien appliquer
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
# l'appliquer, et lui seul
npx prisma db execute --file prisma/migrations/<...>/migration.sql \
  --schema prisma/schema.prisma
# le client, en local
npx prisma generate
```

C'est ainsi qu'`opponent_venues` a été créée le 31 août 2026. **Relire le SQL
avant de l'exécuter** : `migrate diff` rend tout l'écart entre le schéma et la
base, dérive comprise, et pas seulement ce qu'on croit ajouter.

## Être trouvé — le SEO technique

**Posé le 14 septembre 2026**, six jours après la mise en ligne du domaine,
sur le constat que `robots.txt` et `sitemap.xml` rendaient 404 et qu'aucune
page n'avait d'image de partage.

- **`src/app/robots.ts`** : tout ouvert sauf `/{fr,ca}/admin`,
  `/{fr,ca}/login`, `/api/` et `/auth/` — la seconde couche sous le `noindex`
  des layouts —, et le sitemap déclaré. Hors du segment `[locale]` : c'est un
  fichier, et le middleware laisse passer tout chemin à extension.
- **`src/app/sitemap.ts`**, lu dans la base : les quinze listes et toutes les
  fiches — rencontres, saisons, adversaires, stades, arbitres, entraîneurs,
  présidents, pages légales — dans les deux langues, chacune portant l'autre
  en `alternates`, le pendant du `hreflang` des pages ; **et les joueurs
  liés au club seulement**, la condition de la liste des joueurs — les trois
  mille cinq cents fiches d'adversaires existent mais ne valent pas d'être
  poussées aux moteurs. Près de trois mille adresses. `lastModified` vient
  d'`updatedAt` là où le modèle le porte — stades, arbitres et présidents ne
  l'ont pas.
- **Les images de partage**, dessinées à la volée par `ImageResponse` de
  `next/og` : `[locale]/opengraph-image.tsx` pour toute page — l'écusson, le
  nom du site, la promesse en or vif sur le sang, le hero en une carte —,
  et `[locale]/matchs/[slug]/opengraph-image.tsx` pour une fiche de match :
  les deux écussons, le score énorme en or vif, l'affiche et la journée, ce
  qu'on colle sur WhatsApp ou X. Next.js les déclare de lui-même dans les
  métadonnées, la fiche remplaçant la carte du site.

  Trois choses apprises en les écrivant, dans `src/lib/og.ts` : **Archivo
  est dans le dépôt**, `src/app/fonts/`, licence OFL — `next/font` ne laisse
  pas ses fichiers sur disque, et aller chercher la police chez Google à
  chaque rendu ferait dépendre chaque carte d'un appel réseau ; **les
  écussons sont donnés en `data:`**, lus dans `public/`, une adresse absolue
  désignant `localhost` en développement ; et **Satori exige `display: flex`
  sur tout nœud à plusieurs enfants** — `{a} – {b}` en JSX fait deux enfants
  texte, il faut une seule chaîne. Les slugs de rencontre n'ont pas de CUID,
  la carte cherche par le slug comme la fiche.

  **ET UN QUATRIÈME, APPRIS EN PRODUCTION** : les deux cartes ont rendu 500
  sur Vercel le jour de leur mise en ligne, quand elles marchaient en local.
  Une fonction Vercel n'embarque que ce que le bundle référence, et un
  `readFile` sur `src/app/fonts/` ou `public/images/` n'est pas une
  référence. `outputFileTracingIncludes` de `next.config.ts` déclare ces
  fichiers route par route, et `.next/server/app/**/opengraph-image/
  route.js.nft.json` dit ce qui est réellement embarqué — c'est là qu'il
  faut regarder, pas au journal du build, qui ne dit rien. **Ce qu'on lit
  sur le disque à l'exécution se vérifie sur le déploiement, pas en local.**

**ET UN DÉPLOIEMENT PEUT TARDER UNE HEURE ET DEMIE SANS QUE RIEN NE LE
DISE**, constaté le 18 septembre 2026 au soir et **soldé le lendemain
matin**. La PR des écussons de la liste des matchs n'a reçu **aucun statut
Vercel** — ni vert ni rouge, `total_count: 0` sur la tête de la branche
comme sur le commit fusionné —, et la production a continué de servir la
version précédente en répondant 200. Puis les deux déploiements sont
partis d'eux-mêmes, sans que rien ne soit relancé : « Deployment has
completed » à 21 h 38 UTC pour la poussée de 20 h 48, à 21 h 51 pour la
fusion de 20 h 23. `1237e2e` est en ligne, vérifié le 19 septembre sur le
site — la liste des matchs sert bien ses écussons, dans les deux langues.

Deux choses à en retenir, et la seconde a coûté une soirée :

- **l'absence de statut se lit « pas encore parti », non « ne partira
  pas ».** Il y a trois états et non deux : le build qui a échoué, qui
  laisse un statut rouge et un journal ; celui qui ne partira pas ; et
  celui qui n'est pas **encore** parti — et les deux derniers ne
  montrent exactement rien. Ils se lisent sur le **commit** et non sur le
  site, par `api.github.com/repos/{dépôt}/commits/{sha}/status`, qui donne
  `total_count`, `state` et `created_at` ; et le troisième ne se distingue
  du deuxième que **par le temps**, c'est-à-dire par la même page relue
  une heure plus tard ;
- **le diagnostic est parti avant l'attente.** Trois causes ont été
  vérifiées sur pièce ce soir-là — l'installation GitHub de Vercel, le
  branchement du projet, la suppression automatique des branches après
  fusion —, toutes trois saines, et pour cause : il n'y avait rien à
  réparer. Devant un déploiement qui ne part pas, **attendre et relire le
  statut du commit** avant de soupçonner la configuration. Une session de
  Claude Code n'a de toute façon aucun accès à Vercel — ni jeton, ni CLI —
  et ne peut que nommer l'état, puis vérifier le site plutôt que le
  journal, comme pour un écusson ou un portrait.

Ce qui reste de la phase 5 : les performances et le PWA.

## Le cache des pages — et ce que coûtait de ne pas en avoir

**Posé le 20 septembre 2026**, sur le constat que le plan Hobby de Vercel
arrivait au bout de ses **quatre heures mensuelles d'Active CPU**, et sur
celui de la veille : le pooler Supabase saturé par le site en production le
lendemain d'un match. Les deux avaient la même cause. **Les vingt-quatre
pages publiques portaient `export const dynamic = "force-dynamic"`** —
rendues depuis zéro, requêtes Prisma comprises, à chaque visite —, pour des
données qui bougent une fois par semaine. La page des joueurs chargeait à
chaque visiteur les treize mille lignes de composition catalanes pour
compter les matchs de chacun.

**Ce qui est en place :**

- **`export const revalidate = 3600`** sur toute page sans `searchParams`,
  listes et fiches — une heure —, et **600** sur l'accueil, pour le joueur au
  hasard et « ce jour dans l'histoire ». Le sitemap aussi. Vercel sert la
  page depuis son cache et ne rend qu'une fois par heure et par adresse.
- **Les fiches exportent un `generateStaticParams` vide**, et c'est
  nécessaire : sans lui, l'App Router rend une route à segment dynamique à la
  demande **sans cache**, quel que soit `revalidate` — le tableau de build la
  marque `ƒ` au lieu de `●`. Avec lui, même vide, la fiche est rendue à sa
  première visite puis servie du cache ; rien n'est pré-rendu au build, et
  c'est voulu : trois mille fiches y interrogeraient la base pour rien.
- **`dynamicParams` du layout `[locale]` est passé de `false` à `true`.** À
  `false`, il redescendait sur les segments `[slug]` et toute fiche demandée
  à l'improviste répondait **404, cache compris** — trouvé en testant, pas en
  lisant. Le layout n'a rien perdu : une langue inconnue tombe sur son
  `notFound()`, et le middleware redirige de toute façon `/es/…` vers
  `/fr/es/…`, qui rend 404.
- **Les quatre pages qui lisent `searchParams`** — `/matchs`, `/joueurs`,
  `/adversaires`, la fiche stade — restent dynamiques quoi qu'on déclare :
  lire `searchParams` rend la page dynamique. Ce sont donc **leurs requêtes**
  qui sont en `unstable_cache`, une heure, comme le pied de page le faisait
  déjà — les repères communs à toute sélection d'un côté, la sélection par
  jeu de filtres de l'autre, les arguments faisant la clé. **Le cache ne
  conserve que du JSON** : une `Date` en revient chaîne ISO sans le dire, une
  `Map` objet vide. Les dates y sont converties explicitement, les bilans
  rendus en `Record`, et `formatDateFR` accepte une chaîne.
- **Les `revalidatePath` de l'admin pointaient sur `/matchs`, `/joueurs`…** —
  les chemins d'avant la langue dans l'adresse, sans effet depuis le
  4 septembre. Sans cache ça ne se voyait pas ; avec, une modification dans
  l'admin serait restée invisible une heure. Ils pointent désormais sur
  `/[locale]/matchs` et `/[locale]/matchs/[slug]` avec `"page"`, qui purgent
  les deux langues.

**Ce que ça change à la marche du lendemain de match** : les scripts écrivent
dans la base, pas dans le cache. **Le dernier temps de la marche est désormais
`purger-cache.ts`** — cf. ci-dessous.

### L'heure était trop courte, et le quota a sauté

**Posé le 20 septembre, dépassé le 23.** `ISR Writes` à 213 000 pour 200 000,
`Fluid Active CPU` à 4 h 22 pour 4 h. Les deux compteurs crèvent ensemble
parce qu'ils mesurent la même chose sous deux angles : chaque régénération est
une écriture **et** du temps de calcul.

La cause n'est pas le cache, c'est son **uniformité**. `revalidate = 3600`
traitait une finale de 1914 comme l'accueil, sur un site dont le contenu est
clos depuis des années. L'arithmétique est sans appel :

```
2 948 pages (1 474 fiches × 2 langues) × 24 h = 70 752 écritures par jour
quota mensuel Vercel Hobby                    =    200 000
```

— le quota du mois en moins de trois jours. Le déclencheur a été le
**sitemap**, posé le 14 septembre : il a ouvert 2 948 adresses aux moteurs,
quand ils n'en connaissaient qu'une poignée.

**Les fiches et les listes sont donc à sept jours**, l'accueil reste à dix
minutes — il tire un joueur au hasard et affiche « ce jour dans l'histoire ».
`src/lib/cache.ts` porte les durées et la démonstration.

**MAIS LA VALEUR DES PAGES NE SUFFISAIT PAS, ET LE CORRECTIF A FAILLI ÊTRE
LIVRÉ INOPÉRANT.** `unstable_cache` a sa propre durée, et **la plus courte
l'emporte** : le pied de page comptait les rencontres dans un cache d'une
heure, et il paraît sur les trente-six pages. Le tableau du build affichait
donc « 1h » quand les fichiers disaient sept jours. Les huit
`unstable_cache` du site sont passés à la même durée. **Relire le tableau du
build après avoir changé un `revalidate`** : c'est lui qui dit la durée
réelle, pas le fichier.

**Et Next.js exige un littéral pour `revalidate`** — il refuse une constante
importée, « Unknown identifier "HISTORIQUE" at "revalidate" », dix-huit fois
au build. Les pages portent donc la valeur en dur avec un commentaire qui
renvoie à `lib/cache.ts`. C'est l'inverse de ce que ce projet fait
d'ordinaire — fournir la fonction plutôt que demander de faire attention — et
ce n'est pas un choix : le cadre l'interdit.

### La purge, et pourquoi elle n'est plus facultative

À sept jours, une fiche saisie le lendemain d'un match resterait périmée une
semaine. `/api/revalidate` et `scripts/purger-cache.ts` existent donc pour ça,
et **la purge est le dernier temps de la marche du lendemain de match**.

- La route purge les 22 routes qu'une saisie peut toucher — la fiche, mais
  aussi les classements, les records, la saison, l'adversaire, le stade,
  l'arbitre et l'accueil —, **dans leur forme de route**, segments
  dynamiques compris, ce qui couvre les deux langues d'un coup.
- **Elle purge aussi le tag `contenu`**, sans quoi la moitié du travail
  resterait faite : les pages qui lisent `searchParams` sont dynamiques, et
  c'est leur `unstable_cache` qui porte la donnée — un cache sans tag survit
  à la purge de la page qui l'emploie.
- **Le secret vit dans `REVALIDATE_SECRET`**, côté Vercel et dans le `.env`
  local, jamais dans le dépôt. Sans lui la route refuse tout : une purge
  ouverte serait un moyen commode de faire recalculer le site entier à
  volonté, c'est-à-dire le gaspillage qu'on vient de corriger. Sans secret
  configuré elle rend 503, avec un mauvais 401, sur un corps invalide 400.

**Oublier la purge est le seul moyen de se tromper avec ce réglage**, et c'est
le plus vicieux : le quota se voit tout de suite, une fiche périmée ne se voit
pas.

**Et les deux images de partage sont en cache un jour**, depuis le même
jour — c'était le premier consommateur de CPU restant : sans `revalidate`,
chaque robot ou messagerie qui demandait une carte la faisait redessiner,
Satori, police et écussons, plus une requête Prisma pour un match. Deux
choses à savoir : **une route d'image n'hérite pas du `generateStaticParams`
du layout** — celle du site a le sien, avec les deux langues, et elle est
dessinée au build ; celle d'un match a un `generateStaticParams` vide, comme
les fiches, et se dessine à la première demande. Une rencontre jouée dans
la journée garde sa carte « À venir » jusqu'au lendemain de son premier
partage, ce qui est accepté : le score est sur la fiche.

**Et les fonctions tournent à Francfort depuis le même jour**, par le
`regions: ["fra1"]` de `vercel.json`. L'en-tête `x-vercel-id` disait `iad1`
— la Virginie, région par défaut de Vercel —, quand la base est sur
`aws-1-eu-central-1` : chaque requête Prisma traversait l'Atlantique. Ça ne
comptait pas dans l'Active CPU, l'attente réseau n'étant pas du calcul, mais
chaque premier rendu d'une fiche le payait. La région est dans le dépôt
plutôt que dans les réglages du projet, pour la même raison que le domaine
est dans `seo.ts` : un fait du site se relit dans le code.

**Vérifié avant de pousser**, et c'est la méthode à reprendre : `next build`
par le port 6543 du pooler, puis `next start` et deux `curl` sur chaque type
de page en lisant `x-nextjs-cache` — `MISS` puis `HIT`, `s-maxage=3600` —,
un slug inconnu pour le 404, `/fr/admin` pour la redirection, et **le rendu
des pages à `unstable_cache`** : ce sont les dates et les bilans qui cassent
en silence, pas le build.

## L'administration, et ce qui la protège

**Trois choses posées le 9 septembre 2026**, le lendemain de la mise en ligne
du domaine, sur une remarque de Jérémy : « le lien d'admin sur le site, c'est
un peu gênant, et `/login` n'est pas optimale ».

**Le lien a disparu de l'en-tête.** Une roue dentée y figurait, en bureau et
en mobile, donc sur chaque page publique. **Ce n'est pas une mesure de
sécurité** — le cacher ne protégerait rien, et l'admin est réellement gardé,
cf. plus bas. C'est que ce lien ne sert qu'à une personne, et qu'il rendait
l'admin et la connexion **découvrables depuis toutes les pages** : les robots
les suivaient. `/admin` y mène toujours.

**LE GARDE DU MIDDLEWARE NE S'ACTIVAIT PLUS, ET RIEN NE LE DISAIT.**
`lib/supabase/middleware.ts` testait `pathname.startsWith("/admin")`, ce qui
était juste jusqu'au 4 septembre 2026 ; depuis que la langue est dans
l'adresse, le chemin réel est `/fr/admin`, et le test valait `false` sur
**toutes** les requêtes.

**Aucune page n'était pour autant ouverte**, et c'est ce qui rend le cas
intéressant : les douze pages d'admin et leurs douze modules d'actions
appellent chacun `auth.getUser()` avant de lire ou d'écrire, et ce sont eux
qui protégeaient. Ce qui avait disparu, c'est la **seconde couche** — celle
qui rattrape une page ajoutée sans son garde. **Une défense en profondeur qui
ne se déclenche jamais ne protège de rien, et son silence est le pire de ses
défauts** : rien ne distingue, en lisant le code, un garde qui veille d'un
garde dont la condition est toujours fausse. Le segment de langue est
désormais lu, et la redirection le porte : elle envoyait vers `/login`, que le
middleware renvoyait ensuite vers `/fr/login`, en deux sauts au lieu d'un.

**Le renommage de `/login` a été écarté, et c'est un arbitrage.** Une adresse
obscure ne protège de rien : les robots essaient des milliers de chemins de
toute façon. Ce qui manquait n'était pas un nom secret mais une directive
`noindex` — la page n'avait ni balise `robots` ni en-tête `X-Robots-Tag`. Deux
layouts minimaux la portent désormais, `admin/layout.tsx` et
`login/layout.tsx`, qui n'existent que pour cela : Next.js ne fusionne cette
métadonnée que depuis un segment de route.

**LA CRÉATION D'ADMINISTRATEUR D'OFFICE EST SUPPRIMÉE**, le même jour, sur
décision de Jérémy. Le tableau de bord inscrivait le demandeur en `ADMIN`
quand la table `users` était vide : c'était **la seule porte du site à
délivrer un droit au lieu de le vérifier**. Le risque n'était pas théorique,
la page de connexion portant un formulaire d'inscription ouvert — une table
vidée par une migration ou une remise à zéro aurait donné l'administration au
premier venu.

Son garde est désormais celui des douze autres pages, **au mot près** :
`if (!dbUser || dbUser.role === "VIEWER") redirect("/")`. Une fiche absente
vaut refus. Plus aucun chemin du code n'écrit dans `users`, vérifié.

**L'amorçage se fait donc à la main, et c'est voulu.** Sans ligne dans
`users`, l'administration est close pour tout le monde, y compris pour
Jérémy. La première s'écrit dans Supabase, l'identifiant étant celui du
compte d'authentification :

```sql
insert into users (id, email, role) values ('<uuid auth>', '<courriel>', 'ADMIN');
```

**LE MODE INSCRIPTION EST RETIRÉ DE LA PAGE DE CONNEXION**, le même jour et
sur la même décision. Elle offrait un « Créer un compte » qui appelait
`supabase.auth.signUp`. Il ne donnait aucun droit — un compte neuf n'a pas de
ligne dans `users` —, mais sur un site dont l'administration compte un seul
homme, c'était une porte sans usage, et elle invitait à en créer. La page se
réduit à deux champs et un bouton.

**ET CE RETRAIT NE FERME PAS L'INSCRIPTION, IL LA CACHE.** La clé publique de
Supabase est dans le navigateur, et `signUp` reste appelable sans passer par
cette page. Ce qui ferme réellement la porte est un réglage du projet
Supabase, « Allow new users to sign up », à décocher dans
Authentication → Sign In / Providers. **Le dire plutôt que de laisser croire
qu'un formulaire retiré suffit** : ce serait la même erreur que renommer
`/login`, écartée le même jour et pour la même raison.
