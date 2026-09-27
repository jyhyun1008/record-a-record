import { NextRequest, NextResponse } from "next/server";
import { findLyrics } from "@/lib/lyrics";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist") ?? "";
  const track = req.nextUrl.searchParams.get("track") ?? "";

  if (!track.trim()) {
    return NextResponse.json({ error: "track is required" }, { status: 400 });
  }

  return NextResponse.json(await findLyrics(artist, track));
}
