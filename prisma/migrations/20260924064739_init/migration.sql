-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
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

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
