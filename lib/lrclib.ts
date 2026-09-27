type LrclibResult = {
  plainLyrics: string | null;
};

// Free, keyless lyrics API that doesn't block datacenter IPs (unlike scraping genius.com).
export async function fetchLrclibLyrics(artistName: string, trackName: string): Promise<string | null> {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("q", `${trackName} ${artistName.split(",")[0].trim()}`);

  const res = await fetch(url, {
    headers: { "User-Agent": "record-a-record (personal music blog)" },
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`LRCLIB search failed: ${res.status}`);
    return null;
  }

  const results = (await res.json()) as LrclibResult[];
  const hit = results.find((r) => r.plainLyrics?.trim());
  return hit?.plainLyrics?.trim() ?? null;
}
