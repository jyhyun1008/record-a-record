"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PostModal, { type TrackSelection } from "./PostModal";

export default function LogTrackButton({ track }: { track: TrackSelection }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-theme1-light px-3 py-1 text-xs text-text/85 transition hover:border-theme2 hover:text-text"
      >
        + 기록하기
      </button>
      {open && (
        <PostModal
          initialTrack={track}
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
