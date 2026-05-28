-- DropForeignKey
ALTER TABLE `feedback_to_feedback_sources` DROP FOREIGN KEY `feedback_to_feedback_sources_fts_function_detail_id_fkey`;

-- AddForeignKey
ALTER TABLE `feedback_to_feedback_sources` ADD CONSTRAINT `feedback_to_feedback_sources_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
