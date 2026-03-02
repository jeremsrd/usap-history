/*
  Warnings:

  - You are about to drop the column `stadium_name` on the `opponents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "opponents" DROP COLUMN "stadium_name",
ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "venue_id" TEXT,
ADD COLUMN     "website_url" TEXT;

-- AddForeignKey
ALTER TABLE "opponents" ADD CONSTRAINT "opponents_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;
