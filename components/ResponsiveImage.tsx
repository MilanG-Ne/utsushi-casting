import { preload } from "react-dom";
import type { Image } from "@/lib/content";

const LOCAL_PREFIX = "/media/img/";
const LOCAL_WIDTHS = [480, 800, 1200, 1600, 1920];
const CDN_WIDTHS = [480, 800, 1200, 1600, 2000];

type Props = {
  image: Image;
  /** The `sizes` attribute: how wide the image renders at each breakpoint. */
  sizes: string;
  /** Above-the-fold image: eager, high fetch priority, preloaded. */
  priority?: boolean;
  className?: string;
};

function localSrcSet(base: string, maxWidth: number, format: "avif" | "webp") {
  return LOCAL_WIDTHS.filter((w) => w <= maxWidth)
    .map((w) => `${base}-${w}.${format} ${w}w`)
    .join(", ");
}

function cdnUrl(url: string, width: number) {
  return `${url}?w=${width}&q=70&fit=max&auto=format`;
}

/**
 * Server-rendered responsive image with no client JavaScript.
 * Local (generated) images: <picture> with AVIF and WebP variants.
 * Sanity images: <img> with CDN width variants and automatic format negotiation.
 * Width/height and an aspect-ratio box reserve the space (no layout shift); the LQIP is a
 * blurred background until the image arrives.
 */
export function ResponsiveImage({ image, sizes, priority = false, className }: Props) {
  const isLocal = image.url.startsWith(LOCAL_PREFIX);
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : undefined;
  const style = {
    aspectRatio: `${image.width} / ${image.height}`,
    backgroundImage: image.lqip ? `url("${image.lqip}")` : undefined,
  };
  const classes = ["media", className].filter(Boolean).join(" ");

  if (isLocal) {
    const avif = localSrcSet(image.url, image.width, "avif");
    const webp = localSrcSet(image.url, image.width, "webp");
    if (priority) preload(`${image.url}-1200.avif`, { as: "image", imageSrcSet: avif, imageSizes: sizes, type: "image/avif", fetchPriority: "high" });
    return (
      <picture className={classes} style={style}>
        <source type="image/avif" srcSet={avif} sizes={sizes} />
        <source type="image/webp" srcSet={webp} sizes={sizes} />
        <img
          src={`${image.url}-1200.webp`}
          alt={image.alt}
          lang={image.altLang}
          width={image.width}
          height={image.height}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
        />
      </picture>
    );
  }

  const srcSet = CDN_WIDTHS.filter((w) => w <= image.width * 1.1)
    .map((w) => `${cdnUrl(image.url, w)} ${w}w`)
    .join(", ");
  if (priority) preload(cdnUrl(image.url, 1200), { as: "image", imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: "high" });
  return (
    <span className={classes} style={{ ...style, display: "block" }}>
      {/* Intentional: Sanity's CDN already resizes and negotiates formats, so next/image would only add client JS. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cdnUrl(image.url, 1200)}
        srcSet={srcSet}
        sizes={sizes}
        alt={image.alt}
        lang={image.altLang}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </span>
  );
}
