CREATE TABLE `paperclip_delegations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` varchar(255) NOT NULL,
	`taskDescription` text NOT NULL,
	`status` enum('pending','assigned','in_progress','completed','failed') DEFAULT 'pending',
	`result` text,
	`delegatedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paperclip_delegations_id` PRIMARY KEY(`id`)
);
