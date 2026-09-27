import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDuration } from "@/lib/format";
import { renderRichText } from "@/lib/richtext";
import PostActions from "@/components/PostActions";

type Params = { params: Promise<{ id: string }> };

export default async function PostPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const post = await prisma.post.findUnique({ where: { id }, include: { tags: true } });

  if (!post) notFound();
  if (!post.published && !session) notFound();

  return (
    <article>
      <Link href="/" className="text-xs text-text/75 hover:text-text">
        ← 목록으로
      </Link>

      <div className="mt-4 flex gap-4">
        {post.albumImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.albumImageUrl}
            alt=""
            className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-36 sm:w-36"
          />
        ) : (
          <div className="h-28 w-28 shrink-0 rounded-xl bg-theme5 sm:h-36 sm:w-36" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text/90">{post.artistName}</p>
          <h1 className="mt-0.5 text-lg font-semibold text-text sm:text-xl">
            {post.trackName}
          </h1>
          {post.albumName && (
            <p className="mt-0.5 text-xs text-text/75">{post.albumName}</p>
          )}
          <p className="mt-1 text-xs text-text/65">
            {post.releaseDate}
            {post.releaseDate && post.durationMs ? " · " : ""}
            {formatDuration(post.durationMs)}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {post.spotifyUrl && (
              <a
                href={post.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-green-700 hover:text-green-800"
              >
                Spotify에서 듣기 ↗
              </a>
            )}
            {post.spotifyAlbumId && (
              <Link
                href={`/album/${post.spotifyAlbumId}`}
                className="text-xs text-text/75 underline decoration-theme1 underline-offset-2 hover:text-text"
              >
                앨범 전체 보기
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-y border-theme1-light py-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-text/75">{formatDate(post.createdAt)}</p>
          {session && (
            <span className="rounded-full bg-theme5 px-2 py-0.5 text-[10px] text-text/85">
              {post.published ? "공개" : "비공개"}
            </span>
          )}
        </div>
        {session && <PostActions post={post} />}
      </div>

      <h2 className="mt-6 text-xl font-medium text-text">
        <span className="highlight">{post.title}</span>
      </h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text">
        {renderRichText(post.content)}
      </p>

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${encodeURIComponent(tag.name)}`}
              className="rounded-full border border-theme1-light px-2.5 py-1 text-xs text-text/85 hover:border-theme2 hover:text-text"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {post.lyrics && (
        <details className="mt-8 rounded-xl border border-theme1-light p-4">
          <summary className="cursor-pointer text-sm text-text/90">가사 보기</summary>
          <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-text/85">
            {post.lyrics}
          </p>
          {post.geniusUrl && (
            <a
              href={post.geniusUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-text/65 hover:text-text/90"
            >
              Genius에서 보기 ↗
            </a>
          )}
        </details>
      )}
    </article>
  );
}
