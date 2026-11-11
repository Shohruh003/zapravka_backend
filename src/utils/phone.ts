/** Strips a leading "+" and any non-digit characters. e.g. "+998 90 123" -> "99890123" */
export function normalizePhone(phone: string): string {
  return (phone ?? "").toString().replace(/[^\d]/g, "");
}
