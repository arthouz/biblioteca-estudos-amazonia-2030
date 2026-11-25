import { useState } from "react";
import type { Publication } from "../types";
import { asset } from "../lib/data";

interface Props { pub: Publication; size?: "thumb" | "large"; className?: string; eager?: boolean }

/** Capa real do PDF. Se o arquivo não existir, mostra uma capa tipográfica (sem imagem inventada). */
export function CoverImage({ pub, size = "thumb", className = "", eager }: Props) {
  const [failed, setFailed] = useState(false);
  const c = pub.cover;
  const ratio = c ? `${c.width} / ${c.height}` : "1 / 1.414";
  if (!c || failed) {
    return (
      <div className={`cover cover-fallback ${className}`} style={{ aspectRatio: ratio }} role="img" aria-label={`Capa indisponível: ${pub.title}`}>
        <span className="cover-fallback-num">{pub.number ?? ""}</span>
        <span className="cover-fallback-title">{pub.title}</span>
        <span className="cover-fallback-note">Capa não disponível</span>
      </div>
    );
  }
  return (
    <img
      className={`cover ${className}`}
      src={asset(size === "thumb" ? c.thumb : c.large)}
      width={c.width}
      height={c.height}
      alt={c.alt}
      style={{ aspectRatio: ratio }}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
