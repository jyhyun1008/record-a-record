import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1),
  published: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(15).optional(),

  trackName: z.string().trim().min(1).max(300),
  artistName: z.string().trim().min(1).max(300),
  albumName: z.string().trim().max(300).nullable().optional(),
  albumImageUrl: z.string().url().nullable().optional(),
  spotifyUrl: z.string().url().nullable().optional(),
  spotifyId: z.string().nullable().optional(),
  spotifyAlbumId: z.string().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  releaseDate: z.string().nullable().optional(),

  lyrics: z.string().nullable().optional(),
  lyricsSource: z.enum(["genius", "lrclib", "manual"]).nullable().optional(),
  geniusUrl: z.string().url().nullable().optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;
