import localFont from "next/font/local";

/**
 * Fraunces (SIL OFL 1.1), Latin subset, variable weight axis only (~36 KB).
 * Same face as en.ts, but not preloaded: Japanese pages only use it for Latin words.
 * `display: optional` uses the font only if it arrives within the short block period, so
 * text never re-flows after first paint (CLS stays at 0).
 */
export const fraunces = localFont({
  src: "../../app/fonts/fraunces-latin-wght.woff2",
  weight: "300 700",
  style: "normal",
  display: "optional",
  variable: "--font-fraunces",
  preload: false,
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "unicode-range", value: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD" }],
});
