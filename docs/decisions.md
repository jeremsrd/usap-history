# Décisions en vigueur

Une ligne par arbitrage encore valide, le plus souvent tranché par Jérémy. Le
récit qui les a produits est dans l'historique git ; le détail technique, dans
le fichier de `docs/` indiqué.

| Date | Décision | Détail |
|---|---|---|
| 2026-08-30 | Un joueur adverse est une vraie fiche `Player` ; `opponentPlayerName` est abandonné | saisie/identites |
| 2026-08-30 | Doute d'identité → créer une fiche et prévenir : un doublon se fusionne, une identité fausse ne se voit pas | saisie/identites |
| 2026-08-30 | Fusion sous le nom d'usage, sur la fiche la mieux fournie, jamais l'orthographe amputée de la LNR | saisie/identites |
| 2026-09-01 | Écusson d'Auch depuis Wikipédia (club liquidé), JPEG sans transparence accepté | medias |
| 2026-09-02 | Poste de Bradley Amituanai : `PILIER_DROIT`, tranché sans source | saisie/feuille-de-match |
| 2026-09-02 | Les lignes `SeasonPlayer` s'ajoutent et ne se retirent jamais ; `isActive` suit l'effectif du jour | modele-de-donnees |
| 2026-09-02 | Une photo téléversée à la main ne s'écrase qu'avec `--force`, sur décision | medias |
| 2026-09-03 | Sans changements publiés (2005-2006), les minutes restent `null` plutôt que 80 partout | saisie/feuille-de-match |
| 2026-09-03 | Titulaire manquant sur une feuille ancienne : avertissement ; titulaire de trop : échec | saisie/feuille-de-match |
| 2026-09-03 | allrugby.com admis pour les bonus anciens, par sa concordance avec les feuilles lisibles | sources |
| 2026-09-04 | Sélecteur de langue en drapeaux dessinés (tricolore et senyera) | i18n |
| 2026-09-04 | Réalisateurs : une seule page, trois classements par ancres, seuils et non top N | pages |
| 2026-09-04 | 2004-2005 : agrégats de saison non écrits tant que les neuf bonus offensifs sont introuvables | regles-du-jeu |
| 2026-09-05 | Une seule audace visuelle par page, jetons sémantiques seulement, pas de cartes ni d'icônes décoratives | design |
| 2026-09-06 | Un carton jaune retire dix minutes au joueur et à l'attendu de l'équipe — ne pas rouvrir | regles-du-jeu |
| 2026-09-06 | Troisième état : la table `attestations` porte la provenance de tout fait hors feuille officielle | modele-de-donnees |
| 2026-09-06 | Presse ancienne : graphie de Wikipédia avec prénom, graphie du journal en note ; rien sans relecture de l'image | avant-guerre |
| 2026-09-06 | Avant-guerre (1921, 1938, demi-finales) en pause jusqu'au signal de Jérémy | avant-guerre |
| 2026-09-06 | Tanginoa Halaifonua : poste de référence `DEUXIEME_LIGNE` | saisie/identites |
| 2026-09-07 | Catalan standard avec vocabulaire Termcat ; relecture rossellonaise attendue avant de figer | i18n |
| 2026-09-09 | Admin : pas de lien dans l'en-tête, `/login` non renommé mais `noindex`, aucune création d'admin d'office, inscription retirée | infra |
| 2026-09-09 | Domaine écrit dans `src/lib/seo.ts`, jamais lu dans l'environnement | infra |
| 2026-09-10 | Mentions de droits (écussons, portraits) dans le pied de page seulement | pages |
| 2026-09-10 | Aucun formateur de code dans ce dépôt | infra |
| 2026-09-11 | Bouton unique du site public : plein sang, texte blanc, or vif au survol | design |
| 2026-09-11 | Joueur au hasard tiré parmi ceux qui ont joué, case vide sans portrait | pages |
| 2026-09-14 | Accueil : le serment l'ouvre, le palmarès en est retiré ; le chapeau dit le projet, une note dit l'avancement | pages |
| 2026-09-14 | Pas de bandeau cookies : aucun cookie sur les pages publiques (à revoir si une mesure d'audience entre) | infra |
| 2026-09-18 | Toute page publique porte `Signalement` (lien `mailto:` + adresse en clair) | pages |
| 2026-09-19 | Toute page qui liste ou affiche une rencontre porte les deux écussons (`Ecusson`) | design |
| 2026-09-19 | Résultats : V en or, N en encre, D en gris, partout (`lettreResultat()`) | design |
| 2026-09-20 | Nom de stade = nom courant, rétroactif, faute de dates de renommage sourcées | modele-de-donnees |
| 2026-09-20 | Supabase en plan Pro ; `DATABASE_URL` de Vercel en mode transaction (6543), `.env` local en session (5432) | infra |
| 2026-09-20 | `npm run lint` = `eslint src` ; `scripts/` n'est vérifié que par le `tsc` explicite | infra |
| 2026-09-21 | Photo d'équipe par saison, crédit du photographe obligatoire | pages |
| 2026-09-22 | Petits portraits admis par la table nominative `PORTRAITS_PETITS`, pas par un seuil abaissé | medias |
| 2026-09-23 | Pages en cache sept jours (accueil dix minutes) ; `purger-cache.ts` obligatoire après saisie | infra |
| 2026-09-23 | Vercel en plan Pro, budget plafonné à 20 $ | infra |
| 2026-09-23 | Le camp catalan est audité (`audit-opponent-lineups.ts --usap`), avec le contrôle des camps entrelacés | scripts |
| 2026-09-23 | Documentation : CLAUDE.md court, détail dans `docs/`, journal dans `docs/journal/` | — |
