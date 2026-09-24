import { auth } from "@/auth";
import Header from "@/components/Header";
import NewPostButton from "@/components/NewPostButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <Header isOwner={Boolean(session)} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      {session && <NewPostButton />}
    </>
  );
}
