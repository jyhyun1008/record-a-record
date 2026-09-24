"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PostModal from "./PostModal";

export default function NewPostButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-theme2 text-2xl font-light text-text shadow-lg shadow-black/10 transition hover:bg-theme3 sm:bottom-8 sm:right-8"
        aria-label="새 기록 작성"
      >
        +
      </button>
      {open && (
        <PostModal
          onClose={() => setOpen(false)}
          onSaved={(post) => {
            setOpen(false);
            router.push(`/post/${post.id}`);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
