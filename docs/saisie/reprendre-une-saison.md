# Reprendre une saison, et le lendemain d'un match

## Reprendre une saison — la marche à suivre

C'est le travail courant du projet, et il est rodé : deux saisons complètes,
2021-2022 et 2020-2021, l'ont été par cette chaîne. **Suivre l'ordre**, chaque
étape supposant la précédente.

### 0. Reconnaître le terrain

```bash
# Quelle division ? Combien de matchs déjà en base ?
npx tsx -e 'import{PrismaClient}from"@prisma/client";const p=new PrismaClient();
p.season.findFirst({where:{label:"AAAA-AAAA"},include:{_count:{select:{matches:true}}}})
.then(s=>{console.log(s);return p.$disconnect()})'
```

Puis repérer la forme de la saison sur le site de la LNR — `top14.lnr.fr` ou
`prod2.lnr.fr` selon la division : combien de journées, quelles phases
finales, y a-t-il une campagne européenne. Les segments d'URL des phases
finales sont `demi-finales`, `finale`, `barrages`, et le barrage d'accession a
changé trois fois de nom (cf. `phasesBarrage`).

### 1. Les rencontres

Écrire un `seed-season-AAAA-AAAA.ts` sur le modèle du plus proche :
`seed-season-2020-2021.ts` pour une saison de Pro D2 sans coupe,
`seed-season-2021-2022.ts` pour une saison de Top 14 avec Challenge européen.
Y placer :

- la liste des phases et le nombre de journées ;
- les clubs que la base ne connaît pas encore, **avec leurs noms relevés sur le
  classement officiel** (`{top14|prod2}.lnr.fr/classement/AAAA-AAAA`), jamais
  de mémoire ;
- le **classement officiel de l'USAP** en garde-fou des agrégats : victoires,
  nuls, défaites, points marqués et encaissés, total. Le script doit refuser
  d'écrire s'il s'en écarte. C'est le contrôle qui valide la saison entière.

```bash
npx tsx scripts/seed-season-AAAA-AAAA.ts --dry   # attendu : 0 en échec
npx tsx scripts/seed-season-AAAA-AAAA.ts         # attendu : ✔ conforme au classement
```

### 2. Compositions, feuilles, chronologies

Pour chaque match, dans cet ordre, en traitant la saison par lots de quatre
journées — un lot rate rarement, et le lot suivant profite des doublons
soldés :

```bash
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ --dry        # 46 lignes — 44 avant 2008-2009
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap --dry
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ --dry
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ
```

Le script de feuille accepte la saison entière d'un coup une fois toutes les
compositions écrites — `npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA
--usap` —, ce qui est bien plus rapide que match par match. Pour une coupe
d'Europe, c'est `seed-cup-sheet.ts --match=AAAA-MM-JJ` à la place.

### Le lendemain d'un match de la saison en cours

La saison en cours est déjà en base, sans score (cf. « Rencontres à
venir ») ; ses compositions y entrent la veille, dès que la LNR les publie.
Le lendemain, dans cet ordre — chaque étape exige la précédente, et
`seed-opponent-sheet` comme `seed-chronologie` refusent une rencontre sans
score :

```bash
npx tsx scripts/set-score.ts --match=AAAA-MM-JJ --dry              # le score du calendrier LNR, les compteurs
npx tsx scripts/set-score.ts --match=AAAA-MM-JJ                    #   des deux camps, et l'arbitre s'il manque
npx tsx scripts/seed-lineup.ts AAAA-MM-JJ --dry                    # sauf si les 46 lignes sont déjà là
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap --dry
npx tsx scripts/seed-opponent-sheet.ts AAAA-AAAA --match=AAAA-MM-JJ --usap
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ --dry
npx tsx scripts/seed-chronologie.ts AAAA-MM-JJ
npx tsx scripts/fix-bonus-points.ts --dry                          # le bonus, une fois les essais connus
npx tsx scripts/fix-bonus-points.ts
npx tsx scripts/set-annexe.ts --match=AAAA-MM-JJ --affluence=N --mi-temps=U-A \
  --source="L'Indépendant du …" --dry                              # ce que la LNR ne donne pas
npx tsx scripts/audit-opponent-lineups.ts AAAA-AAAA                # 0 anomalie attendue
npx tsx scripts/detect-duplicate-players.ts                        # 0 / 0 / 0 attendu
npx tsx scripts/set-video.ts --match=AAAA-MM-JJ --url="…" --dry    # le résumé de « TOP 14 - Officiel »,
npx tsx scripts/set-video.ts --match=AAAA-MM-JJ --url="…"          #   quand la chaîne l'a publié
npx tsx scripts/purger-cache.ts                                    # SANS QUOI RIEN NE PARAÎT AVANT
```                                                                #   sept jours — cf. « Le cache des pages »

**`set-score.ts` écrit aussi les compteurs de réalisations** — `triesUsap`,
`conversionsUsap` et les leurs, des deux camps —, lus sur les faits de la
feuille comme le font les scripts de saison, et seulement quand ils
retombent sur le score du camp ; sinon `null`, et il le dit. Il ne les
écrivait pas jusqu'au 6 septembre 2026, et rien dans la chaîne ne le faisait
à sa place : la première journée 2026-2027 a été écrite avec ses compteurs à
`null`, ce qui laissait `fix-bonus-points.ts` sans essais pour décider du
bonus offensif, et la fiche de match sans détail du score. Découvert en
refaisant la fiche, pas par un contrôle — un `null` sur ces compteurs se lit
« la source ne le dit pas » et ne fait échouer personne.

**Et il pose l'arbitre depuis le 14 septembre 2026**, lu sur la page de
composition de la feuille, si la rencontre n'en a pas — celui que Jérémy a
donné avant le match reste. Rien ne le faisait : la deuxième journée
2026-2027 s'est retrouvée feuille et chronologie écrites, sans arbitre,
quand la LNR nommait Vincent Blasco-Baqué. **Un trou de la chaîne ne se
voit qu'en la déroulant jusqu'au bout et en relisant la fiche** ; le
premier passage, sur la J1, avait eu son arbitre par `set-arbitre.ts` et
n'avait rien montré.

**LA PAGE DE COMPOSITION DE LA LNR PEUT PORTER L'ÉQUIPE ANNONCÉE, NON
L'ÉQUIPE ALIGNÉE**, et c'est la J2 de 2026-2027 qui l'a montré : elle met
Bruce Devaux au n°1 catalan, et sa page de faits fait entrer Enzo Forletta
à la 72ᵉ — un homme absent de ses vingt-trois. *L'Indépendant* du lendemain
et allrugby donnent tous deux Forletta titulaire, « Forletta
(Boyer-Gallardo, 72) », et concordent avec la LNR sur les vingt-deux autres
dossards : Devaux a été remplacé avant le coup d'envoi, la page n'a pas
suivi, et le changement a glissé d'un cran comme à Pau le 22 février.
`seed-opponent-sheet --usap` a échoué sur le changement non apparié — c'est
le garde-fou qui a tout révélé —, et le cas se règle en trois pièces :
`fix-titulaire-2026-09-12.ts` rend le dossard à Forletta avec son
attestation `CONCORDANT` ; `CHANGEMENTS_CORRIGES` porte la 72ᵉ redressée ;
et **la fiche de match lit désormais les attestations posées sur ses lignes
de composition**, `Provenance` les nommant par le dossard et l'homme — sans
quoi l'arbitrage était en base et invisible. Cette rencontre rejoint celle
du 22 février 2026 parmi celles qu'il ne faut pas passer à
`fix-opponent-lineup.ts --usap --identites`, qui rendrait le n°1 à Devaux.

**Et une fiche fusionnée sous son nom d'usage se refabriquait à chaque
feuille.** « Thomas STANIFORTH » sur la feuille de Castres, « Tom
Staniforth » en base depuis la fusion du 30 août : `seed-lineup` allait
créer le doublon, l'audit l'aurait tenu pour conforme — c'est le nom que la
feuille écrit —, et seul `detect-duplicate-players.ts` l'aurait sorti après
coup. La table `VARIANTES_DAFFICHAGE`, qui apparie ces noms **complets deux
à deux**, ne vivait que dans l'audit, qui constate ; elle vit désormais dans
`lib/noms.ts`, et `chercherJoueur` la consulte juste après le nom exact —
sans que le rapprochement des mots, `memeMot`, n'ait bougé d'une ligne.

**La presse complète, elle ne remplace pas.** *L'Indépendant* du lendemain
donne l'affluence et la mi-temps, que la LNR n'a pas ; `set-annexe.ts` les
écrit avec leur attestation, et **confronte la mi-temps à la chronologie**
avant de l'accepter — en sachant que la LNR additionne les arrêts de jeu à
la minute du fait, l'essai de Ward à « 40+2 » selon le journal étant à 42'
chez elle. Quand le journal et la feuille divergent sur un buteur — le
6 septembre 2026, deux pénalités à Garbisi selon l'un, une selon l'autre,
pour le même total —, **la feuille fait foi** et l'écart va dans une
attestation `realisations`, noté, pas tranché.

### 3. Les contrôles, et ils ne sont pas facultatifs

```bash
npx tsx scripts/fix-bonus-points.ts --dry    # 0 correction attendue
```

Et surtout, **la confrontation nom à nom de chaque composition écrite avec la
feuille officielle**. C'est ce contrôle, et lui seul, qui a rattrapé les deux
identités fausses de 2021-2022 : les sommes de minutes et de points
retombaient parfaitement dans les deux cas, puisque c'est le bon dossard qui
portait les bonnes actions. Comparer, pour chaque dossard, le nom de la base
au nom de la feuille, et regarder de près tout écart où le **nom de famille**
diffère.

### Ce qui casse, et quoi en faire

| Message | Cause | Geste |
|---|---|---|
| `N fiches candidates … à arbitrer` | doublon en base — deux fiches également couvertes par le nom officiel | inspecter les deux fiches, puis `merge-players.ts --keep= --drop= --dry` |
| `[inconnu] … ne désigne aucune des fiches proches` | homonymes partiels, aucun n'est le bon | rien à faire : la fiche est créée, c'est un homme de plus |
| `[homonyme] … laissé de côté` | deux personnes, même patronyme | vérifier la fiche citée ; si ce sont bien deux hommes, laisser créer |
| `Compositions non publiées par la LNR` | archive muette | essayer `prod2.lnr.fr`, qui archive mieux ; en dernier recours, composition à la main recoupée avec les changements (cf. `seed-lineup-barrage-2022.ts`) |
| `N joueurs sur la feuille, N au moins` | la LNR oublie un remplaçant | accepté tel quel si les quinze titulaires sont là. **L'effectif attendu dépend de l'époque** — cf. `effectifDeFeuille()` |
| `réalisations incohérentes` | score courant fautif | lire les faits du match ; le total final fait foi |
| `N point(s) inexpliqué(s)` | transformation non inscrite | le script la rattrape sur les deux camps ; s'il échoue encore, la feuille est fautive |
| `… hors composition` sur un auteur | essai collectif, ou composition fausse | soupçonner la base avant la source |
| `… hors composition` sur un **carton** | la LNR sanctionne un homme qu'elle n'aligne pas | irrattachable : après démonstration, l'inscrire dans `CARTONS_HORS_COMPOSITION` de `seed-opponent-sheet.ts`, qui l'ignore et écrit le reste |
| `feuille LNR introuvable` | mauvais segment de phase | `phasesLnr()` ; vérifier le nom du segment sur le calendrier |
| minutes ≠ 1 200 | carton, ou retour non enregistré | un jaune abaisse le total de dix minutes au plus ; en championnat, un rouge de `80 − minute` ; **en coupe d'Europe, de 20 minutes au plus** (cf. ci-dessus) ; sinon signaler, ne pas inventer |
| points des joueurs < score | essai de pénalité ou essai collectif | légitime, ces essais n'ont pas d'auteur |

### Quatre pièges qui coûtent du temps

1. **`npx tsc --noEmit` ne vérifie aucun script** : `tsconfig.json` exclut
   `scripts/`, et `tsx` retire les types sans les contrôler. La commande à
   passer est dans « Commandes ».
2. **Ne pas filtrer la sortie d'un lot au point de masquer un échec.** Une
   journée de 2021-2022 est passée pour réussie parce que le filtre ne
   retenait pas son message d'erreur ; elle avait écrit une demi-composition.
3. **Lire une liste de changements en entier avant d'en conclure quoi que ce
   soit.** Une correction a été posée sur la foi d'une liste tronquée, et elle
   aggravait l'écart qu'elle prétendait réparer.
4. **Le poste de référence d'une fiche sert de repli** pour toutes ses lignes
   de remplaçant : un poste faux se propage silencieusement.
