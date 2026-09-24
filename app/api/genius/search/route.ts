import { NextRequest, NextResponse } from "next/server";
import { searchSong } from "@/lib/genius";

export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get("artist") ?? "";
  const track = req.nextUrl.searchParams.get("track") ?? "";

  try {
    const matches = await searchSong(artist, track);
    return NextResponse.json({ matches });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Genius search failed" },
      { status: 502 },
    );
  }
}
