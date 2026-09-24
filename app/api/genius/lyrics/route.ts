import { NextRequest, NextResponse } from "next/server";
import { fetchLyrics } from "@/lib/genius";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";

  if (!url.startsWith("https://genius.com/")) {
    return NextResponse.json({ error: "Invalid Genius URL" }, { status: 400 });
  }

  try {
    const lyrics = await fetchLyrics(url);
    return NextResponse.json({ lyrics });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch lyrics" },
      { status: 502 },
    );
  }
}
