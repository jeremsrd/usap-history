import { ImageResponse } from "next/og";
import { BLANC, OG_HAUTEUR, OG_LARGEUR, OR_VIF, SANG, imagePublique, policesOg } from "@/lib/og";
import { LANGUES } from "@/i18n/langues";

/**
 * L'image de partage du site, pour toute page qui n'a pas la sienne : le hero
 * de l'accueil en une carte — l'écusson, le nom du site, la promesse en or
 * vif sur le sang. Posée sur le segment de langue, elle vaut pour les deux
 * langues ; Next.js la déclare d'elle-même dans les métadonnées de chaque
 * page, et une fiche qui a sa propre image la remplace.
 */
export const alt = "USAP Historia";
export const size = { width: OG_LARGEUR, height: OG_HAUTEUR };
export const contentType = "image/png";

/**
 * **En cache un jour**, depuis le 20 septembre 2026. Sans `revalidate`, la
 * carte était redessinée — Satori, la police, l'écusson — à chaque fois qu'un
 * robot ou une messagerie la demandait, et ils la demandent sans relâche :
 * c'était le premier consommateur de CPU restant après le cache des pages,
 * pour une image identique d'un jour à l'autre. Une route d'image n'hérite
 * pas du `generateStaticParams` du layout : sans le sien, elle restait
 * dynamique quoi que `revalidate` déclare. Avec les deux langues, elle est
 * dessinée au build, une fois pour toutes.
 */
export const revalidate = 86400;
export function generateStaticParams() {
  return LANGUES.map((locale) => ({ locale }));
}

export default async function Image() {
  const [polices, ecusson] = await Promise.all([policesOg(), imagePublique("/images/usap/logo.png")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: SANG, color: BLANC, fontFamily: "Archivo Condensed", padding: "0 72px", gap: 56 }}>
        {ecusson && <img src={ecusson} alt="" width={280} height={280} style={{ width: 280, height: 280, objectFit: "contain", flexShrink: 0 }} />}
        <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
          <div style={{ fontSize: 112, lineHeight: 1, textTransform: "uppercase" }}>USAP Historia</div>
          <div style={{ fontSize: 42, lineHeight: 1.1, textTransform: "uppercase", color: OR_VIF, marginTop: 20 }}>{"L'histoire de l'USA Perpignan depuis 1902"}</div>
          <div style={{ fontFamily: "Archivo", fontSize: 28, lineHeight: 1.3, marginTop: 24, opacity: 0.9 }}>Chaque rencontre, chaque joueur, chaque saison. usaphistoria.cat</div>
        </div>
      </div>
    ),
    { ...size, fonts: polices },
  );
}
