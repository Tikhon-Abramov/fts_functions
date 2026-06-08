-- AlterTable
ALTER TABLE `actions` ADD COLUMN `fts_methodology_status_id` INTEGER NULL,
    ADD COLUMN `initiator_acceptance` TEXT NULL;

-- CreateIndex
CREATE INDEX `actions_fts_methodology_status_id_idx` ON `actions`(`fts_methodology_status_id`);

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_fts_methodology_status_id_fkey` FOREIGN KEY (`fts_methodology_status_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
