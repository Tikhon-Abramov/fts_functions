-- AlterTable
ALTER TABLE `actions` ADD COLUMN `other_person_performing_action` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `other_person_performing_action` VARCHAR(191) NULL;
