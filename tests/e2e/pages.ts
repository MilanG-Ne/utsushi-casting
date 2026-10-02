export const EN_PAGES = [
  "/",
  "/work",
  "/work/harbour-lights",
  "/work/the-lantern-keeper",
  "/services/film-and-television",
  "/services/commercials",
  "/services/voice-and-localization",
  "/contact",
] as const;

export const toJa = (path: string) => (path === "/" ? "/ja" : `/ja${path}`);
export const ALL_PAGES = EN_PAGES.flatMap((p) => [p, toJa(p)]);
export const OUTAGE_ORIGIN = "http://localhost:3101";
