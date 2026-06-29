-- CreateTable
CREATE TABLE `types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `category` ENUM('token_status', 'token_rotation_event', 'ACTION_HISTORY_TYPE', 'FTS_CENTRALIZATION', 'FTS_FUNCTION_NAME', 'FTS_FUNCTION_STEP', 'FTS_FUNCTION_CATEGORY', 'FTS_FUNCTION_MARKER', 'FTS_FUNCTION_COMPLEXITY', 'FTS_FUNCTION_EXECUTION_FREQUENCY', 'WHO_PERFORMS_ACTION', 'FTS_FUNCTION_ACTION_TYPE', 'FTS_FUNCTION_EFFECTIVENESS', 'FTS_COMPETENCY_CENTER', 'FTS_DTI', 'FTS_FUNCTION_RELATION_TYPE', 'TECHNOLOGICAL_SOLUTION', 'FEEDBACK_SOURCE', 'FEEDBACK_QUALITY_METRICS', 'FEEDBACK_ACCEPT_STATUS', 'RESPONSIBLE', 'FTS_METHODOLOGY_STATUS', 'ACTION_STATUS', 'PRIORITY_ACTION') NOT NULL,
    `name` VARCHAR(512) NOT NULL,
    `description` VARCHAR(1024) NULL,
    `supertype_id` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `types_code_idx`(`code`),
    INDEX `types_category_idx`(`category`),
    INDEX `types_supertype_id_idx`(`supertype_id`),
    INDEX `types_category_supertype_id_idx`(`category`, `supertype_id`),
    UNIQUE INDEX `types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_interaction_users_id` INTEGER NULL,
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
    `password_hash` VARCHAR(255) NULL,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    INDEX `users_role_idx`(`role`),
    INDEX `users_fts_position_role_idx`(`fts_position_role`),
    INDEX `users_fts_branch_type_idx`(`fts_branch_type`),
    INDEX `users_fts_function_role_idx`(`fts_function_role`),
    INDEX `users_is_deleted_idx`(`is_deleted`),
    INDEX `users_fts_position_role_fts_branch_type_is_deleted_idx`(`fts_position_role`, `fts_branch_type`, `is_deleted`),
    INDEX `users_fts_function_role_fts_branch_type_is_deleted_idx`(`fts_function_role`, `fts_branch_type`, `is_deleted`),
    UNIQUE INDEX `users_fts_interaction_users_id_key`(`fts_interaction_users_id`),
    UNIQUE INDEX `users_login_key`(`login`),
    FULLTEXT INDEX `users_login_full_name_description_idx`(`login`, `full_name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jti` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(512) NOT NULL,
    `family_id` VARCHAR(36) NOT NULL,
    `parent_token_hash` VARCHAR(512) NULL,
    `user_id` INTEGER NOT NULL,
    `status_type_id` INTEGER NOT NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(512) NULL,
    `rotation_count` INTEGER NOT NULL DEFAULT 0,
    `external_refresh_token` VARCHAR(1024) NULL,

    UNIQUE INDEX `refresh_tokens_jti_key`(`jti`),
    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_family_id_idx`(`family_id`),
    INDEX `refresh_tokens_status_type_id_idx`(`status_type_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    INDEX `refresh_tokens_issued_at_idx`(`issued_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `history_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `entity_type` VARCHAR(64) NULL,
    `entity_id` INTEGER NULL,
    `entity_field` VARCHAR(64) NULL,
    `action_type_id` INTEGER NOT NULL,
    `old_value` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `history_log_created_at_idx`(`created_at`),
    INDEX `history_log_created_at_id_idx`(`created_at`, `id`),
    INDEX `history_log_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `history_log_user_id_action_type_id_created_at_idx`(`user_id`, `action_type_id`, `created_at`),
    INDEX `history_log_action_type_id_created_at_idx`(`action_type_id`, `created_at`),
    INDEX `history_log_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `history_log_entity_id_entity_field_idx`(`entity_id`, `entity_field`),
    INDEX `history_log_entity_id_entity_field_created_at_idx`(`entity_id`, `entity_field`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entity_to_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fts_function_id` INTEGER NULL,
    `feedback_id` INTEGER NULL,
    `action_id` INTEGER NULL,
    `type_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `entity_to_types_fts_function_id_idx`(`fts_function_id`),
    INDEX `entity_to_types_feedback_id_idx`(`feedback_id`),
    INDEX `entity_to_types_action_id_idx`(`action_id`),
    INDEX `entity_to_types_type_id_idx`(`type_id`),
    UNIQUE INDEX `entity_to_types_type_id_fts_function_id_key`(`type_id`, `fts_function_id`),
    UNIQUE INDEX `entity_to_types_type_id_feedback_id_key`(`type_id`, `feedback_id`),
    UNIQUE INDEX `entity_to_types_type_id_action_id_key`(`type_id`, `action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_functions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NULL,
    `updater_id` INTEGER NULL,
    `deleter_id` INTEGER NULL,
    `fts_centralization_id` INTEGER NOT NULL,
    `fts_function_name_id` INTEGER NOT NULL,
    `fts_function_marker_id` INTEGER NOT NULL,
    `competency_center_id` INTEGER NOT NULL,
    `curator_central_office_id` INTEGER NOT NULL,
    `manager_interregional_inspection_id` INTEGER NOT NULL,
    `department_head_central_office_id` INTEGER NOT NULL,
    `department_head_interregional_inspection_id` INTEGER NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
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
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NULL,
    `updater_id` INTEGER NULL,
    `reorderer_id` INTEGER NULL,
    `deleter_id` INTEGER NULL,
    `fts_function_id` INTEGER NOT NULL,
    `fts_function_step_id` INTEGER NOT NULL,
    `fts_function_category_id` INTEGER NOT NULL,
    `fts_function_complexity_id` INTEGER NULL,
    `fts_function_execution_frequency_id` INTEGER NULL,
    `who_performs_action_id` INTEGER NULL,
    `fts_function_action_type_id` INTEGER NULL,
    `fts_function_effectiveness_id` INTEGER NULL,
    `technological_solution_id` INTEGER NULL,
    `responsible_id` INTEGER NULL,
    `fts_function_details` TEXT NOT NULL,
    `actions_completeness` TEXT NULL,
    `actions_effectiveness` TEXT NULL,
    `basis` TEXT NULL,
    `artifact` TEXT NULL,
    `artifact_usage` TEXT NULL,
    `purpose` TEXT NULL,
    `number` VARCHAR(64) NULL,
    `algorithm` TEXT NULL,
    `actions_input` TEXT NULL,
    `actions_output` TEXT NULL,
    `order` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reordered_at` DATETIME(3) NULL,
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
    INDEX `fts_function_details_is_deleted_idx`(`is_deleted`),
    FULLTEXT INDEX `fts_function_details_fts_function_details_basis_artifact_art_idx`(`fts_function_details`, `basis`, `artifact`, `artifact_usage`, `purpose`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NULL,
    `updater_id` INTEGER NULL,
    `acceptor_id` INTEGER NULL,
    `reorderer_id` INTEGER NULL,
    `deleter_id` INTEGER NULL,
    `fts_function_detail_id` INTEGER NOT NULL,
    `feedback_quality_metrics_id` INTEGER NULL,
    `problem_description` TEXT NULL,
    `initiator_requisites` TEXT NULL,
    `fts_methodology_status_id` INTEGER NULL,
    `deadline` DATETIME(3) NULL,
    `initiator_acceptance` TEXT NULL,
    `accept_status_id` INTEGER NOT NULL,
    `order` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reordered_at` DATETIME(3) NULL,
    `accepted_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NULL,
    `updater_id` INTEGER NULL,
    `reorderer_id` INTEGER NULL,
    `deleter_id` INTEGER NULL,
    `fts_function_detail_id` INTEGER NOT NULL,
    `status_id` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `feedback_quality_metrics_id` INTEGER NULL,
    `fts_methodology_status_id` INTEGER NULL,
    `priority_action_id` INTEGER NULL,
    `problem_description` TEXT NULL,
    `initiator_requisites` TEXT NULL,
    `initiator_acceptance` TEXT NULL,
    `deadline` DATETIME(3) NULL,
    `order` INTEGER NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reordered_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback_agreement_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `acceptor_id` INTEGER NULL,
    `feedback_id` INTEGER NOT NULL,
    `accept_status_id` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `feedback_agreement_history_feedback_id_idx`(`feedback_id`),
    INDEX `feedback_agreement_history_accept_status_id_idx`(`accept_status_id`),
    INDEX `feedback_agreement_history_feedback_id_accept_status_id_idx`(`feedback_id`, `accept_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fts_function_tree` (
    `creator_id` INTEGER NULL,
    `parent_fts_function_id` INTEGER NOT NULL,
    `child_fts_function_id` INTEGER NOT NULL,
    `relation_type_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fts_function_tree_child_fts_function_id_idx`(`child_fts_function_id`),
    INDEX `fts_function_tree_relation_type_id_idx`(`relation_type_id`),
    PRIMARY KEY (`parent_fts_function_id`, `child_fts_function_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `creator_id` INTEGER NULL,
    `updater_id` INTEGER NULL,
    `deleter_id` INTEGER NULL,
    `fts_function_detail_id` INTEGER NULL,
    `object_key` VARCHAR(128) NOT NULL,
    `original_name` VARCHAR(255) NULL,
    `mime_type` VARCHAR(100) NULL,
    `size` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `is_upload_confirmed` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `files_is_upload_confirmed_is_deleted_idx`(`is_upload_confirmed`, `is_deleted`),
    INDEX `files_created_at_idx`(`created_at`),
    INDEX `files_created_at_is_upload_confirmed_idx`(`created_at`, `is_upload_confirmed`),
    INDEX `files_object_key_idx`(`object_key`),
    INDEX `files_fts_function_detail_id_is_deleted_is_upload_confirmed_idx`(`fts_function_detail_id`, `is_deleted`, `is_upload_confirmed`),
    INDEX `files_fts_function_detail_id_is_deleted_idx`(`fts_function_detail_id`, `is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `types` ADD CONSTRAINT `types_supertype_id_fkey` FOREIGN KEY (`supertype_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_status_type_id_fkey` FOREIGN KEY (`status_type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `history_log` ADD CONSTRAINT `history_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `history_log` ADD CONSTRAINT `history_log_action_type_id_fkey` FOREIGN KEY (`action_type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_to_types` ADD CONSTRAINT `entity_to_types_fts_function_id_fkey` FOREIGN KEY (`fts_function_id`) REFERENCES `fts_functions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_to_types` ADD CONSTRAINT `entity_to_types_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_to_types` ADD CONSTRAINT `entity_to_types_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entity_to_types` ADD CONSTRAINT `entity_to_types_type_id_fkey` FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_curator_central_office_id_fkey` FOREIGN KEY (`curator_central_office_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_manager_interregional_inspection_id_fkey` FOREIGN KEY (`manager_interregional_inspection_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_department_head_central_office_id_fkey` FOREIGN KEY (`department_head_central_office_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_department_head_interregional_inspection_id_fkey` FOREIGN KEY (`department_head_interregional_inspection_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_centralization_id_fkey` FOREIGN KEY (`fts_centralization_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_function_name_id_fkey` FOREIGN KEY (`fts_function_name_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_fts_function_marker_id_fkey` FOREIGN KEY (`fts_function_marker_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_functions` ADD CONSTRAINT `fts_functions_competency_center_id_fkey` FOREIGN KEY (`competency_center_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_reorderer_id_fkey` FOREIGN KEY (`reorderer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_id_fkey` FOREIGN KEY (`fts_function_id`) REFERENCES `fts_functions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_step_id_fkey` FOREIGN KEY (`fts_function_step_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_category_id_fkey` FOREIGN KEY (`fts_function_category_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_complexity_id_fkey` FOREIGN KEY (`fts_function_complexity_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_execution_frequency_id_fkey` FOREIGN KEY (`fts_function_execution_frequency_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_who_performs_action_id_fkey` FOREIGN KEY (`who_performs_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_action_type_id_fkey` FOREIGN KEY (`fts_function_action_type_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_fts_function_effectiveness_id_fkey` FOREIGN KEY (`fts_function_effectiveness_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_technological_solution_id_fkey` FOREIGN KEY (`technological_solution_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_details` ADD CONSTRAINT `fts_function_details_responsible_id_fkey` FOREIGN KEY (`responsible_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_fts_function_detail_id_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_feedback_quality_metrics_id_fkey` FOREIGN KEY (`feedback_quality_metrics_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_fts_methodology_status_id_fkey` FOREIGN KEY (`fts_methodology_status_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback` ADD CONSTRAINT `feedback_accept_status_id_fkey` FOREIGN KEY (`accept_status_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_reorderer_id_fkey` FOREIGN KEY (`reorderer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_fts_function_detail_id_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_feedback_quality_metrics_id_fkey` FOREIGN KEY (`feedback_quality_metrics_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_fts_methodology_status_id_fkey` FOREIGN KEY (`fts_methodology_status_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actions` ADD CONSTRAINT `actions_priority_action_id_fkey` FOREIGN KEY (`priority_action_id`) REFERENCES `types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_agreement_history` ADD CONSTRAINT `feedback_agreement_history_acceptor_id_fkey` FOREIGN KEY (`acceptor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_agreement_history` ADD CONSTRAINT `feedback_agreement_history_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `feedback`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedback_agreement_history` ADD CONSTRAINT `feedback_agreement_history_accept_status_id_fkey` FOREIGN KEY (`accept_status_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_parent_fts_function_id_fkey` FOREIGN KEY (`parent_fts_function_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_child_fts_function_id_fkey` FOREIGN KEY (`child_fts_function_id`) REFERENCES `fts_function_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fts_function_tree` ADD CONSTRAINT `fts_function_tree_relation_type_id_fkey` FOREIGN KEY (`relation_type_id`) REFERENCES `types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_updater_id_fkey` FOREIGN KEY (`updater_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_deleter_id_fkey` FOREIGN KEY (`deleter_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_fts_function_detail_id_fkey` FOREIGN KEY (`fts_function_detail_id`) REFERENCES `fts_function_details`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
