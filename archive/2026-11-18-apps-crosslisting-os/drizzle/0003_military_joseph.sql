CREATE TABLE `channel_sale_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`productId` int NOT NULL,
	`externalEventId` varchar(160) NOT NULL,
	`externalListingId` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`status` enum('received','applied','duplicate','blocked') NOT NULL DEFAULT 'received',
	`details` json,
	`occurredAt` timestamp NOT NULL,
	`reconciledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_sale_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_sale_events_channel_external_unique` UNIQUE(`channelId`,`externalEventId`)
);
--> statement-breakpoint
CREATE INDEX `channel_sale_events_product_index` ON `channel_sale_events` (`productId`);