import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-text">
          <span className="highlight">record a record</span>
        </h1>
        <p className="mt-2 text-sm text-text/85">개인 음악 아카이브</p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full bg-theme2 px-6 py-3 text-sm font-medium text-text transition hover:bg-theme3"
          >
            GitHub로 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
