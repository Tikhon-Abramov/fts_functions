CREATE TABLE `fts_function_detail_agreement_history` (
                                                         `id` INT NOT NULL AUTO_INCREMENT,
                                                         `fts_function_detail_id` INT NOT NULL,
                                                         `from_status` VARCHAR(32) NULL,
                                                         `to_status` VARCHAR(32) NOT NULL,
                                                         `comment` TEXT NULL,
                                                         `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

                                                         PRIMARY KEY (`id`),
                                                         INDEX `fts_function_detail_agreement_history_detail_created_idx` (`fts_function_detail_id`, `created_at`),
                                                         CONSTRAINT `fts_function_detail_agreement_history_detail_fk`
                                                             FOREIGN KEY (`fts_function_detail_id`)
                                                                 REFERENCES `fts_function_details` (`id`)
                                                                 ON DELETE CASCADE
                                                                 ON UPDATE CASCADE
);