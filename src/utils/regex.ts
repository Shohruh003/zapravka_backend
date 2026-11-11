/** Escapes regex metacharacters so user input is matched literally (prevents ReDoS / regex injection). */
export function escapeRegex(input: unknown): string {
  return String(input ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
