import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function ArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="arrow" {...base} {...props}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function Chevron(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="chevron" {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Globe(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function Play(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable={false} {...props}>
      <path d="M8 5.5v13a.8.8 0 0 0 1.2.7l10.4-6.5a.8.8 0 0 0 0-1.4L9.2 4.8A.8.8 0 0 0 8 5.5Z" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Brand mark: viewfinder frame lines around a single point of light. */
export function BrandMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className="brand-mark" aria-hidden focusable={false} {...props}>
      <path
        d="M3 10V3h7M22 3h7v7M29 22v7h-7M10 29H3v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
      <circle cx="16" cy="16" r="4.2" fill="currentColor" />
    </svg>
  );
}
