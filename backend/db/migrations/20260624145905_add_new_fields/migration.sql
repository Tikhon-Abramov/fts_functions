-- AlterTable
ALTER TABLE `actions` ADD COLUMN `priority_action_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `actions_input` TEXT NULL,
    ADD COLUMN `actions_output` TEXT NULL;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_priority_action_id_fkey` FOREIGN KEY (`priority_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
