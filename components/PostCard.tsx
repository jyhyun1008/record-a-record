import Link from "next/link";
import type { PostWithTags } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { stripBoldMarkers } from "@/lib/richtext";

export default function PostCard({
  post,
  showVisibility = false,
}: {
  post: PostWithTags;
  showVisibility?: boolean;
}) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="flex gap-4 rounded-2xl border border-theme1-light bg-bg p-4 transition hover:border-theme2 hover:bg-theme5"
    >
      {post.albumImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.albumImageUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-lg bg-theme5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-text/85">
            {post.artistName} · {post.trackName}
          </p>
          <p className="shrink-0 text-xs text-text/65">{formatDate(post.createdAt)}</p>
        </div>
        <h2 className="mt-1 truncate text-base font-medium text-text">{post.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-text/90">
          {stripBoldMarkers(post.content)}
        </p>
        {(post.tags.length > 0 || (showVisibility && !post.published)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {showVisibility && !post.published && (
              <span className="rounded-full bg-theme5 px-2 py-0.5 text-[10px] text-text/85">
                비공개
              </span>
            )}
            {post.tags.map((tag) => (
              <span key={tag.id} className="text-xs text-text/75">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
