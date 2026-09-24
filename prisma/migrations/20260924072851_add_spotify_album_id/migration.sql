-- AlterTable
ALTER TABLE "Post" ADD COLUMN "spotifyAlbumId" TEXT;

-- CreateIndex
CREATE INDEX "Post_spotifyAlbumId_idx" ON "Post"("spotifyAlbumId");
