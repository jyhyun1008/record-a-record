import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAlbum } from "@/lib/spotify";
import { formatDuration } from "@/lib/format";
import LogTrackButton from "@/components/LogTrackButton";

type Params = { params: Promise<{ id: string }> };

export default async function AlbumPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const [album, posts] = await Promise.all([
    getAlbum(id),
    prisma.post.findMany({
      where: {
        spotifyAlbumId: id,
        ...(session ? {} : { published: true }),
      },
      select: { id: true, spotifyId: true, title: true },
    }),
  ]);

  if (!album) notFound();

  const postByTrack = new Map(posts.map((p) => [p.spotifyId, p]));
  const loggedCount = album.tracks.filter((t) => postByTrack.has(t.spotifyId)).length;

  return (
    <div>
      <Link href="/albums" className="text-xs text-text/75 hover:text-text">
        ← 앨범 목록으로
      </Link>

      <div className="mt-4 flex gap-4">
        {album.albumImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={album.albumImageUrl}
            alt=""
            className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-36 sm:w-36"
          />
        ) : (
          <div className="h-28 w-28 shrink-0 rounded-xl bg-theme5 sm:h-36 sm:w-36" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text/90">{album.artistName}</p>
          <h1 className="mt-0.5 text-lg font-semibold text-text sm:text-xl">
            <span className="highlight">{album.albumName}</span>
          </h1>
          <p className="mt-1 text-xs text-text/65">
            {album.releaseDate} · {album.totalTracks}곡
          </p>
          <p className="mt-1 text-xs text-text/75">
            {loggedCount} / {album.totalTracks}곡 기록함
          </p>
          <a
            href={album.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-green-700 hover:text-green-800"
          >
            Spotify에서 듣기 ↗
          </a>
        </div>
      </div>

      <div className="mt-6 divide-y divide-theme1-light border-y border-theme1-light">
        {album.tracks.map((track) => {
          const loggedPost = postByTrack.get(track.spotifyId);
          return (
            <div key={track.spotifyId} className="flex items-center gap-3 py-3">
              <span className="w-5 shrink-0 text-right text-xs text-text/65">
                {track.trackNumber}
              </span>
              {loggedPost ? (
                <Link
                  href={`/post/${loggedPost.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-text hover:underline"
                >
                  {track.trackName}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate text-sm text-text/75">
                  {track.trackName}
                </span>
              )}
              <span className="shrink-0 text-xs text-text/65">
                {formatDuration(track.durationMs)}
              </span>
              {loggedPost ? (
                <span className="shrink-0 rounded-full bg-theme5 px-2 py-0.5 text-[10px] text-text/85">
                  기록됨
                </span>
              ) : session ? (
                <LogTrackButton
                  track={{
                    trackName: track.trackName,
                    artistName: album.artistName,
                    albumName: album.albumName,
                    albumImageUrl: album.albumImageUrl,
                    spotifyUrl: track.spotifyUrl,
                    spotifyId: track.spotifyId,
                    spotifyAlbumId: album.spotifyAlbumId,
                    durationMs: track.durationMs,
                    releaseDate: album.releaseDate,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
