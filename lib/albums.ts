import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export type AlbumGroup = {
  spotifyAlbumId: string;
  albumName: string;
  artistName: string;
  albumImageUrl: string | null;
  loggedCount: number;
  latestPostId: string;
};

// Groups posts by album in JS: with a personal archive's scale this is
// simpler and cheaper than a SQL group-by that still needs a representative
// row's album art/name per group.
export async function getAlbumGroups(where: Prisma.PostWhereInput): Promise<AlbumGroup[]> {
  const posts = await prisma.post.findMany({
    where: { ...where, spotifyAlbumId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      spotifyAlbumId: true,
      albumName: true,
      artistName: true,
      albumImageUrl: true,
    },
  });

  const groups = new Map<string, AlbumGroup>();
  for (const post of posts) {
    const key = post.spotifyAlbumId!;
    const existing = groups.get(key);
    if (existing) {
      existing.loggedCount += 1;
    } else {
      groups.set(key, {
        spotifyAlbumId: key,
        albumName: post.albumName ?? "",
        artistName: post.artistName,
        albumImageUrl: post.albumImageUrl,
        loggedCount: 1,
        latestPostId: post.id,
      });
    }
  }

  return [...groups.values()];
}
