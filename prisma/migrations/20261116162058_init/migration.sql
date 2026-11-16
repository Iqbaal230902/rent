-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'STAFF',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bike_models` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `category` ENUM('ROAD', 'MTB', 'EBIKE', 'FOLDING') NOT NULL,
    `description` TEXT NULL,
    `specs` JSON NOT NULL,
    `photos` JSON NOT NULL,
    `frame_size` VARCHAR(40) NULL,
    `price_per_hour` INTEGER NOT NULL,
    `price_per_day` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bike_models_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bike_units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `model_id` INTEGER NOT NULL,
    `serial_number` VARCHAR(80) NOT NULL,
    `status` ENUM('AVAILABLE', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'AVAILABLE',
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bike_units_serial_number_key`(`serial_number`),
    INDEX `bike_units_model_id_status_idx`(`model_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `public_token` VARCHAR(64) NOT NULL,
    `user_id` INTEGER NULL,
    `customer_name` VARCHAR(120) NOT NULL,
    `customer_phone` VARCHAR(30) NOT NULL,
    `customer_email` VARCHAR(190) NOT NULL,
    `model_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'IN_USE', 'COMPLETED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `hold_expires_at` DATETIME(3) NULL,
    `subtotal` INTEGER NOT NULL,
    `total_amount` INTEGER NOT NULL,
    `notes` VARCHAR(255) NULL,
    `paid_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,
    `expired_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookings_code_key`(`code`),
    UNIQUE INDEX `bookings_public_token_key`(`public_token`),
    INDEX `bookings_status_hold_expires_at_idx`(`status`, `hold_expires_at`),
    INDEX `bookings_model_id_status_start_at_end_at_idx`(`model_id`, `status`, `start_at`, `end_at`),
    INDEX `bookings_start_at_idx`(`start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booking_units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `unit_id` INTEGER NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,

    INDEX `booking_units_unit_id_start_at_end_at_idx`(`unit_id`, `start_at`, `end_at`),
    INDEX `booking_units_booking_id_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `gateway` ENUM('MANUAL', 'MIDTRANS', 'XENDIT', 'TRIPAY') NOT NULL DEFAULT 'MANUAL',
    `method` ENUM('TUNAI', 'TRANSFER', 'QRIS_STATIS', 'QRIS_DINAMIS') NULL,
    `gateway_order_id` VARCHAR(80) NOT NULL,
    `qr_string` TEXT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `confirmed_by` INTEGER NULL,
    `note` VARCHAR(255) NULL,
    `raw_payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_gateway_order_id_key`(`gateway_order_id`),
    INDEX `payments_booking_id_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gateway` ENUM('MANUAL', 'MIDTRANS', 'XENDIT', 'TRIPAY') NOT NULL,
    `event_id` VARCHAR(120) NOT NULL,
    `payload` JSON NOT NULL,
    `processed_at` DATETIME(3) NULL,
    `result` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `webhook_events_event_id_key`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(40) NOT NULL,
    `pdf_url` VARCHAR(255) NULL,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invoices_booking_id_key`(`booking_id`),
    UNIQUE INDEX `invoices_invoice_number_key`(`invoice_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rentals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `checked_in_by` INTEGER NOT NULL,
    `checked_in_at` DATETIME(3) NOT NULL,
    `collateral_type` ENUM('KTP', 'SIM', 'LAINNYA') NOT NULL,
    `collateral_note` VARCHAR(255) NULL,
    `checked_out_by` INTEGER NULL,
    `checked_out_at` DATETIME(3) NULL,
    `late_minutes` INTEGER NOT NULL DEFAULT 0,
    `late_fee` INTEGER NOT NULL DEFAULT 0,
    `damage_fee` INTEGER NOT NULL DEFAULT 0,
    `damage_note` VARCHAR(255) NULL,
    `settlement_method` ENUM('TUNAI', 'TRANSFER', 'QRIS_STATIS', 'QRIS_DINAMIS') NULL,
    `collateral_returned` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `rentals_booking_id_key`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` TEXT NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NULL,
    `action` VARCHAR(60) NOT NULL,
    `entity` VARCHAR(60) NOT NULL,
    `entity_id` VARCHAR(60) NULL,
    `data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_entity_id_idx`(`entity`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bike_units` ADD CONSTRAINT `bike_units_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `bike_models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `bike_models`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_units` ADD CONSTRAINT `booking_units_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_units` ADD CONSTRAINT `booking_units_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `bike_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_confirmed_by_fkey` FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_checked_in_by_fkey` FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_checked_out_by_fkey` FOREIGN KEY (`checked_out_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
