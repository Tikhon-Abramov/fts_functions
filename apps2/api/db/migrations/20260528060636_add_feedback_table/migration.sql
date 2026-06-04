SET FOREIGN_KEY_CHECKS = 0;

-- CreateTable
CREATE TABLE `feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_function_detail_id` INTEGER NOT NULL,
    `feedback_quality_metrics_id` INTEGER NULL,
    `problem_description` TEXT NULL,
    `initiator_requisites` TEXT NULL,
    `fts_methodology_status_id` INTEGER NULL,
    `deadline` DATETIME(3) NULL,
    `initiator_acceptance` TEXT NULL,
    `is_accepted` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_to_feedback_sources` (
    `feedback_id` INTEGER NOT NULL,
    `feedback_source_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_to_feedback_sources_feedback_source_id_idx`(`feedback_source_id`),
    PRIMARY KEY (`feedback_id`, `feedback_source_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTempTable
CREATE TABLE `fts_function_detail_agreement_history_temp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `feedback_id` INTEGER NOT NULL,
    `from_status` VARCHAR(32) NULL,
    `to_status` VARCHAR(32) NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_fts_function_detail_id_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_fts_methodology_status_id_fkey` FOREIGN KEY (`fts_methodology_status_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_feedback_quality_metrics_id_fkey` FOREIGN KEY (`feedback_quality_metrics_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_to_feedback_sources` ADD CONSTRAINT `feedback_to_feedback_sources_fts_function_detail_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_to_feedback_sources` ADD CONSTRAINT `feedback_to_feedback_sources_feedback_source_id_fkey` FOREIGN KEY (`feedback_source_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_detail_agreement_history_temp` ADD CONSTRAINT `fts_function_detail_agreement_history_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



INSERT INTO `feedback` (
    `fts_function_detail_id`,
    `feedback_quality_metrics_id`,
    `problem_description`,
    `initiator_requisites`,
    `fts_methodology_status_id`,
    `deadline`,
    `initiator_acceptance`,
    `is_accepted`
)
SELECT 
    `id`,
    `feedback_quality_metrics_id`,
    `problem_description`,
    `initiator_requisites`,
    `fts_methodology_status_id`,
    `deadline`,
    `initiator_acceptance`,
    `is_accepted`
FROM `fts_function_details`
WHERE 
    `feedback_quality_metrics_id` IS NOT NULL
    OR
    `problem_description` IS NOT NULL
    OR
    `initiator_requisites` IS NOT NULL
    OR
    `fts_methodology_status_id` IS NOT NULL
    OR
    `deadline` IS NOT NULL
    OR
    `initiator_acceptance` IS NOT NULL
    OR
    `is_accepted` IS NOT NULL;


INSERT INTO `feedback_to_feedback_sources` (
    `feedback_id`,
    `feedback_source_id`,
    `created_at`
)
SELECT
    `f`.`id`,
    `ds`.`feedback_source_id`,
    `ds`.`created_at`
FROM `fts_function_detail_to_feedback_sources` `ds`
LEFT JOIN `fts_function_details` `d` ON `ds`.`fts_function_detail_id` = `d`.`id`
LEFT JOIN `feedback` `f` ON `f`.`fts_function_detail_id` = `d`.`id`;


INSERT INTO `fts_function_detail_agreement_history_temp` (
    `feedback_id`,
    `from_status`,
    `to_status`,
    `comment`,
    `created_at`
)
SELECT 
    `f`.`id`,
    `h`.`from_status`,
    `h`.`to_status`,
    `h`.`comment`,
    `h`.`created_at`
FROM `fts_function_detail_agreement_history` `h`
LEFT JOIN `fts_function_details` `d` ON `h`.`fts_function_detail_id` = `d`.`id`
LEFT JOIN `feedback` `f` ON `f`.`fts_function_detail_id` = `d`.`id`;

-- DropForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` DROP FOREIGN KEY `fts_function_detail_to_feedback_sources_feedback_source_id_fkey`;

-- DropForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` DROP FOREIGN KEY `fts_function_detail_to_feedback_sources_fts_function_detail_fkey`;

-- DropForeignKey
ALTER TABLE `fts_function_details` DROP FOREIGN KEY `fts_function_details_feedback_quality_metrics_id_fkey`;

-- DropForeignKey
ALTER TABLE `fts_function_details` DROP FOREIGN KEY `fts_function_details_fts_methodology_status_id_fkey`;

-- DropIndex
DROP INDEX `fts_function_details_deadline_idx` ON `fts_function_details`;

-- DropIndex
DROP INDEX `fts_function_details_feedback_quality_metrics_id_fkey` ON `fts_function_details`;

-- DropIndex
DROP INDEX `fts_function_details_fts_methodology_status_id_idx` ON `fts_function_details`;

-- DropIndex
DROP INDEX `fts_function_details_is_accepted_idx` ON `fts_function_details`;

-- AlterTable
ALTER TABLE `fts_function_details` DROP COLUMN `deadline`,
    DROP COLUMN `feedback_quality_metrics_id`,
    DROP COLUMN `fts_methodology_status_id`,
    DROP COLUMN `initiator_acceptance`,
    DROP COLUMN `initiator_requisites`,
    DROP COLUMN `is_accepted`,
    DROP COLUMN `methodology_position`,
    DROP COLUMN `problem_description`,
    DROP COLUMN `reject_comment`;

-- DropTable
DROP TABLE `fts_function_detail_to_feedback_sources`;

-- DropTable
DROP TABLE `fts_function_detail_agreement_history`;

-- RenameTable
ALTER TABLE `fts_function_detail_agreement_history_temp` RENAME TO `fts_function_detail_agreement_history`;

SET FOREIGN_KEY_CHECKS = 1;