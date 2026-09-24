import * as cheerio from "cheerio";

export type GeniusMatch = {
  geniusUrl: string;
  title: string;
  artist: string;
  thumbnailUrl: string | null;
};

type GeniusSearchResponse = {
  response?: {
    hits: Array<{
      type: string;
      result: {
        url: string;
        title: string;
        artist_names: string;
        song_art_image_thumbnail_url: string | null;
      };
    }>;
  };
};

// Genius indexes "Genius Romanizations" / "Genius English Translations" / etc.
// as separate reprint pages, and for non-English tracks Genius's search often
// ranks those above the actual original-artist lyrics page. We demote them.
function isReprintAccount(artistNames: string): boolean {
  return /^genius\b/i.test(artistNames.trim());
}

export async function searchSong(artistName: string, trackName: string): Promise<GeniusMatch[]> {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) throw new Error("GENIUS_ACCESS_TOKEN is not set");
  if (!trackName.trim()) return [];

  const url = new URL("https://api.genius.com/search");
  // track-first tends to rank the original-artist page higher than artist-first
  url.searchParams.set("q", `${trackName} ${artistName}`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Genius search failed: ${res.status}`);
  }

  const data = (await res.json()) as GeniusSearchResponse;
  const hits = data.response?.hits ?? [];

  const songs = hits
    .filter((hit) => hit.type === "song")
    .map((hit) => ({
      geniusUrl: hit.result.url,
      title: hit.result.title,
      artist: hit.result.artist_names,
      thumbnailUrl: hit.result.song_art_image_thumbnail_url,
    }));

  const normalizedArtist = artistName.trim().toLowerCase();
  const artistMatched = songs.filter(
    (s) =>
      !isReprintAccount(s.artist) &&
      (s.artist.toLowerCase().includes(normalizedArtist) ||
        normalizedArtist.includes(s.artist.toLowerCase())),
  );
  const otherOriginals = songs.filter(
    (s) => !isReprintAccount(s.artist) && !artistMatched.includes(s),
  );
  const reprints = songs.filter((s) => isReprintAccount(s.artist));

  // best artist match first, then other non-reprint hits, then reprints/translations last
  return [...artistMatched, ...otherOriginals, ...reprints];
}

// Genius has no official lyrics endpoint, so we fetch the public song page
// and parse the lyrics containers out of the HTML. Best-effort: falls back
// to null if the page layout doesn't match, and the caller lets the user
// paste lyrics in manually.
export async function fetchLyrics(geniusUrl: string): Promise<string | null> {
  const res = await fetch(geniusUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; record-a-record/1.0; personal music blog)",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  const containers = $("[data-lyrics-container='true']");
  if (containers.length === 0) return null;

  // Genius marks non-lyrics chrome (contributor credits, translation links)
  // inside the container with this same attribute it uses to exclude that
  // text from its own "copy lyrics" selection.
  containers.find("[data-exclude-from-selection='true']").remove();
  containers.find("br").replaceWith("\n");

  const lines: string[] = [];
  containers.each((_, el) => {
    const text = $(el).text().trim();
    if (text) lines.push(text);
  });

  const lyrics = lines.join("\n\n").trim();
  return lyrics.length > 0 ? lyrics : null;
}
