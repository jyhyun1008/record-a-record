"use client";

import { useEffect, useRef, useState } from "react";
import type { PostWithTags } from "@/lib/types";
import { formatDuration } from "@/lib/format";

type SpotifyTrack = {
  spotifyId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  spotifyUrl: string;
  spotifyAlbumId: string;
  durationMs: number;
  releaseDate: string | null;
};

export type TrackSelection = {
  trackName: string;
  artistName: string;
  albumName: string | null;
  albumImageUrl: string | null;
  spotifyUrl: string | null;
  spotifyId: string | null;
  spotifyAlbumId: string | null;
  durationMs: number | null;
  releaseDate: string | null;
};

type Props = {
  onClose: () => void;
  onSaved: (post: PostWithTags) => void;
  post?: PostWithTags | null;
  // pre-select a track and skip search, e.g. "log this track" from an album's tracklist
  initialTrack?: TrackSelection | null;
};

// Mounted only while the modal is open (see NewPostButton / PostActions),
// so useState initializers can hydrate straight from `post` with no reset effect.
export default function PostModal({ onClose, onSaved, post, initialTrack }: Props) {
  const isEdit = Boolean(post);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [track, setTrack] = useState<TrackSelection | null>(() =>
    post
      ? {
          trackName: post.trackName,
          artistName: post.artistName,
          albumName: post.albumName,
          albumImageUrl: post.albumImageUrl,
          spotifyUrl: post.spotifyUrl,
          spotifyId: post.spotifyId,
          spotifyAlbumId: post.spotifyAlbumId,
          durationMs: post.durationMs,
          releaseDate: post.releaseDate,
        }
      : (initialTrack ?? null),
  );

  const [title, setTitle] = useState(post?.title ?? initialTrack?.trackName ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.published ?? false);

  const [tags, setTags] = useState<string[]>(() => post?.tags.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState("");

  const [lyrics, setLyrics] = useState(post?.lyrics ?? "");
  const [lyricsSource, setLyricsSource] = useState<"genius" | "manual" | null>(
    (post?.lyricsSource as "genius" | "manual" | null) ?? null,
  );
  const [geniusUrl, setGeniusUrl] = useState<string | null>(post?.geniusUrl ?? null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(Boolean(post?.lyrics));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (initialTrack) contentRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) setResults([]);
  }

  useEffect(() => {
    if (!query.trim()) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.tracks ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  async function selectTrack(t: SpotifyTrack) {
    setTrack(t);
    setResults([]);
    setQuery("");
    if (!title.trim()) setTitle(t.trackName);
    setTimeout(() => contentRef.current?.focus(), 50);

    // fire-and-forget lyrics auto-fetch
    setLyricsLoading(true);
    setLyricsOpen(true);
    try {
      const searchRes = await fetch(
        `/api/genius/search?artist=${encodeURIComponent(t.artistName)}&track=${encodeURIComponent(t.trackName)}`,
      );
      const searchData = await searchRes.json();
      const match = searchData.matches?.[0];
      if (!match) {
        setLyrics("");
        setLyricsSource(null);
        setGeniusUrl(null);
        return;
      }
      const lyricsRes = await fetch(`/api/genius/lyrics?url=${encodeURIComponent(match.geniusUrl)}`);
      const lyricsData = await lyricsRes.json();
      if (lyricsData.lyrics) {
        setLyrics(lyricsData.lyrics);
        setLyricsSource("genius");
        setGeniusUrl(match.geniusUrl);
      } else {
        setLyrics("");
        setLyricsSource(null);
        setGeniusUrl(match.geniusUrl);
      }
    } catch {
      setLyrics("");
      setLyricsSource(null);
    } finally {
      setLyricsLoading(false);
    }
  }

  function clearTrack() {
    setTrack(null);
  }

  function commitTagInput() {
    const name = tagInput.trim();
    setTagInput("");
    if (!name) return;
    setTags((prev) => (prev.some((t) => t.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTagInput();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
  }

  async function handleSubmit() {
    if (!track || !title.trim() || !content.trim()) {
      setError("곡, 제목, 내용을 모두 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      published,
      tags: [...tags, ...(tagInput.trim() ? [tagInput.trim()] : [])],
      trackName: track.trackName,
      artistName: track.artistName,
      albumName: track.albumName,
      albumImageUrl: track.albumImageUrl,
      spotifyUrl: track.spotifyUrl,
      spotifyId: track.spotifyId,
      spotifyAlbumId: track.spotifyAlbumId,
      durationMs: track.durationMs,
      releaseDate: track.releaseDate,
      lyrics: lyrics.trim() || null,
      lyricsSource: lyrics.trim() ? (lyricsSource ?? "manual") : null,
      geniusUrl,
    };

    try {
      const res = await fetch(isEdit ? `/api/posts/${post!.id}` : "/api/posts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했어요.");
      }
      const data = await res.json();
      onSaved(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-theme1-light bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-theme1-light px-5 py-4">
          <h2 className="text-sm font-medium text-text">
            {isEdit ? "기록 수정" : "새 기록"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-text/50 transition hover:bg-theme5 hover:text-text"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {!track ? (
            <div>
              <input
                autoFocus
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="곡 제목이나 아티스트를 검색하세요"
                className="w-full rounded-xl border border-theme1-light bg-theme5 px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-theme2 focus:outline-none"
              />
              <div className="mt-3 space-y-1">
                {searching && (
                  <p className="px-1 text-xs text-text/50">검색 중...</p>
                )}
                {results.map((t) => (
                  <button
                    key={t.spotifyId}
                    onClick={() => selectTrack(t)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-theme5"
                  >
                    {t.albumImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.albumImageUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-md bg-theme5" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{t.trackName}</p>
                      <p className="truncate text-xs text-text/50">
                        {t.artistName} · {t.albumName}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-text/40">
                      {formatDuration(t.durationMs)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-theme1-light bg-theme5 p-3">
                {track.albumImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.albumImageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-white" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {track.trackName}
                  </p>
                  <p className="truncate text-xs text-text/50">
                    {track.artistName}
                    {track.albumName ? ` · ${track.albumName}` : ""}
                  </p>
                  {track.releaseDate && (
                    <p className="mt-0.5 text-xs text-text/40">{track.releaseDate}</p>
                  )}
                </div>
                <button
                  onClick={clearTrack}
                  className="shrink-0 text-xs text-text/50 underline decoration-theme1 underline-offset-2 hover:text-text"
                >
                  다른 곡
                </button>
              </div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="w-full border-b border-theme1-light bg-transparent px-1 py-2 text-lg font-medium text-text placeholder:text-text/40 focus:border-theme2 focus:outline-none"
              />

              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이 곡에 대해 적어보세요... (**이렇게** 감싸면 형광펜 강조가 돼요)"
                rows={6}
                className="w-full resize-none rounded-xl border border-theme1-light bg-theme5 px-4 py-3 text-sm leading-relaxed text-text placeholder:text-text/40 focus:border-theme2 focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-theme1-light bg-theme5 px-3 py-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text/70"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-text/40 hover:text-text"
                      aria-label={`${tag} 태그 삭제`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={commitTagInput}
                  placeholder={tags.length === 0 ? "태그 입력 후 Enter (예: 인디, 새벽감성)" : "태그 추가"}
                  className="min-w-[8rem] flex-1 bg-transparent py-1 text-xs text-text placeholder:text-text/40 focus:outline-none"
                />
              </div>

              <label className="flex items-center justify-between rounded-xl border border-theme1-light px-4 py-3 text-sm text-text">
                <span>
                  다른 사람에게 공개
                  <span className="ml-2 text-xs text-text/50">
                    {published ? "누구나 링크로 볼 수 있어요" : "나만 볼 수 있어요"}
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  onClick={() => setPublished((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    published ? "bg-theme2" : "bg-theme1-light"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      published ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </label>

              <div className="rounded-xl border border-theme1-light">
                <button
                  onClick={() => setLyricsOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-text"
                >
                  <span>
                    가사
                    {lyricsLoading && (
                      <span className="ml-2 text-xs text-text/50">불러오는 중...</span>
                    )}
                    {!lyricsLoading && lyricsSource === "genius" && (
                      <span className="ml-2 text-xs text-green-700">Genius에서 자동으로 불러옴</span>
                    )}
                    {!lyricsLoading && !lyrics && lyricsOpen && (
                      <span className="ml-2 text-xs text-text/50">
                        자동으로 찾지 못했어요, 직접 입력해주세요
                      </span>
                    )}
                  </span>
                  <span className="text-text/40">{lyricsOpen ? "▲" : "▼"}</span>
                </button>
                {lyricsOpen && (
                  <div className="border-t border-theme1-light p-3">
                    <textarea
                      value={lyrics}
                      onChange={(e) => {
                        setLyrics(e.target.value);
                        setLyricsSource("manual");
                      }}
                      placeholder="가사를 직접 입력할 수 있어요"
                      rows={8}
                      className="w-full resize-none rounded-lg border border-theme1-light bg-theme5 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap text-text/70 placeholder:text-text/40 focus:border-theme2 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </div>

        {track && (
          <div className="flex items-center justify-end gap-2 border-t border-theme1-light px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm text-text/60 hover:text-text"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-full bg-theme2 px-5 py-2 text-sm font-medium text-text transition hover:bg-theme3 disabled:opacity-50"
            >
              {saving ? "저장 중..." : isEdit ? "수정 완료" : "게시"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
