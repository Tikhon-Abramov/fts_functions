-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `feedback_quality_metrics_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_feedback_quality_metrics_id_fkey` FOREIGN KEY (`feedback_quality_metrics_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
