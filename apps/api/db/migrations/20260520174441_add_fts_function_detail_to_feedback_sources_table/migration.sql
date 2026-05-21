/*
  Warnings:

  - You are about to drop the column `feedback_source_id` on the `fts_function_details` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `fts_function_details` DROP FOREIGN KEY `fts_function_details_feedback_source_id_fkey`;

-- DropIndex
DROP INDEX `fts_function_details_feedback_source_id_idx` ON `fts_function_details`;

-- AlterTable
ALTER TABLE `fts_function_details` DROP COLUMN `feedback_source_id`;

-- CreateTable
CREATE TABLE `fts_function_detail_to_feedback_sources` (
    `fts_function_detail_id` INTEGER NOT NULL,
    `feedback_source_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_detail_to_feedback_sources_feedback_source_id_idx`(`feedback_source_id`),
    PRIMARY KEY (`fts_function_detail_id`, `feedback_source_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` ADD CONSTRAINT `fts_function_detail_to_feedback_sources_fts_function_detail_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` ADD CONSTRAINT `fts_function_detail_to_feedback_sources_feedback_source_id_fkey` FOREIGN KEY (`feedback_source_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
