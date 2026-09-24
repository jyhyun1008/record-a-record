// De-dupes case-insensitively while keeping the first-seen casing, then
// builds a Prisma connectOrCreate list so writing a post never fails on
// tags that don't exist yet.
export function normalizeTags(tags: string[] | undefined) {
  if (!tags) return undefined;

  const seen = new Map<string, string>();
  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  }

  return [...seen.values()].map((name) => ({
    where: { name },
    create: { name },
  }));
}
