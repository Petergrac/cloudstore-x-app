/*
  Warnings:

  - You are about to drop the column `sharedWithId` on the `SharedFolder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[folderId,sharedById]` on the table `SharedFolder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "SharedFolder" DROP CONSTRAINT "SharedFolder_sharedWithId_fkey";

-- DropIndex
DROP INDEX "SharedFolder_folderId_sharedById_sharedWithId_key";

-- AlterTable
ALTER TABLE "SharedFolder" DROP COLUMN "sharedWithId";

-- CreateIndex
CREATE UNIQUE INDEX "SharedFolder_folderId_sharedById_key" ON "SharedFolder"("folderId", "sharedById");
