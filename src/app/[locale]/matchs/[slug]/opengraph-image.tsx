import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { BLANC, OG_HAUTEUR, OG_LARGEUR, OR_VIF, SANG, imagePublique, policesOg } from "@/lib/og";

/**
 * L'image de partage d'une fiche de match : le tableau d'affichage sur fond
 * sang — les deux écussons, le score énorme en or vif, l'affiche et la
 * journée en blanc, le nom du site en pied. C'est le hero de l'accueil et le
 * tableau de la fiche, en une carte de 1200 × 630.
 *
 * Générée à la demande par Next.js, sur le chemin `opengraph-image` de la
 * fiche, et déclarée d'elle-même dans ses métadonnées. Une rencontre à venir
 * montre « À venir » à la place du score.
 */
export const alt = "USAP Historia";
export const size = { width: OG_LARGEUR, height: OG_HAUTEUR };
export const contentType = "image/png";

/**
 * **En cache un jour par rencontre**, depuis le 20 septembre 2026 — même
 * raison que la carte du site : chaque partage refaisait le dessin et la
 * requête. Le `generateStaticParams` vide est ce qui rend la route cachable,
 * comme sur les fiches ; rien n'est dessiné au build. Une rencontre jouée
 * dans la journée garde « À venir » jusqu'au lendemain de son partage le
 * plus ancien : acceptable, le score est sur la fiche.
 */
export const revalidate = 86400;
export function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Le slug d'une rencontre est unique et sans CUID, comme sur la fiche.
  const match = await prisma.match.findUnique({
        where: { slug },
        select: {
          date: true,
          isHome: true,
          scoreUsap: true,
          scoreOpponent: true,
          matchday: true,
          round: true,
          opponent: { select: { name: true, shortName: true, logoUrl: true } },
          competition: { select: { name: true, shortName: true } },
        },
      });
  const [polices, usap, adverse] = await Promise.all([policesOg(), imagePublique("/images/usap/logo.png"), imagePublique(match?.opponent.logoUrl ?? null)]);

  const nom = match ? match.opponent.shortName || match.opponent.name : "";
  const competition = match ? match.competition.shortName || match.competition.name : "";
  const intitule = match ? `${competition}${match.matchday ? `, ${match.matchday}ᵉ journée` : match.round ? `, ${match.round}` : ""}, le ${formatDateFR(match.date)}` : "";
  const joue = match?.scoreUsap != null && match.scoreOpponent != null;
  const gauche = match?.isHome ? { logo: usap, nom: "USAP", score: match.scoreUsap } : { logo: adverse, nom, score: match?.scoreOpponent };
  const droite = match?.isHome ? { logo: adverse, nom, score: match.scoreOpponent } : { logo: usap, nom: "USAP", score: match?.scoreUsap };

  const ecusson = (src: string | null) =>
    src ? <img src={src} alt="" width={200} height={200} style={{ width: 200, height: 200, objectFit: "contain" }} /> : <div style={{ width: 200, height: 200 }} />;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: SANG, color: BLANC, fontFamily: "Archivo", padding: "56px 72px" }}>
        <div style={{ fontSize: 30, opacity: 0.9 }}>{intitule}</div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 48 }}>
          {ecusson(gauche.logo)}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontFamily: "Archivo Condensed", fontSize: 200, lineHeight: 1, color: OR_VIF, letterSpacing: -4 }}>
              {joue ? `${gauche.score} – ${droite.score}` : "À venir"}
            </div>
            <div style={{ fontFamily: "Archivo Condensed", fontSize: 64, lineHeight: 1, textTransform: "uppercase", marginTop: 8 }}>
              {`${gauche.nom} – ${droite.nom}`}
            </div>
          </div>
          {ecusson(droite.logo)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Archivo Condensed", fontSize: 36, textTransform: "uppercase" }}>
          <span>USAP Historia</span>
          <span style={{ color: OR_VIF }}>usaphistoria.cat</span>
        </div>
      </div>
    ),
    { ...size, fonts: polices },
  );
}
