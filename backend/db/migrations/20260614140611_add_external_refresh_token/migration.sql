/*
  Warnings:

  - You are about to drop the `token_rotation_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `token_rotation_logs` DROP FOREIGN KEY `token_rotation_logs_event_type_id_fkey`;

-- DropForeignKey
ALTER TABLE `token_rotation_logs` DROP FOREIGN KEY `token_rotation_logs_user_id_fkey`;

-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `external_refresh_token` VARCHAR(1024) NULL;

-- DropTable
DROP TABLE `token_rotation_logs`;
