import { useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { API_ORIGIN } from "@/services/api";

type CoverImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  iconClassName?: string;
  eager?: boolean;
};

export function CoverImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  iconClassName = "text-rosewood/55",
  eager = false,
}: CoverImageProps) {
  const resolvedSrc = useMemo(() => resolveMediaUrl(src), [src]);
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

function resolveMediaUrl(src: string | null | undefined) {
  if (!src) return null;

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return null;

  if (trimmedSrc.startsWith("/media/")) {
    return `${API_ORIGIN}${trimmedSrc}`;
  }

  try {
    const url = new URL(trimmedSrc);
    const isLocalApiUrl = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (isLocalApiUrl && url.pathname.startsWith("/media/") && API_ORIGIN) {
      return `${API_ORIGIN}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return trimmedSrc;
  }

  return trimmedSrc;
}
