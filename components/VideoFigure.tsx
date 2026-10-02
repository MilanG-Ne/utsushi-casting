import type { Video } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ResponsiveImage } from "./ResponsiveImage";
import { Txt } from "./Txt";
import { VideoFacade } from "./VideoFacade";

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Figure with a click-to-load player and a visible text description (the text alternative). */
export function VideoFigure({ video, lang, headingId }: { video: Video; lang: Locale; headingId?: string }) {
  const t = getDictionary(lang);
  const duration = formatDuration(video.durationSeconds);
  const posterSrc = video.poster.url.startsWith("/media/img/") ? `${video.poster.url}-1200.webp` : `${video.poster.url}?w=1200&auto=format`;
  return (
    <figure className="video-figure" aria-labelledby={headingId}>
      <div className="video-frame frame">
        <VideoFacade
          src={video.url}
          posterUrl={posterSrc}
          label={`${t.video.play}: ${video.title.text}`}
          playText={t.video.play}
          duration={duration}
          unsupportedText={t.video.unsupported}
        >
          <ResponsiveImage image={{ ...video.poster, alt: "" }} sizes="(min-width: 76rem) 72rem, 100vw" />
        </VideoFacade>
      </div>
      <figcaption className="video-caption">
        <Txt as="strong" value={video.title} />
        <span className="video-meta">
          {t.video.duration} {duration}
          {!video.hasAudio && <> · {t.video.noAudio}</>}
        </span>
        <Txt as="p" value={video.description} />
      </figcaption>
    </figure>
  );
}
