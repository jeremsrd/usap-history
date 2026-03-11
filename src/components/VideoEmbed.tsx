/**
 * Composant d'intégration vidéo pour les résumés de matchs.
 * Supporte YouTube et Dailymotion.
 * Extrait automatiquement l'ID de la vidéo depuis l'URL fournie.
 * Utilise le format iframe avec chargement différé pour la performance.
 */

interface VideoEmbedProps {
  url: string;
  title?: string;
}

type VideoProvider = "youtube" | "dailymotion";

function detectProvider(url: string): { provider: VideoProvider; videoId: string } | null {
  // YouTube :
  // - https://www.youtube.com/watch?v=XXXXX
  // - https://youtu.be/XXXXX
  // - https://www.youtube.com/embed/XXXXX
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { provider: "youtube", videoId: ytMatch[1] };

  // Dailymotion :
  // - https://www.dailymotion.com/video/XXXXX
  // - https://dai.ly/XXXXX
  // - https://www.dailymotion.com/embed/video/XXXXX
  const dmMatch = url.match(
    /(?:dailymotion\.com\/video\/|dai\.ly\/|dailymotion\.com\/embed\/video\/)([a-zA-Z0-9]+)/
  );
  if (dmMatch) return { provider: "dailymotion", videoId: dmMatch[1] };

  return null;
}

function getEmbedUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      return `https://www.youtube.com/embed/${videoId}`;
    case "dailymotion":
      return `https://www.dailymotion.com/embed/video/${videoId}`;
  }
}

export default function VideoEmbed({ url, title = "Résumé du match" }: VideoEmbedProps) {
  const result = detectProvider(url);

  if (!result) return null;

  const embedUrl = getEmbedUrl(result.provider, result.videoId);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
