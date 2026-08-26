ALTER TABLE `approval_requests` ADD `correlationId` varchar(128) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `exception_queue` ADD `correlationId` varchar(128) DEFAULT 'system' NOT NULL;--> statement-breakpoint
CREATE INDEX `approval_requests_correlation_index` ON `approval_requests` (`correlationId`);--> statement-breakpoint
CREATE INDEX `exception_queue_correlation_index` ON `exception_queue` (`correlationId`);