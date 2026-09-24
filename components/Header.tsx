import Link from "next/link";
import { signOut } from "@/auth";

export default function Header({ isOwner }: { isOwner: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-theme1-light bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-text">
            <span className="highlight">record a record</span>
          </Link>
          <Link href="/albums" className="text-xs text-text/50 hover:text-text">
            앨범
          </Link>
        </div>
        {isOwner ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="text-xs text-text/50 hover:text-text">
              로그아웃
            </button>
          </form>
        ) : (
          <Link href="/login" className="text-xs text-text/50 hover:text-text">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
