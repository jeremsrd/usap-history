/**
 * Rapprochement de l'effectif publié par la LNR avec les fiches de la base.
 *
 * LA RÈGLE EST PLUS STRICTE QU'AILLEURS, ET C'EST VOULU. `noms.ts` est
 * calibré pour les 23 joueurs d'une feuille de match ; sur les milliers de
 * fiches de la base, sa règle du « un mot commun assez long » apparierait
 * deux inconnus qui partagent un prénom. Il faut donc ici un mot du **nom de
 * famille** en commun, **et** un mot du prénom en plus. Un nom de famille qui
 * s'apparie sans que le prénom suive n'est pas retenu — c'est le cas des
 * diminutifs, « Jonny » pour Jonathan Gray — : il part au relevé pour
 * arbitrage, et sa résolution s'inscrit à la main dans `LIENS_VERIFIES`.
 *
 * CE MODULE EXISTE PARCE QUE DEUX SCRIPTS EN ONT BESOIN. `sync-effectif.ts`
 * s'en sert pour lever `isActive`, `fetch-player-photos.ts` pour savoir à
 * quelle fiche coller un portrait. La règle était écrite dans le premier ;
 * l'y laisser aurait été la recopier dans le second, et le projet sait ce que
 * coûte une règle écrite en plusieurs endroits — `phasesLnr()` l'a payé de
 * trois copies divergentes.
 */
import type { LnrEffectifJoueur } from "./lnr";
import { memeMot, motsUtiles, normalize } from "./noms";

/**
 * Rapprochements tranchés à la main, de l'identifiant LNR vers le nom exact
 * porté en base. À n'employer que pour les cas que la règle laisse en doute —
 * y inscrire une ligne, c'est affirmer que ces deux écritures désignent le
 * même homme.
 */
export const LIENS_VERIFIES: Record<number, string> = {};

/** Fiche de la base, réduite à ce que l'appariement regarde. */
export interface FicheNommee {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Un mot du nom de famille en commun, **particules exclues**.
 *
 * Sans cette exclusion, « Jacobus VAN TONDER » désignait aussi bien Jacobus
 * Van Tonder que Martinus Jacobus Van Der Heever — deux hommes que seul
 * « Van » rapproche —, et `sync-effectif.ts` refusait d'écrire sur cette
 * ambiguïté. `motsUtiles()` de `noms.ts` porte la liste.
 */
export function memeFamille(a: string, b: string): boolean {
  const cibles = motsUtiles(b);
  return motsUtiles(a).some((mot) => cibles.some((cible) => memeMot(mot, cible)));
}

export interface Appariement<F extends FicheNommee> {
  /** Identifiant de fiche → joueur de la LNR. */
  lies: Map<string, LnrEffectifJoueur>;
  /** Aucun nom de famille approchant : la fiche n'existe pas. */
  aCreer: LnrEffectifJoueur[];
  /** Le nom de famille s'apparie, le prénom non : à arbitrer. */
  douteux: { joueur: LnrEffectifJoueur; candidats: F[] }[];
  /** Plusieurs fiches également couvertes : à trancher, jamais à deviner. */
  ambigus: { joueur: LnrEffectifJoueur; candidats: F[] }[];
}

/**
 * Rapproche chaque joueur de l'effectif d'une fiche, sans jamais trancher une
 * ambiguïté de lui-même : `ambigus` et `douteux` reviennent à l'appelant, qui
 * décide s'il échoue ou s'il passe outre.
 */
export function apparierEffectif<F extends FicheNommee>(
  effectif: LnrEffectifJoueur[],
  fiches: F[],
): Appariement<F> {
  const resultat: Appariement<F> = {
    lies: new Map(),
    aCreer: [],
    douteux: [],
    ambigus: [],
  };

  for (const joueur of effectif) {
    const nomVerifie = LIENS_VERIFIES[joueur.id];
    if (nomVerifie) {
      const fiche = fiches.find(
        (f) => normalize(`${f.firstName} ${f.lastName}`) === normalize(nomVerifie),
      );
      if (!fiche) {
        throw new Error(
          `LIENS_VERIFIES[${joueur.id}] désigne « ${nomVerifie} », introuvable en base.`,
        );
      }
      resultat.lies.set(fiche.id, joueur);
      continue;
    }

    const parFamille = fiches.filter((f) => memeFamille(f.lastName, joueur.nom));
    const avecPrenom = parFamille.filter((f) => memeFamille(f.firstName, joueur.prenoms));

    if (avecPrenom.length === 1) resultat.lies.set(avecPrenom[0].id, joueur);
    else if (avecPrenom.length > 1) resultat.ambigus.push({ joueur, candidats: avecPrenom });
    else if (parFamille.length > 0) resultat.douteux.push({ joueur, candidats: parFamille });
    else resultat.aCreer.push(joueur);
  }

  return resultat;
}
