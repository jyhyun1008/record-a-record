"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PostWithTags } from "@/lib/types";
import PostModal from "./PostModal";

export default function PostActions({ post }: { post: PostWithTags }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setDeleting(false);
      alert("삭제에 실패했어요.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 text-xs text-text/50">
        <button onClick={() => setEditing(true)} className="hover:text-text">
          수정
        </button>
        <button onClick={handleDelete} disabled={deleting} className="hover:text-red-500">
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </div>
      {editing && (
        <PostModal
          onClose={() => setEditing(false)}
          post={post}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
