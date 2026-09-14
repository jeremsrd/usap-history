import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les cartes de partage lisent la police et les écussons sur le disque
  // (`src/lib/og.ts`) : Vercel n'embarque dans une fonction que ce que le
  // bundle référence, et les deux cartes ont rendu 500 en production le
  // 14 septembre 2026, le jour de leur mise en ligne. Ces fichiers sont
  // déclarés ici, route par route, et `.next/server/app/**/*.nft.json` dit
  // s'ils sont bien embarqués.
  outputFileTracingIncludes: {
    "/[locale]/opengraph-image": ["./src/app/fonts/**", "./public/images/usap/**"],
    "/[locale]/matchs/[slug]/opengraph-image": ["./src/app/fonts/**", "./public/images/usap/**", "./public/images/logos/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "opudjybplevgczcfkhal.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
