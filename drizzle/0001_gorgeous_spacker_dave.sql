CREATE TABLE `dailyReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wins` text,
	`misses` text,
	`mood` int,
	`energy` int,
	`tomorrowFocus` text,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailyReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gymDiet` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutDone` boolean NOT NULL DEFAULT false,
	`weight` decimal(5,2),
	`meals` text,
	`proteinIntake` int,
	`waterIntake` int,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gymDiet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`habitType` enum('cigarettes','joints','stimulant_use') NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`urgeLevel` int,
	`triggerNotes` text,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`stage` enum('idea','build','test','launch','growth') NOT NULL DEFAULT 'idea',
	`progressPercent` decimal(5,2) NOT NULL DEFAULT '0.00',
	`nextAction` text,
	`blocker` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleep` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sleepTime` timestamp NOT NULL,
	`wakeTime` timestamp NOT NULL,
	`totalHours` decimal(4,2) NOT NULL,
	`quality` int,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sleep_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`projectId` int,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`dueDate` date,
	`scheduledTime` timestamp,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`googleEventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `telegramChatId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `googleCalendarToken` text;