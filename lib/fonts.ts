import localFont from "next/font/local";

/**
 * Fraunces (SIL OFL 1.1), Latin subset, variable weight axis only (~36 KB).
 * `display: optional` means the font is used only if it arrives within the short block
 * period, so text never re-flows after first paint (CLS stays at 0). Japanese text falls
 * through to the system Mincho/Gothic stacks defined in globals.css.
 */
export const fraunces = localFont({
  src: "../app/fonts/fraunces-latin-wght.woff2",
  weight: "300 700",
  style: "normal",
  display: "optional",
  variable: "--font-fraunces",
  preload: true,
  adjustFontFallback: "Times New Roman",
});
