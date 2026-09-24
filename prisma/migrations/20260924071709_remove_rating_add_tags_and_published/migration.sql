/*
  Warnings:

  - You are about to drop the column `rating` on the `Post` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "trackName" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "albumName" TEXT,
    "albumImageUrl" TEXT,
    "spotifyUrl" TEXT,
    "spotifyId" TEXT,
    "durationMs" INTEGER,
    "releaseDate" TEXT,
    "lyrics" TEXT,
    "lyricsSource" TEXT,
    "geniusUrl" TEXT
);
INSERT INTO "new_Post" ("albumImageUrl", "albumName", "artistName", "content", "createdAt", "durationMs", "geniusUrl", "id", "lyrics", "lyricsSource", "releaseDate", "spotifyId", "spotifyUrl", "title", "trackName", "updatedAt") SELECT "albumImageUrl", "albumName", "artistName", "content", "createdAt", "durationMs", "geniusUrl", "id", "lyrics", "lyricsSource", "releaseDate", "spotifyId", "spotifyUrl", "title", "trackName", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_published_idx" ON "Post"("published");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "_PostToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");
