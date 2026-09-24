import Link from "next/link";
import { auth } from "@/auth";
import { getAlbumGroups } from "@/lib/albums";
import { getAlbum } from "@/lib/spotify";

export default async function AlbumsPage() {
  const session = await auth();
  const groups = await getAlbumGroups(session ? {} : { published: true });

  const albums = await Promise.all(
    groups.map(async (group) => {
      try {
        const album = await getAlbum(group.spotifyAlbumId);
        return { ...group, totalTracks: album?.totalTracks ?? null };
      } catch {
        return { ...group, totalTracks: null };
      }
    }),
  );

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-text/50">
          아직 앨범이 없어요. 곡을 기록하면 여기 앨범별로 모여요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {albums.map((album) => (
        <Link
          key={album.spotifyAlbumId}
          href={`/album/${album.spotifyAlbumId}`}
          className="group rounded-2xl border border-theme1-light p-3 transition hover:border-theme2 hover:bg-theme5"
        >
          {album.albumImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.albumImageUrl}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <div className="aspect-square w-full rounded-lg bg-theme5" />
          )}
          <p className="mt-2 truncate text-sm font-medium text-text">{album.albumName}</p>
          <p className="truncate text-xs text-text/50">{album.artistName}</p>
          <p className="mt-1 text-xs text-text/40">
            {album.totalTracks
              ? `${album.loggedCount} / ${album.totalTracks}곡 기록함`
              : `${album.loggedCount}곡 기록함`}
          </p>
        </Link>
      ))}
    </div>
  );
}
