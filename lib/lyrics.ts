import { fetchLyrics, searchSong } from "@/lib/genius";
import { fetchLrclibLyrics } from "@/lib/lrclib";

export type LyricsResult = {
  lyrics: string | null;
  source: "genius" | "lrclib" | null;
  geniusUrl: string | null;
};

// Genius first (better coverage/formatting), LRCLIB as fallback: genius.com
// often 403s scraping requests coming from server/datacenter IPs.
export async function findLyrics(artistName: string, trackName: string): Promise<LyricsResult> {
  let geniusUrl: string | null = null;

  // set on servers whose IP genius.com blocks, so we don't waste a request per lookup
  if (process.env.SKIP_GENIUS_LYRICS !== "true") {
    try {
      const match = (await searchSong(artistName, trackName))[0];
      if (match) {
        geniusUrl = match.geniusUrl;
        const lyrics = await fetchLyrics(match.geniusUrl);
        if (lyrics) return { lyrics, source: "genius", geniusUrl };
      }
    } catch (err) {
      console.error("Genius lyrics lookup failed:", err);
    }
  }

  try {
    const lyrics = await fetchLrclibLyrics(artistName, trackName);
    if (lyrics) return { lyrics, source: "lrclib", geniusUrl };
  } catch (err) {
    console.error("LRCLIB lyrics lookup failed:", err);
  }

  return { lyrics: null, source: null, geniusUrl };
}
