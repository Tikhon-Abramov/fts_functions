/*
  Warnings:

  - You are about to drop the column `ip_address` on the `history_log` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `history_log` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `actions` ADD COLUMN `creator_id` INTEGER NULL,
    ADD COLUMN `deleter_id` INTEGER NULL,
    ADD COLUMN `reordered_at` DATETIME(3) NULL,
    ADD COLUMN `reorderer_id` INTEGER NULL,
    ADD COLUMN `updater_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `feedback` ADD COLUMN `acceptor_id` INTEGER NULL,
    ADD COLUMN `creator_id` INTEGER NULL,
    ADD COLUMN `deleter_id` INTEGER NULL,
    ADD COLUMN `reordered_at` DATETIME(3) NULL,
    ADD COLUMN `reorderer_id` INTEGER NULL,
    ADD COLUMN `updater_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `feedback_agreement_history` ADD COLUMN `acceptor_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `files` ADD COLUMN `creator_id` INTEGER NULL,
    ADD COLUMN `deleter_id` INTEGER NULL,
    ADD COLUMN `updater_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `fts_function_details` ADD COLUMN `creator_id` INTEGER NULL,
    ADD COLUMN `deleter_id` INTEGER NULL,
    ADD COLUMN `reordered_at` DATETIME(3) NULL,
    ADD COLUMN `reorderer_id` INTEGER NULL,
    ADD COLUMN `updater_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `fts_function_tree` ADD COLUMN `creator_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `fts_functions` ADD COLUMN `creator_id` INTEGER NULL,
    ADD COLUMN `deleter_id` INTEGER NULL,
    ADD COLUMN `updater_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `history_log` DROP COLUMN `ip_address`,
    DROP COLUMN `user_agent`;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_reorderer_id_fkey` FOREIGN KEY (`reorderer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_acceptor_id_fkey` FOREIGN KEY (`acceptor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_reorderer_id_fkey` FOREIGN KEY (`reorderer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_reorderer_id_fkey` FOREIGN KEY (`reorderer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_agreement_history` ADD CONSTRAINT `feedback_agreement_history_acceptor_id_fkey` FOREIGN KEY (`acceptor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
