-- AlterTable
ALTER TABLE `fts_functions` ADD COLUMN `other_fts_function_name` VARCHAR(512) NULL;

-- CreateIndex
CREATE FULLTEXT INDEX `fts_functions_other_fts_function_name_idx` ON `fts_functions`(`other_fts_function_name`);
