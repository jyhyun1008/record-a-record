let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET is not set");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify token: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // refresh a little early
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export type SpotifyTrack = {
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

type SpotifySearchResponse = {
  tracks?: {
    items: Array<{
      id: string;
      name: string;
      duration_ms: number;
      external_urls: { spotify: string };
      artists: Array<{ name: string }>;
      album: {
        id: string;
        name: string;
        release_date: string;
        images: Array<{ url: string }>;
      };
    }>;
  };
};

export async function searchTracks(query: string): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];
  const token = await getAccessToken();

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "8");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  const data = (await res.json()) as SpotifySearchResponse;
  const items = data.tracks?.items ?? [];

  return items.map((item) => ({
    spotifyId: item.id,
    trackName: item.name,
    artistName: item.artists.map((a) => a.name).join(", "),
    albumName: item.album.name,
    albumImageUrl: item.album.images[0]?.url ?? null,
    spotifyUrl: item.external_urls.spotify,
    spotifyAlbumId: item.album.id,
    durationMs: item.duration_ms,
    releaseDate: item.album.release_date ?? null,
  }));
}

export type SpotifyAlbum = {
  spotifyAlbumId: string;
  albumName: string;
  artistName: string;
  albumImageUrl: string | null;
  spotifyUrl: string;
  releaseDate: string | null;
  totalTracks: number;
  tracks: Array<{
    spotifyId: string;
    trackName: string;
    trackNumber: number;
    durationMs: number;
    spotifyUrl: string;
  }>;
};

type SpotifyAlbumResponse = {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: Array<{ url: string }>;
  artists: Array<{ name: string }>;
  external_urls: { spotify: string };
  tracks: {
    items: Array<{
      id: string;
      name: string;
      track_number: number;
      duration_ms: number;
      external_urls: { spotify: string };
    }>;
  };
};

export async function getAlbum(albumId: string): Promise<SpotifyAlbum | null> {
  const token = await getAccessToken();

  const url = new URL(`https://api.spotify.com/v1/albums/${albumId}`);
  url.searchParams.set("limit", "50");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Spotify album lookup failed: ${res.status}`);
  }

  const data = (await res.json()) as SpotifyAlbumResponse;

  return {
    spotifyAlbumId: data.id,
    albumName: data.name,
    artistName: data.artists.map((a) => a.name).join(", "),
    albumImageUrl: data.images[0]?.url ?? null,
    spotifyUrl: data.external_urls.spotify,
    releaseDate: data.release_date ?? null,
    totalTracks: data.total_tracks,
    tracks: data.tracks.items
      .map((t) => ({
        spotifyId: t.id,
        trackName: t.name,
        trackNumber: t.track_number,
        durationMs: t.duration_ms,
        spotifyUrl: t.external_urls.spotify,
      }))
      .sort((a, b) => a.trackNumber - b.trackNumber),
  };
}
