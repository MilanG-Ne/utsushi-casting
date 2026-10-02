/** Studio list subtitle that shows whether the Japanese copy is complete. */
export function translationSubtitle(fields: Record<string, unknown>): string {
  const missing = Object.entries(fields)
    .filter(([, value]) => typeof value !== "string" || value.trim() === "")
    .map(([key]) => key);
  return missing.length === 0 ? "EN ✓ · JA ✓" : `EN ✓ · JA missing: ${missing.join(", ")}`;
}
