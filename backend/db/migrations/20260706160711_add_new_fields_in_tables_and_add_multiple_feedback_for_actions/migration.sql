-- AlterTable
ALTER TABLE `feedback` 
    ADD COLUMN `action_id` INTEGER NULL,
    MODIFY `fts_function_detail_id` INTEGER NULL,
    MODIFY `accept_status_id` INTEGER NULL;


-- Migrate data
INSERT INTO `feedback`
(
    `creator_id`,
    `updater_id`,
    `deleter_id`,
    `action_id`,
    `feedback_quality_metrics_id`,
    `fts_methodology_status_id`,
    `problem_description`,
    `initiator_requisites`,
    `initiator_acceptance`,
    `deadline`,
    `is_deleted`,
    `created_at`,
    `updated_at`,
    `deleted_at`
)
SELECT 
    `a`.`creator_id`,
    `a`.`updater_id`,
    `a`.`deleter_id`,
    `a`.`id`,
    `a`.`feedback_quality_metrics_id`,
    `a`.`fts_methodology_status_id`,
    `a`.`problem_description`,
    `a`.`initiator_requisites`,
    `a`.`initiator_acceptance`,
    `a`.`deadline`,
    `a`.`is_deleted`,
    `a`.`created_at`,
    `a`.`updated_at`,
    `a`.`deleted_at`
FROM `actions` `a`
WHERE 
    `a`.`feedback_quality_metrics_id` IS NOT NULL
    OR
    `a`.`fts_methodology_status_id` IS NOT NULL
    OR
    `a`.`problem_description` IS NOT NULL
    OR
    `a`.`initiator_requisites` IS NOT NULL
    OR
    `a`.`initiator_acceptance` IS NOT NULL
    OR
    `a`.`deadline` IS NOT NULL
    OR 
    EXISTS (SELECT 1 FROM `entity_to_types` `e` WHERE `e`.`action_id` = `a`.`id`);

-- Migrate data
INSERT INTO `entity_to_types`
(`feedback_id`, `type_id`, `created_at`)
SELECT
    `f`.`id`,
    `e`.`type_id`,
    `e`.`created_at`
FROM `entity_to_types` `e`
JOIN `feedback` `f` ON `f`.`action_id` = `e`.`action_id`
WHERE `e`.`action_id` IS NOT NULL;

DELETE FROM `entity_to_types` WHERE `action_id` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `actions` DROP FOREIGN KEY `actions_feedback_quality_metrics_id_fkey`;

-- DropForeignKey
ALTER TABLE `actions` DROP FOREIGN KEY `actions_fts_methodology_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `entity_to_types` DROP FOREIGN KEY `entity_to_types_action_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedback` DROP FOREIGN KEY `feedback_accept_status_id_fkey`;

-- DropIndex
DROP INDEX `actions_feedback_quality_metrics_id_fkey` ON `actions`;

-- DropIndex
DROP INDEX `actions_fts_methodology_status_id_fkey` ON `actions`;

-- DropIndex
DROP INDEX `entity_to_types_action_id_idx` ON `entity_to_types`;

-- DropIndex
DROP INDEX `entity_to_types_type_id_action_id_key` ON `entity_to_types`;

-- DropIndex
DROP INDEX `feedback_accept_status_id_fkey` ON `feedback`;

-- AlterTable
ALTER TABLE `actions` 
    DROP COLUMN `deadline`,
    DROP COLUMN `feedback_quality_metrics_id`,
    DROP COLUMN `fts_methodology_status_id`,
    DROP COLUMN `initiator_acceptance`,
    DROP COLUMN `initiator_requisites`,
    DROP COLUMN `problem_description`,
    ADD COLUMN `character_action_id` INTEGER NULL,
    ADD COLUMN `person_performing_action_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `entity_to_types` DROP COLUMN `action_id`;

-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `person_performing_action_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `types` MODIFY `category` ENUM('token_status', 'token_rotation_event', 'ACTION_HISTORY_TYPE', 'FTS_CENTRALIZATION', 'FTS_FUNCTION_NAME', 'FTS_FUNCTION_STEP', 'FTS_FUNCTION_CATEGORY', 'FTS_FUNCTION_MARKER', 'FTS_FUNCTION_COMPLEXITY', 'FTS_FUNCTION_EXECUTION_FREQUENCY', 'WHO_PERFORMS_ACTION', 'FTS_FUNCTION_ACTION_TYPE', 'FTS_FUNCTION_EFFECTIVENESS', 'FTS_COMPETENCY_CENTER', 'FTS_DTI', 'FTS_FUNCTION_RELATION_TYPE', 'TECHNOLOGICAL_SOLUTION', 'FEEDBACK_SOURCE', 'FEEDBACK_QUALITY_METRICS', 'FEEDBACK_ACCEPT_STATUS', 'RESPONSIBLE', 'FTS_METHODOLOGY_STATUS', 'ACTION_STATUS', 'PRIORITY_ACTION', 'CHARACTER_ACTION', 'PERSON_PERFORMING_ACTION') NOT NULL;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_person_performing_action_id_fkey` FOREIGN KEY (`person_performing_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_accept_status_id_fkey` FOREIGN KEY (`accept_status_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_character_action_id_fkey` FOREIGN KEY (`character_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_person_performing_action_id_fkey` FOREIGN KEY (`person_performing_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

