/**
 * Composant d'intégration YouTube pour les résumés de matchs.
 * Accepte une URL YouTube complète et en extrait l'ID pour l'embed.
 * Utilise le format lite (iframe) avec chargement différé pour la performance.
 */

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

function extractVideoId(url: string): string | null {
  // Formats supportés :
  // - https://www.youtube.com/watch?v=XXXXX
  // - https://youtu.be/XXXXX
  // - https://www.youtube.com/embed/XXXXX
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeEmbed({ url, title = "Résumé du match" }: YouTubeEmbedProps) {
  const videoId = extractVideoId(url);

  if (!videoId) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
