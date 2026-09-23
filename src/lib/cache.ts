/**
 * Durées de cache des pages, et pourquoi elles ne sont pas toutes égales.
 *
 * ------------------------------------------------------------------------
 * UN SITE D'HISTOIRE N'A PAS BESOIN DE SE RAFRAÎCHIR TOUTES LES HEURES
 *
 * Le cache posé le 20 septembre 2026 mettait `revalidate = 3600` partout, et
 * traitait donc une finale de 1914 comme l'accueil. Or le site porte **2 948
 * pages de détail** — 1 474 fiches en deux langues — et son contenu ne bouge
 * qu'à deux endroits : la saison en cours, et la fiche du match qu'on vient
 * de saisir. Tout le reste est clos depuis des années ou des décennies.
 *
 * L'arithmétique est sans appel. Une revalidation horaire, si les robots
 * passent partout chaque heure :
 *
 *     2 948 pages × 24 h = 70 752 écritures ISR par jour
 *     quota mensuel Vercel Hobby =  200 000
 *
 * — soit le quota du mois épuisé en moins de trois jours. C'est ce qui est
 * arrivé : au 23 septembre 2026, `ISR Writes` était à 213 000 pour 200 000
 * et `Fluid Active CPU` à 4 h 22 pour 4 h. Les deux compteurs crèvent
 * ensemble parce qu'ils mesurent la même chose sous deux angles : chaque
 * régénération est une écriture **et** du temps de calcul.
 *
 * Le déclencheur a été le **sitemap**, posé le 14 septembre : il a ouvert
 * 2 948 adresses aux moteurs, quand ils n'en connaissaient qu'une poignée.
 *
 * ------------------------------------------------------------------------
 * CE QUI SUIT DE LA DURÉE LONGUE : IL FAUT UNE PURGE
 *
 * À sept jours, une fiche saisie le lendemain d'un match resterait périmée
 * une semaine — ce qui serait pire que le gaspillage. C'est pourquoi
 * `HISTORIQUE` s'accompagne de `/api/revalidate` et de
 * `scripts/purger-cache.ts`, que la marche du « lendemain d'un match »
 * appelle en dernier. CLAUDE.md l'avait anticipé : « il n'y a pas de purge à
 * la demande — si elle devient nécessaire, ce sera une route qui appelle
 * `revalidatePath` ». Elle l'est devenue.
 *
 * **Allonger sans purger serait une faute**, et c'est la seule façon de se
 * tromper ici : le quota se verrait tout de suite, une fiche périmée ne se
 * verrait pas.
 *
 * ------------------------------------------------------------------------
 * ET CES CONSTANTES NE SONT PAS CELLES QUE LES PAGES EMPLOIENT
 *
 * **Next.js exige un littéral pour `revalidate`** et refuse une constante
 * importée : « Unknown identifier "HISTORIQUE" at "revalidate" », dix-huit
 * fois, au build. Les pages portent donc la valeur en dur, avec un commentaire
 * qui renvoie ici.
 *
 * C'est l'inverse de ce que ce projet fait d'ordinaire — fournir la fonction
 * plutôt que demander de faire attention, comme `generateVenueSlug` — et ce
 * n'est pas un choix : le cadre l'interdit. Ce fichier garde donc la
 * démonstration, et `scripts/purger-cache.ts` l'importe pour annoncer la
 * durée qu'il compense. Changer une durée demande de toucher les deux
 * endroits, et le commentaire des pages le dit.
 */

/**
 * Ce qui ne change plus : fiches de match, de joueur, de club, de stade,
 * d'arbitre, de staff, saisons closes, et les listes qui les agrègent.
 *
 * Sept jours, et non « jamais » : une page jamais revalidée dépend
 * entièrement de la purge, et une purge oubliée deviendrait invisible pour
 * toujours. Sept jours est un filet — au pire, une correction non purgée
 * finit par paraître.
 */
export const HISTORIQUE = 60 * 60 * 24 * 7;

/**
 * L'accueil seul. Il tire un joueur au hasard et affiche « ce jour dans
 * l'histoire », deux choses qui doivent bouger dans la journée.
 *
 * Dix minutes en deux langues font 288 rendus par jour : c'est le poste le
 * plus cher du site, et il est assumé.
 */
export const ACCUEIL = 600;

/**
 * Le tag des caches de données, purgé par `/api/revalidate`.
 *
 * **`unstable_cache` a sa propre durée, et la plus courte l'emporte.** Le
 * pied de page compte les rencontres et les saisons dans un cache d'une
 * heure, et il paraît sur les trente-six pages : tant qu'il était là,
 * allonger le `revalidate` des pages ne changeait **rien** — Next plafonnait
 * chacune à une heure, et le tableau du build l'affichait « 1h » quand le
 * fichier disait sept jours. Découvert en relisant ce tableau, le
 * 23 septembre 2026 ; sans cela, le correctif du quota aurait été livré
 * inopérant.
 *
 * Ces caches portent donc la même durée que les pages, et ce tag, faute de
 * quoi `revalidatePath` ne les atteindrait pas : un `unstable_cache` sans
 * tag survit à la purge de la page qui l'emploie.
 */
export const TAG_CONTENU = "contenu";
