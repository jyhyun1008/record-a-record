import { NextRequest, NextResponse } from "next/server";
import { searchTracks } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  try {
    const tracks = await searchTracks(q);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Spotify search failed" },
      { status: 502 },
    );
  }
}
