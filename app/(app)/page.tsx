import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";

type Props = { searchParams: Promise<{ tag?: string }> };

export default async function HomePage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const session = await auth();
  const isOwner = Boolean(session);

  const posts = await prisma.post.findMany({
    where: {
      ...(isOwner ? {} : { published: true }),
      ...(tag ? { tags: { some: { name: tag } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-text/50">
          {tag
            ? `#${tag} 태그의 기록이 없어요.`
            : isOwner
              ? "아직 기록이 없어요. 오른쪽 아래 + 버튼으로 첫 곡을 남겨보세요."
              : "아직 공개된 기록이 없어요."}
        </p>
        {tag && (
          <Link href="/" className="mt-3 text-xs text-text/50 underline hover:text-text">
            전체 보기
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {tag && (
        <div className="mb-4 flex items-center gap-2 text-xs text-text/50">
          <span>#{tag} 태그</span>
          <Link href="/" className="underline hover:text-text">
            전체 보기
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} showVisibility={isOwner} />
        ))}
      </div>
    </div>
  );
}
