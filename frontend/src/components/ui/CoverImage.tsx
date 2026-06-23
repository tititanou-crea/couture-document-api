import { useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { API_ORIGIN } from "@/services/api";

type CoverImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
  eager?: boolean;
  thumbnailWidth?: number;
};

export function CoverImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  iconClassName = "text-rosewood/55",
  eager = false,
  thumbnailWidth,
}: CoverImageProps) {
  const resolvedSrc = useMemo(() => resolveMediaUrl(src, thumbnailWidth), [src, thumbnailWidth]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || failed) {
    return <ImageOff className={iconClassName} size={44} aria-hidden />;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}

function resolveMediaUrl(src: string | null | undefined, thumbnailWidth?: number) {
  if (!src) return null;

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return null;

  if (trimmedSrc.startsWith("/media/")) {
    return withThumbnailWidth(`${API_ORIGIN}${trimmedSrc}`, thumbnailWidth);
  }

  try {
    const url = new URL(trimmedSrc);
    const isLocalApiUrl = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (isLocalApiUrl && url.pathname.startsWith("/media/") && API_ORIGIN) {
      return withThumbnailWidth(`${API_ORIGIN}${url.pathname}${url.search}${url.hash}`, thumbnailWidth);
    }
    if (API_ORIGIN && url.origin === API_ORIGIN && url.pathname.startsWith("/media/")) {
      return withThumbnailWidth(url.toString(), thumbnailWidth);
    }
  } catch {
    return trimmedSrc;
  }

  return trimmedSrc;
}

function withThumbnailWidth(src: string, thumbnailWidth?: number) {
  if (!thumbnailWidth) return src;

  try {
    if (src.startsWith("/")) {
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}w=${encodeURIComponent(String(thumbnailWidth))}`;
    }

    const url = new URL(src);
    url.searchParams.set("w", String(thumbnailWidth));
    return url.toString();
  } catch {
    return src;
  }
}
