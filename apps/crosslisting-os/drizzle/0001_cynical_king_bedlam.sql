CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('catalog','inventory','listing','approval','channel','profile','system') NOT NULL,
	`action` varchar(160) NOT NULL,
	`subjectType` varchar(80) NOT NULL,
	`subjectId` int,
	`actorUserId` int,
	`profileId` int,
	`correlationId` varchar(128) NOT NULL,
	`outcome` enum('requested','approved','rejected','succeeded','failed','blocked') NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectType` enum('listing','inventory','profile','channel') NOT NULL,
	`subjectId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`requestedByUserId` int,
	`decidedByUserId` int,
	`decisionNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`purpose` text NOT NULL,
	`memorySummary` text,
	`skillKeys` json,
	`allowedActions` json,
	`channelScope` json,
	`approvalRequired` boolean NOT NULL DEFAULT true,
	`enabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `automation_profiles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `channel_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`externalListingId` varchar(160),
	`state` enum('draft','review','approved','submitted','active','sold','ended','error') NOT NULL DEFAULT 'draft',
	`payload` json,
	`validationErrors` json,
	`lastSubmittedAt` timestamp,
	`lastSynchronizedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channel_listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_listings_product_channel_unique` UNIQUE(`productId`,`channelId`)
);
--> statement-breakpoint
CREATE TABLE `credential_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`secretKeyName` varchar(128) NOT NULL,
	`configured` boolean NOT NULL DEFAULT false,
	`lastVerifiedAt` timestamp,
	`lastVerificationStatus` enum('not_checked','valid','invalid','unavailable') NOT NULL DEFAULT 'not_checked',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credential_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `credential_connections_channel_key_unique` UNIQUE(`channelId`,`secretKeyName`)
);
--> statement-breakpoint
CREATE TABLE `exception_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectType` enum('product','listing','inventory','channel','profile') NOT NULL,
	`subjectId` int NOT NULL,
	`category` enum('incomplete','unsupported','validation','submission','inventory','security') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`message` text NOT NULL,
	`details` json,
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolvedByUserId` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exception_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `external_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`sourceUrl` varchar(512) NOT NULL,
	`sourceReference` varchar(160),
	`license` varchar(120),
	`attributionText` text,
	`integrationBoundary` text NOT NULL,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_components_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_components_source_unique` UNIQUE(`sourceUrl`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`movementType` enum('receive','reserve','release','sale','adjustment') NOT NULL,
	`onHandDelta` int NOT NULL DEFAULT 0,
	`reservedDelta` int NOT NULL DEFAULT 0,
	`reason` varchar(255) NOT NULL,
	`correlationId` varchar(128) NOT NULL,
	`actorUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`onHandQuantity` int NOT NULL DEFAULT 0,
	`reservedQuantity` int NOT NULL DEFAULT 0,
	`locationKey` varchar(128) NOT NULL DEFAULT 'llc-primary',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_records_product_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` enum('ebay','google_merchant','facebook_marketplace','mercari','poshmark') NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`capability` enum('api','conditional','prepared') NOT NULL DEFAULT 'prepared',
	`operationMode` enum('disabled','review','enabled') NOT NULL DEFAULT 'disabled',
	`enabled` boolean NOT NULL DEFAULT false,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_channels_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `policy_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`policyType` enum('fulfillment','return','payment','location','category','listing_rule') NOT NULL,
	`policyKey` varchar(128) NOT NULL,
	`policyValue` text NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policy_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`url` text NOT NULL,
	`altText` varchar(255),
	`mediaType` enum('image','video','document') NOT NULL DEFAULT 'image',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(128) NOT NULL,
	`upc` varchar(32),
	`title` varchar(255) NOT NULL,
	`condition` varchar(64) NOT NULL,
	`conditionNotes` text,
	`brandOrStudio` varchar(160),
	`format` varchar(80),
	`attributes` json,
	`description` text,
	`verificationStatus` enum('needs_review','verified','blocked') NOT NULL DEFAULT 'needs_review',
	`verifiedAt` timestamp,
	`verifiedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `activity_logs_category_index` ON `activity_logs` (`category`);--> statement-breakpoint
CREATE INDEX `activity_logs_correlation_index` ON `activity_logs` (`correlationId`);--> statement-breakpoint
CREATE INDEX `activity_logs_created_index` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `approval_requests_status_index` ON `approval_requests` (`status`);--> statement-breakpoint
CREATE INDEX `approval_requests_subject_index` ON `approval_requests` (`subjectType`,`subjectId`);--> statement-breakpoint
CREATE INDEX `channel_listings_state_index` ON `channel_listings` (`state`);--> statement-breakpoint
CREATE INDEX `exception_queue_status_index` ON `exception_queue` (`status`);--> statement-breakpoint
CREATE INDEX `exception_queue_severity_index` ON `exception_queue` (`severity`);--> statement-breakpoint
CREATE INDEX `inventory_movements_product_index` ON `inventory_movements` (`productId`);--> statement-breakpoint
CREATE INDEX `inventory_movements_correlation_index` ON `inventory_movements` (`correlationId`);--> statement-breakpoint
CREATE INDEX `policy_mappings_channel_index` ON `policy_mappings` (`channelId`);--> statement-breakpoint
CREATE INDEX `product_media_product_index` ON `product_media` (`productId`);--> statement-breakpoint
CREATE INDEX `products_upc_index` ON `products` (`upc`);
