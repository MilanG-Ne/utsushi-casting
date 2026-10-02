/**
 * Sanity connection settings. The project ID and dataset are public identifiers (they
 * also ship in the Studio bundle); the write token is only read by the seed script and
 * the revalidation secret only by the webhook route.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-09-01";

export const isSanityConfigured = projectId.length > 0;
