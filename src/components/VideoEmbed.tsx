/**
 * Composant d'intégration vidéo pour les résumés de matchs.
 * Supporte YouTube et Dailymotion.
 * Utilise un click-to-play : affiche une miniature + bouton play,
 * puis charge l'iframe uniquement quand l'utilisateur clique.
 */

"use client";

import { useState } from "react";

interface VideoEmbedProps {
  url: string;
  title?: string;
}

type VideoProvider = "youtube" | "dailymotion";

function detectProvider(url: string): { provider: VideoProvider; videoId: string } | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { provider: "youtube", videoId: ytMatch[1] };

  const dmMatch = url.match(
    /(?:dailymotion\.com\/video\/|dai\.ly\/|dailymotion\.com\/embed\/video\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch) return { provider: "dailymotion", videoId: dmMatch[1] };

  return null;
}

function getEmbedUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    case "dailymotion":
      return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&queue-autoplay-next=false`;
  }
}

function getThumbnailUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    case "dailymotion":
      return `https://www.dailymotion.com/thumbnail/video/${videoId}`;
  }
}

export default function VideoEmbed({ url, title = "Résumé du match" }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const result = detectProvider(url);

  if (!result) return null;

  const { provider, videoId } = result;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
      style={{ paddingBottom: "56.25%" }}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={getEmbedUrl(provider, videoId)}
          title={title}
          allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center"
          aria-label={`Lire la vidéo : ${title}`}
        >
          {/* Miniature */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getThumbnailUrl(provider, videoId)}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/30 transition-colors hover:bg-black/10" />
          {/* Bouton play */}
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-usap-sang/90 shadow-lg transition-transform hover:scale-110">
            <svg
              className="ml-1 h-8 w-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
