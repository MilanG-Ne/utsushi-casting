"use client";

import { useEffect } from "react";

type Cleanup = () => void;

/**
 * Homepage-only motion. This component is imported by the home view alone, and GSAP is
 * fetched with a dynamic import during idle time, so other routes never download it.
 *
 * - Skipped entirely when the visitor prefers reduced motion (and reverted if that
 *   preference switches on while the page is open).
 * - Never animates the hero heading (the LCP element) and never hides content that is
 *   already on screen: reveals apply only to elements below the fold, and only transform
 *   and opacity change, so there is no layout shift.
 * - The role marquee loops continuously, so it gets a visible pause button (WCAG 2.2.2).
 */
export function HomeMotion() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    let cleanup: Cleanup | undefined;
    let cancelled = false;

    const start = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || media.matches) return;
      gsap.registerPlugin(ScrollTrigger);

      const toggle = document.querySelector<HTMLButtonElement>("[data-marquee-toggle]");
      let marquee: gsap.core.Tween | undefined;

      const ctx = gsap.context(() => {
        const track = document.querySelector<HTMLElement>("[data-marquee]");
        if (track) {
          const distance = track.scrollWidth / 2;
          marquee = gsap.to(track, { x: -distance, duration: distance / 40, ease: "none", repeat: -1 });
        }

        const corners = gsap.utils.toArray<HTMLElement>("[data-viewfinder] span");
        if (corners.length) {
          gsap.from(corners, { scale: 1.6, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, delay: 0.2 });
        }

        for (const el of gsap.utils.toArray<HTMLElement>("[data-reveal]")) {
          if (el.getBoundingClientRect().top < window.innerHeight) continue;
          gsap.from(el, {
            y: 36,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        }
      });

      const onToggle = () => {
        if (!marquee || !toggle) return;
        const paused = !marquee.paused();
        marquee.paused(paused);
        toggle.setAttribute("aria-pressed", String(paused));
        toggle.textContent = paused ? toggle.dataset.playLabel ?? "" : toggle.dataset.pauseLabel ?? "";
      };
      if (toggle && marquee) {
        toggle.hidden = false;
        toggle.addEventListener("click", onToggle);
      }

      const onPreferenceChange = () => {
        if (media.matches) cleanup?.();
      };
      media.addEventListener("change", onPreferenceChange);

      cleanup = () => {
        media.removeEventListener("change", onPreferenceChange);
        toggle?.removeEventListener("click", onToggle);
        if (toggle) toggle.hidden = true;
        ctx.revert();
      };
    };

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => void start());

    return () => {
      cancelled = true;
      cancelIdle(handle);
      cleanup?.();
    };
  }, []);

  return null;
}
