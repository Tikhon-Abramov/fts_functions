-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('ADMIN', 'USER') NOT NULL,
    `fts_position_role` ENUM('DEPUTY_CHIEF', 'CHIEF') NULL,
    `fts_function_role` ENUM('CURATOR', 'MANAGER') NULL,
    `fts_branch_type` ENUM('CENTRAL_OFFICE', 'INTERREGIONAL_INSPECTION') NOT NULL,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `patronymic` VARCHAR(50) NULL,
    `full_name` VARCHAR(160) NULL,
    `short_name` VARCHAR(60) NULL,
    `description` VARCHAR(512) NULL,
    `login` VARCHAR(50) NULL,
    `email` VARCHAR(254) NULL,
    `password_hash` VARCHAR(255) NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `email_verification_token` VARCHAR(128) NULL,
    `email_verification_sent_at` DATETIME(3) NULL,
    `password_reset_token` VARCHAR(128) NULL,
    `password_reset_sent_at` DATETIME(3) NULL,
    `avatar_key` VARCHAR(512) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_id` INTEGER NULL,
    `updated_by_id` INTEGER NULL,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_login_key`(`login`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_email_verification_token_key`(`email_verification_token`),
    UNIQUE INDEX `users_password_reset_token_key`(`password_reset_token`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_fts_position_role_idx`(`fts_position_role`),
    INDEX `users_fts_branch_type_idx`(`fts_branch_type`),
    INDEX `users_fts_function_role_idx`(`fts_function_role`),
    INDEX `users_is_deleted_idx`(`is_deleted`),
    INDEX `users_is_active_idx`(`is_active`),
    INDEX `users_email_verified_idx`(`email_verified`),
    INDEX `users_fts_position_role_fts_branch_type_is_deleted_idx`(`fts_position_role`, `fts_branch_type`, `is_deleted`),
    INDEX `users_fts_function_role_fts_branch_type_is_deleted_idx`(`fts_function_role`, `fts_branch_type`, `is_deleted`),
    FULLTEXT INDEX `users_login_full_name_description_idx`(`login`, `full_name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_token_blacklist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` VARCHAR(128) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_token_blacklist_token_hash_key`(`token_hash`),
    INDEX `refresh_token_blacklist_user_id_idx`(`user_id`),
    INDEX `refresh_token_blacklist_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `event` VARCHAR(64) NOT NULL,
    `ip_address` VARCHAR(64) NULL,
    `user_agent` VARCHAR(512) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `audit_log_event_created_at_idx`(`event`, `created_at`),
    INDEX `audit_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `history_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `entity_type` VARCHAR(64) NULL,
    `entity_id` INTEGER NULL,
    `action_type` ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    `old_value` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `history_log_created_at_idx`(`created_at`),
    INDEX `history_log_created_at_id_idx`(`created_at`, `id`),
    INDEX `history_log_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `history_log_user_id_action_type_created_at_idx`(`user_id`, `action_type`, `created_at`),
    INDEX `history_log_action_type_created_at_idx`(`action_type`, `created_at`),
    INDEX `history_log_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `category` ENUM('FTS_CENTRALIZATION', 'FTS_FUNCTION_NAME', 'FTS_FUNCTION_STEP', 'FTS_FUNCTION_CATEGORY', 'FTS_FUNCTION_MARKER', 'FTS_FUNCTION_COMPLEXITY', 'FTS_FUNCTION_EXECUTION_FREQUENCY', 'WHO_PERFORMS_ACTION', 'FTS_FUNCTION_ACTION_TYPE', 'FTS_FUNCTION_EFFECTIVENESS', 'FTS_COMPETENCY_CENTER', 'FTS_DTI', 'FTS_FUNCTION_RELATION_TYPE', 'TECHNOLOGICAL_SOLUTION', 'FEEDBACK_SOURCE', 'FEEDBACK_QUALITY_METRICS', 'RESPONSIBLE', 'FTS_METHODOLOGY_STATUS') NOT NULL,
    `name` VARCHAR(512) NOT NULL,
    `description` VARCHAR(1024) NULL,
    `color` VARCHAR(9) NULL,
    `supertype_id` INTEGER NULL,

    UNIQUE INDEX `type_code_key`(`code`),
    INDEX `type_code_idx`(`code`),
    INDEX `type_category_idx`(`category`),
    INDEX `type_supertype_id_idx`(`supertype_id`),
    INDEX `type_category_supertype_id_idx`(`category`, `supertype_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_to_dtis` (
    `fts_function_id` INTEGER NOT NULL,
    `dti_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_to_dtis_dti_id_idx`(`dti_id`),
    PRIMARY KEY (`fts_function_id`, `dti_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_detail_to_feedback_sources` (
    `fts_function_detail_id` INTEGER NOT NULL,
    `feedback_source_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_detail_to_feedback_sources_feedback_source_id_idx`(`feedback_source_id`),
    PRIMARY KEY (`fts_function_detail_id`, `feedback_source_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_functions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_centralization_id` INTEGER NOT NULL,
    `fts_function_name_id` INTEGER NOT NULL,
    `competency_center_id` INTEGER NOT NULL,
    `curator_central_office_id` INTEGER NOT NULL,
    `manager_interregional_inspection_id` INTEGER NOT NULL,
    `department_head_central_office_id` INTEGER NOT NULL,
    `department_head_interregional_inspection_id` INTEGER NOT NULL,
    `fts_function_marker_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `fts_functions_fts_function_name_id_idx`(`fts_function_name_id`),
    INDEX `fts_functions_fts_centralization_id_idx`(`fts_centralization_id`),
    INDEX `fts_functions_competency_center_id_idx`(`competency_center_id`),
    INDEX `fts_functions_fts_function_marker_id_idx`(`fts_function_marker_id`),
    INDEX `fts_functions_curator_central_office_id_idx`(`curator_central_office_id`),
    INDEX `fts_functions_manager_interregional_inspection_id_idx`(`manager_interregional_inspection_id`),
    INDEX `fts_functions_department_head_central_office_id_idx`(`department_head_central_office_id`),
    INDEX `fts_functions_department_head_interregional_inspection_id_idx`(`department_head_interregional_inspection_id`),
    INDEX `fts_functions_is_deleted_idx`(`is_deleted`),
    INDEX `fts_functions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_function_id` INTEGER NOT NULL,
    `fts_function_step_id` INTEGER NOT NULL,
    `fts_function_category_id` INTEGER NULL,
    `fts_function_complexity_id` INTEGER NULL,
    `fts_function_execution_frequency_id` INTEGER NULL,
    `who_performs_action_id` INTEGER NULL,
    `fts_function_action_type_id` INTEGER NULL,
    `fts_function_effectiveness_id` INTEGER NULL,
    `technological_solution_id` INTEGER NULL,
    `responsible_id` INTEGER NULL,
    `fts_function_details` TEXT NULL,
    `basis` TEXT NULL,
    `artifact` TEXT NULL,
    `artifact_usage` TEXT NULL,
    `purpose` TEXT NULL,
    `number` VARCHAR(64) NULL,
    `algorithm` TEXT NULL,
    `problem_description` TEXT NULL,
    `initiator_requisites` TEXT NULL,
    `methodology_position` TEXT NULL,
    `initiator_acceptance` TEXT NULL,
    `fts_methodology_status_id` INTEGER NULL,
    `deadline` DATETIME(3) NULL,
    `is_accepted` BOOLEAN NULL,
    `reject_comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `fts_function_details_fts_function_id_idx`(`fts_function_id`),
    INDEX `fts_function_details_fts_function_step_id_idx`(`fts_function_step_id`),
    INDEX `fts_function_details_fts_function_category_id_idx`(`fts_function_category_id`),
    INDEX `fts_function_details_fts_function_complexity_id_idx`(`fts_function_complexity_id`),
    INDEX `fts_function_details_fts_function_execution_frequency_id_idx`(`fts_function_execution_frequency_id`),
    INDEX `fts_function_details_fts_function_action_type_id_idx`(`fts_function_action_type_id`),
    INDEX `fts_function_details_who_performs_action_id_idx`(`who_performs_action_id`),
    INDEX `fts_function_details_fts_function_effectiveness_id_idx`(`fts_function_effectiveness_id`),
    INDEX `fts_function_details_technological_solution_id_idx`(`technological_solution_id`),
    INDEX `fts_function_details_responsible_id_idx`(`responsible_id`),
    INDEX `fts_function_details_fts_methodology_status_id_idx`(`fts_methodology_status_id`),
    INDEX `fts_function_details_deadline_idx`(`deadline`),
    INDEX `fts_function_details_is_accepted_idx`(`is_accepted`),
    INDEX `fts_function_details_is_deleted_idx`(`is_deleted`),
    FULLTEXT INDEX `fts_function_details_fts_function_details_basis_artifact_art_idx`(`fts_function_details`, `basis`, `artifact`, `artifact_usage`, `purpose`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_detail_agreement_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_function_detail_id` INTEGER NOT NULL,
    `from_status` VARCHAR(32) NULL,
    `to_status` VARCHAR(32) NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_detail_agreement_history_detail_created_idx`(`fts_function_detail_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_tree` (
    `parent_fts_function_id` INTEGER NOT NULL,
    `child_fts_function_id` INTEGER NOT NULL,
    `relation_type_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_tree_child_fts_function_id_idx`(`child_fts_function_id`),
    INDEX `fts_function_tree_relation_type_id_idx`(`relation_type_id`),
    PRIMARY KEY (`parent_fts_function_id`, `child_fts_function_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `history_log` ADD CONSTRAINT `history_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `type` ADD CONSTRAINT `type_supertype_id_fkey` FOREIGN KEY (`supertype_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_to_dtis` ADD CONSTRAINT `fts_function_to_dtis_fts_function_id_fkey` FOREIGN KEY (`fts_function_id`) REFERENCES `fts_functions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_to_dtis` ADD CONSTRAINT `fts_function_to_dtis_dti_id_fkey` FOREIGN KEY (`dti_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` ADD CONSTRAINT `fts_function_detail_to_feedback_sources_fts_function_detail_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_detail_to_feedback_sources` ADD CONSTRAINT `fts_function_detail_to_feedback_sources_feedback_source_id_fkey` FOREIGN KEY (`feedback_source_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_curator_central_office_id_fkey` FOREIGN KEY (`curator_central_office_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_manager_interregional_inspection_id_fkey` FOREIGN KEY (`manager_interregional_inspection_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_department_head_central_office_id_fkey` FOREIGN KEY (`department_head_central_office_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_department_head_interregional_inspection_id_fkey` FOREIGN KEY (`department_head_interregional_inspection_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_centralization_id_fkey` FOREIGN KEY (`fts_centralization_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_function_name_id_fkey` FOREIGN KEY (`fts_function_name_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_competency_center_id_fkey` FOREIGN KEY (`competency_center_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_function_marker_id_fkey` FOREIGN KEY (`fts_function_marker_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_id_fkey` FOREIGN KEY (`fts_function_id`) REFERENCES `fts_functions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_step_id_fkey` FOREIGN KEY (`fts_function_step_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_category_id_fkey` FOREIGN KEY (`fts_function_category_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_complexity_id_fkey` FOREIGN KEY (`fts_function_complexity_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_execution_frequency_id_fkey` FOREIGN KEY (`fts_function_execution_frequency_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_who_performs_action_id_fkey` FOREIGN KEY (`who_performs_action_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_action_type_id_fkey` FOREIGN KEY (`fts_function_action_type_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_effectiveness_id_fkey` FOREIGN KEY (`fts_function_effectiveness_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_technological_solution_id_fkey` FOREIGN KEY (`technological_solution_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_responsible_id_fkey` FOREIGN KEY (`responsible_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_methodology_status_id_fkey` FOREIGN KEY (`fts_methodology_status_id`) REFERENCES `type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_detail_agreement_history` ADD CONSTRAINT `fts_function_detail_agreement_history_fts_function_detail_i_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_parent_fts_function_id_fkey` FOREIGN KEY (`parent_fts_function_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_child_fts_function_id_fkey` FOREIGN KEY (`child_fts_function_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_relation_type_id_fkey` FOREIGN KEY (`relation_type_id`) REFERENCES `type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
