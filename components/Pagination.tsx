import Link from "next/link";

export default function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(target: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const linkClass = "rounded-full border border-theme1-light px-3 py-1 text-xs text-text/85 hover:border-theme2 hover:text-text";

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-xs text-text/75">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          ← 이전
        </Link>
      ) : (
        <span className="w-[4.5rem]" />
      )}
      <span>
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass}>
          다음 →
        </Link>
      ) : (
        <span className="w-[4.5rem]" />
      )}
    </nav>
  );
}
