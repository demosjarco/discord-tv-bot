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
-- Foreign Keys 
-- ---


-- ---
-- Table Properties
-- ---

-- ALTER TABLE `guild_preferences` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ---
-- Test Data
-- ---

-- INSERT INTO `guild_preferences` (`guild_id`,`textChannel_id`,`notificationRole_id`) VALUES
-- ('','','');