-- AlterTable
ALTER TABLE `actions` ADD COLUMN `deadline` DATETIME(3) NULL,
    ADD COLUMN `feedback_quality_metrics_id` INTEGER NULL,
    ADD COLUMN `initiator_requisites` TEXT NULL,
    ADD COLUMN `problem_description` TEXT NULL;

-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `file_path` VARCHAR(256) NULL;

-- CreateTable
CREATE TABLE `action_to_action_sources` (
    `action_id` INTEGER NOT NULL,
    `feedback_source_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `action_to_action_sources_feedback_source_id_idx`(`feedback_source_id`),
    PRIMARY KEY (`action_id`, `feedback_source_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_feedback_quality_metrics_id_fkey` FOREIGN KEY (`feedback_quality_metrics_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_to_action_sources` ADD CONSTRAINT `action_to_action_sources_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_to_action_sources` ADD CONSTRAINT `action_to_action_sources_feedback_source_id_fkey` FOREIGN KEY (`feedback_source_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
