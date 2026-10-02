"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  src: string;
  posterUrl: string;
  /** Accessible name for the play button, e.g. "Play video: Harbour Lights casting reel". */
  label: string;
  /** Visible label inside the button. */
  playText: string;
  duration: string;
  unsupportedText: string;
  /** Server-rendered poster image (a <picture>), passed in so it costs no client JS. */
  children: ReactNode;
};

/**
 * Click-to-load video. Until the visitor presses play there is no <video> element and no
 * video bytes are requested. After the click the player replaces the poster in the same
 * aspect-ratio box (no layout shift) and receives focus so keyboard users can control it.
 */
export function VideoFacade({ src, posterUrl, label, playText, duration, unsupportedText, children }: Props) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!playing || !videoRef.current) return;
    const video = videoRef.current;
    video.focus();
    video.play().catch(() => {
      /* Playback can be refused (for example by data-saver settings); controls remain available. */
    });
  }, [playing]);

  if (playing) {
    return (
      <video ref={videoRef} className="video-player" src={src} poster={posterUrl} controls playsInline preload="auto">
        {unsupportedText}
      </video>
    );
  }

  return (
    <button type="button" className="video-facade" aria-label={label} onClick={() => setPlaying(true)}>
      {children}
      <span className="video-facade__overlay" aria-hidden="true">
        <span className="video-facade__play">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" fill="currentColor" />
          </svg>
        </span>
        <span className="video-facade__label">
          {playText}
          <span className="video-facade__duration">{duration}</span>
        </span>
      </span>
    </button>
  );
}
