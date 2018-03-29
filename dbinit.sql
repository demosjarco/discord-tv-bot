-- ---
-- Globals
-- ---

-- SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
-- SET FOREIGN_KEY_CHECKS=0;

-- ---
-- Table 'guild_preferences'
-- 
-- ---

DROP TABLE IF EXISTS `guild_preferences`;
		
CREATE TABLE `guild_preferences` (
  `guild_id` VARCHAR(50) NOT NULL,
  `textChannel_id` VARCHAR(50) NOT NULL,
  `notificationRole_id` VARCHAR(50) NULL DEFAULT NULL,
  PRIMARY KEY (`guild_id`)
);

-- ---
-- Table 'guild_tvWatchlist'
-- 
-- ---

DROP TABLE IF EXISTS `guild_tvWatchlist`;
		
CREATE TABLE `guild_tvWatchlist` (
  `guild_id` VARCHAR(50) NOT NULL,
  `tvdbShow_id` INTEGER NOT NULL,
  UNIQUE KEY (`guild_id`, `tvdbShow_id`)
);

-- ---
-- Table 'notifMsgWatchlist'
-- 
-- ---

DROP TABLE IF EXISTS `notifMsgWatchlist`;
		
CREATE TABLE `notifMsgWatchlist` (
  `message_id` VARCHAR(50) NOT NULL,
  `channel_id` VARCHAR(50) NOT NULL,
  UNIQUE KEY (`message_id`, `channel_id`)
);

-- ---
-- Foreign Keys 
-- ---

ALTER TABLE `guild_tvWatchlist` ADD FOREIGN KEY (guild_id) REFERENCES `guild_preferences` (`guild_id`) ON DELETE CASCADE;

-- ---
-- Table Properties
-- ---

-- ALTER TABLE `guild_preferences` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `guild_tvWatchlist` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
-- ALTER TABLE `notifMsgWatchlist` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

-- INSERT INTO `guild_preferences` (`guild_id`,`textChannel_id`,`notificationRole_id`) VALUES
-- ('','','');
-- INSERT INTO `guild_tvWatchlist` (`guild_id`,`tvdbShow_id`) VALUES
-- ('','');
-- INSERT INTO `notifMsgWatchlist` (`message_id`,`channel_id`) VALUES
-- ('','');