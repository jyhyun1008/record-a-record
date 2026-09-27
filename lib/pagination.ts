export function parsePage(raw: string | undefined, totalPages: number): number {
  const page = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, Math.max(totalPages, 1));
}
