"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { VideoInfo } from "@/lib/videos";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Video vertical en marco de teléfono con capítulos que saltan al momento exacto. */
export function VideoShowcase({ video, compact = false, autoPreview = false }: { video: VideoInfo; compact?: boolean; autoPreview?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(autoPreview);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setTime(v.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    // Vista previa silenciosa solo cuando el video entra en pantalla (ahorra datos)
    let io: IntersectionObserver | undefined;
    if (autoPreview && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && v.muted) v.play().catch(() => {});
        else if (!e.isIntersecting && v.muted) v.pause();
      }, { threshold: 0.5 });
      io.observe(v);
    }
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); io?.disconnect(); };
  }, [autoPreview]);

  const active = [...video.chapters].reverse().find((c) => time >= c.t - 0.05) ?? video.chapters[0];

  function playWithSound(from?: number) {
    const v = ref.current;
    if (!v) return;
    if (from !== undefined) v.currentTime = from;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
  }

  return (
    <div className={compact ? "video-showcase compact" : "video-showcase"}>
      <div className="video-frame">
        <video
          ref={ref}
          poster={video.poster}
          playsInline
          muted={muted}
          loop={muted}
          preload="metadata"
          controls={playing && !muted}
          aria-label={video.title}
          onClick={() => (muted ? playWithSound(0) : undefined)}
        >
          <source src={video.src} type="video/mp4" />
          <source src={video.webm} type="video/webm" />
        </video>
        {(!playing || muted) && (
          <button className="video-play" onClick={() => playWithSound(muted ? 0 : undefined)} aria-label={`Ver ${video.title} con sonido`}>
            <span className="video-play-icon"><svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
            <span className="video-play-label">{muted && playing ? "Ver con sonido" : `Ver video · ${video.duration}`}</span>
          </button>
        )}
      </div>
      {!compact && (
        <div className="stack video-side" style={{ "--gap": "14px" } as React.CSSProperties}>
          <div className="stack" style={{ "--gap": "6px" } as React.CSSProperties}>
            <h3>{video.title}</h3>
            <p className="muted small">{video.subtitle}</p>
          </div>
          <ol className="chapters">
            {video.chapters.map((c, i) => (
              <li key={c.t}>
                <button className="chapter" aria-current={active === c && playing ? "step" : undefined} onClick={() => playWithSound(c.t)}>
                  <span className="chapter-num">{i + 1}</span>
                  <span className="stack" style={{ "--gap": "2px", textAlign: "left" } as React.CSSProperties}>
                    <strong>{c.title} <span className="tiny muted">{fmt(c.t)}</span></strong>
                    <span className="small muted">{c.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="tiny muted row" style={{ "--gap": "6px" } as React.CSSProperties}><Icon name="sparkle" size={14} /> Toca un paso para ir directo a ese momento.</p>
        </div>
      )}
    </div>
  );
}
