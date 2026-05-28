CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`provider` varchar(64) NOT NULL,
	`model` varchar(255) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fetcher_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`source` varchar(64) NOT NULL,
	`title` varchar(512) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`budget` decimal(10,2),
	`postedAt` timestamp,
	`deliverable` text,
	`estimatedHourlyRate` decimal(10,2),
	`qualified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fetcher_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manus_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`status` enum('pending','running','completed','failed','stopped') DEFAULT 'pending',
	`result` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manus_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `manus_tasks_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `paperclip_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiUrl` varchar(1024) NOT NULL,
	`apiKey` text NOT NULL,
	`companyId` varchar(255) NOT NULL,
	`agentId` varchar(255),
	`isConnected` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paperclip_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`apiKey` text,
	`baseUrl` varchar(1024),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_configs_id` PRIMARY KEY(`id`)
);
