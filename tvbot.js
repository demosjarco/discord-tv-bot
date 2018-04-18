const secretKeys = require("./secret-keys.js");
const request = require("request");
const Eris = require("eris");
const mysql = require("mysql");
const TVDBPlugin = require("node-tvdb");
const tvdb = new TVDBPlugin(secretKeys.tvdbKey);
const tvdbImageBase = "https://thetvdb.com/banners/";
const colorThief = require('color-thief-jimp');
const jimp = require('jimp');

const pool  = mysql.createPool({
	connectionLimit: 50,
	host: secretKeys.dbHost,
	user: secretKeys.dbUser,
	password: secretKeys.dbPass,
	database: secretKeys.dbDb,
	supportBigNumbers: false,
});

const bot = new Eris.CommandClient(secretKeys.botToken, {
	autoreconnect: true,
	compress: true,
	maxShards: "auto",
}, {
	defaultCommandOptions: {
		caseInsensitive: true
	}
});
bot.on("ready", () => {
	console.log("TV Bot Ready!");
	
	function setNotificationTimers() {
		// TV DB give times in their server location which is New York
		request({ method: "GET", url: 'http://api.timezonedb.com/v2/get-time-zone', qs: { key: secretKeys.tzdbKey, format: 'json', fields: "gmtOffset", by: 'zone', zone: 'America/New_York' } }, function (error, response, body) {
			if (error) throw error;

			const secondsToGMT = JSON.parse(body).gmtOffset;

			// Create cron jobs on bot start
			pool.getConnection(function(err1, connection1) {
				if (err1) throw err1;

				connection1.query("SELECT gp.textChannel_id, gp.notificationRole_id, gwl.guild_id, gwl.tvdbShow_id FROM guild_tvWatchlist gwl JOIN guild_preferences gp ON (gwl.guild_id = gp.guild_id)").on("error", function(error1) {
					throw error1;
				}).on("result", function(row) {
					connection1.pause();
					tvdb.getSeriesById(row.tvdbShow_id).then(seriesInfo => {
						// Annoying time zone stuff
						var hours = parseInt(seriesInfo.airsTime.split(":")[0]);
						const minutes = parseInt(seriesInfo.airsTime.split(":")[1].split(" ")[0]);
						// IF PM add 12 hours in milliseconds
						if (seriesInfo.airsTime.split(":")[1].split(" ")[1] === "PM") hours += 12;

						var timeString = "T";//"T01:29-0400";
						if (hours < 10) timeString += "0";
						timeString += hours;
						timeString += ":";
						if (minutes < 10) timeString += "0";
						timeString += minutes;
						timeString += "-0" + (Math.abs(secondsToGMT) / 60 / 60) + "00";

						var episodePageNumber = 1;
						function episodePagination(pageNum) {
							tvdb.getEpisodesBySeriesId(row.tvdbShow_id).then(episodesInfo => {
								// Manual for loop
								var episodeCounter = 0;
								function episodeLoop(episode) {
									if (!isNaN(episode.absoluteNumber)) {
										// Is actual episode not extras
										const epDate = new Date(episode.firstAired + timeString);

										if (epDate) {
											// Fire date 10 minutes before
											const fireDate = new Date(epDate.getTime() - 600000);
											if (fireDate && fireDate.getTime() > new Date().getTime() && fireDate.getTime() - new Date().getTime() < 2147483647) {
												setTimeout(function(seriesName, seriesNetwork, episodeId, channelId, notRoleId) {
													// Post episode is live
													tvdb.getEpisodeById(episodeId).then(episodeInfo => {
														var notRole = "";
														if (notRoleId) notRole = "<@&" + notRoleId + ">";
														bot.createMessage(channelId, {
															content: notRole + " " + seriesName + " starts on " + seriesNetwork + " in 10 minutes",
															embed: {
																title: seriesName + " " + episodeInfo.airedSeason + "x" + episodeInfo.airedEpisodeNumber + " - " + episodeInfo.episodeName,
																description: episodeInfo.overview,
																footer: {
																	text: "Show info and images from The TVDB",
																}
															}
														});
													}).catch(episodeError => {
														console.error(episodeError);
													});
												}.bind(null, seriesInfo.seriesName, seriesInfo.network, episode.id, row.textChannel_id, row.notificationRole_id), fireDate.getTime() - new Date().getTime());
											}
										}
									}

									episodeCounter++;
									if (episodeCounter < episodesInfo.length) {
										episodeLoop(episodesInfo[episodeCounter]);
									} else {
										connection1.resume();
									}
								}
								episodeLoop(episodesInfo[episodeCounter]);
							}).catch(episodesError => {
								console.error(episodesError);
								connection1.resume();
							});
						}
						episodePagination(episodePageNumber);
					}).catch(seriesError => {
						console.error(seriesError);
						connection1.resume();
					});
				}).on("end", function() {
					connection1.release();
				});
			});
		});
	}
	setNotificationTimers();
	setInterval(setNotificationTimers, 2147483647);
});
bot.on("error", (err, id) => {
	console.error(err);
	bot.disconnect({reconnect: "auto"});
});

bot.connect();

bot.registerCommand("setChannel", (msg, args) => {
	// Check if user mentioned a channel
	var channel = "";
	if (msg.channelMentions && msg.channelMentions.length > 0) {
		// User mentioned a channel. Use that channel
		channel = msg.channelMentions[0];
	} else {
		// No channel mentioned. Use current channel message is in
		channel = msg.channel.id;
	}
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;
		
		connection1.query("INSERT INTO guild_preferences (guild_id, textChannel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE textChannel_id=VALUES(textChannel_id)", [msg.channel.guild.id, channel], function(error1, results1, fields1) {
			connection1.release();
			
			if (error1) throw error1;
			
			bot.createMessage(channel, {embed: {
				title: "Success",
				description: "This channel has been set as the channel for all of the bot's posts.",
				color: 0x00FF00
			}});
		});
	});
}, {
	description: "REQUIRED: Set channel for bot text",
	fullDescription: "Set a text channel for the bot to use when posting content. You must have `Manage Channels` or higher permission on your server to use this.",
	usage: "Just type this command in the channel that you want to use or tag a channel using `#channel-name-whatever`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
bot.registerCommandAlias("sc", "setChannel");

// https://abal.moe/Eris/docs/CommandClient#function-createChannel
// Channel type 4 = catergory channel

bot.registerCommand("setPreChannel", (msg, args) => {
	
}, {
	description: "",
	fullDescription: "",
	usage: "Just type this command in the channel that you want to use or tag a channel using `#channel-name-whatever`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
bot.registerCommandAlias("sPrc", "setPreChannel");

bot.registerCommand("setLiveChannel", (msg, args) => {
	
}, {
	description: "",
	fullDescription: "",
	usage: "Just type this command in the channel that you want to use or tag a channel using `#channel-name-whatever`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
bot.registerCommandAlias("sLic", "setLiveChannel");

bot.registerCommand("setPostChannel", (msg, args) => {
	
}, {
	description: "",
	fullDescription: "",
	usage: "Just type this command in the channel that you want to use or tag a channel using `#channel-name-whatever`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
bot.registerCommandAlias("sPoc", "setPostChannel");

bot.registerCommand("setRole", (msg, args) => {
	// Check if role is mentioned in command
	if (msg.roleMentions && msg.roleMentions.length > 0) {
		// User mentioned a role. Use that role
		pool.getConnection(function(err1, connection1) {
			if (err1) throw err1;

			connection1.query("UPDATE guild_preferences SET notificationRole_id = ? WHERE guild_id = ?", [msg.roleMentions[0], msg.channel.guild.id], function(error1, results1, fields1) {
				connection1.release();

				if (error1) throw error1;
				
				if (results1.affectedRows > 0) {
					msg.channel.createMessage({embed: {
						title: "Success",
						description: "The role <@&" + msg.roleMentions[0] + "> has been set to mention. Assign this role to be notified or use the `roleSignup` command to have the bot give an option for people to sign up (bot must have `Manage Roles` and `Add Reactions` permissions).",
						color: 0x00FF00
					}});
				} else {
					msg.channel.createMessage({embed: {
						title: "Warning",
						description: "The role <@&" + msg.roleMentions[0] + "> has not been set to mention. This is most likely because no channel was set using the `setChannel` command.",
						color: 0xFFFF00
					}});
				}
			});
		});
	} else {
		// No role mentioned. Clear role if exists
		pool.getConnection(function(err1, connection1) {
			if (err1) throw err1;

			connection1.query("UPDATE guild_preferences SET notificationRole_id = NULL WHERE guild_id = ?", [msg.channel.guild.id], function(error1, results1, fields1) {
				connection1.release();

				if (error1) throw error1;

				msg.channel.createMessage({embed: {
					title: "Success",
					description: "The bot will not mention any role when posting.",
					color: 0x00FF00
				}});
			});
		});
	}
}, {
	description: "Set the role for the bot to mention when posting.",
	fullDescription: "Set the role for the bot to mention when posting. If no role is mentioned in this command, the bot will not mention anyone when posting.",
	usage: "Mention the role using `@rolename` in this command",
	permissionMessage: "You must have the `Manage Roles` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageRoles": true
		}
	}
});
bot.registerCommandAlias("sr", "setRole");

bot.registerCommand("roleSignup", (msg, args) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("SELECT notificationRole_id FROM guild_preferences WHERE guild_id = ? AND notificationRole_id IS NOT NULL", [msg.channel.guild.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
			
			if (results1.length > 0) {
				msg.channel.createMessage("If you want to subscribe to notifications, click on the bell reaction. To unsubscribe, just simply remove your reaction (click on the reaction again).").then((message) => {
					message.addReaction("🔔");
					pool.getConnection(function(err1, connection1) {
						if (err1) throw err1;

						connection1.query("INSERT INTO notifMsgWatchlist (message_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE message_id=VALUES(message_id), channel_id=VALUES(channel_id)", [message.id, message.channel.id], function(error1, results1, fields1) {
							connection1.release();

							if (error1) throw error1;
						});
					});
				});
			} else {
				msg.channel.createMessage({embed: {
					title: "Error",
					description: "The bot must have a role set to mention to use this command. Please use `setRole` command first.",
					color: 0xFF0000
				}});
			}
		});
	});
}, {
	description: "Let the bot add role to people.",
	fullDescription: "Let the bot create a message that when people react to, will add the notification role to them.",
	usage: "Just type this command in whatever channel you want the message to appear in. It is suggested you pin the bot message afterwards.",
	permissionMessage: "You must have the `Manage Roles` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageRoles": true
		}
	}
});
bot.registerCommandAlias("rs", "roleSignup");

var showSearch = {};
const showWatch = bot.registerCommand("showWatch", (msg, args) => {
	tvdb.getSeriesByName(args.join(" ")).then(showSearchResponse => {
		if (showSearchResponse.length > 1) {
			// Multiple shows in search results
			var fieldsTemp = [];
			var series = [];
			showSearchResponse.splice(0, 25).forEach(function(showResult, searchIndex) {
				fieldsTemp.push({name: (searchIndex+1) + ": " + showResult.seriesName + " on " + showResult.network, value: showResult.overview.substring(0, 255), inline: true,});
				series.push(showResult.id);
			});
			
			msg.channel.createMessage({embed: {
				title: "Search results for " + args.join(" "),
				description: "Select a show by using the `select` subcommand. Ex: `showWatch select 1`",
				color: 0xFFFF00,
				footer: {
					text: "Show info and images from The TVDB",
				},
				fields: fieldsTemp
			}}).then((message) => {
				showSearch[message.channel.guild.id] = {msgId: message.id, chanId: message.channel.id, series: series};
			});
		} else {
			// Only 1
			tvdb.getSeriesImages(showSearchResponse[0].id, "poster").then(posterResponse => {
				const posterList = posterResponse.sort(function(a, b) {
					return (b.ratingsInfo.average - a.ratingsInfo.average);
				});
				jimp.read(tvdbImageBase + posterList[0].fileName, (err, sourceImage) => {
					if (err) console.error(err);
					// getColor(sourceImage[, quality])
					var dominantColor = colorThief.getColor(sourceImage, 1);
					// dominantColor = [intRed, intGreen, intBlue]
					
					msg.channel.createMessage({embed: {
						title: "Now watching for" + showSearchResponse[0].seriesName + " on " + showSearchResponse[0].network,
						description: showSearchResponse[0].overview,
						color: parseInt(rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]), 16),
						footer: {
							text: "Show info and images from The TVDB",
						},
						thumbnail: {
							url: tvdbImageBase + posterList[0].fileName,
						}
					}});
				});
			}).catch(posterError => {
				msg.channel.createMessage({embed: {
					title: "Now watching for" + showSearchResponse[0].seriesName + " on " + showSearchResponse[0].network,
					description: showSearchResponse[0].overview,
					color: 0x00FF00,
					footer: {
						text: "Show info and images from The TVDB",
					}
				}});
			});
			
			pool.getConnection(function(err1, connection1) {
				if (err1) throw err1;

				connection1.query("INSERT INTO guild_tvWatchlist SET ? ON DUPLICATE KEY UPDATE tvdbShow_id=VALUES(tvdbShow_id)", {guild_id: msg.channel.guild.id, tvdbShow_id: showSearchResponse[0].id}, function(error1, results1, fields1) {
					connection1.release();

					if (error1) throw error1;
				});
			});
		}
	}).catch(showSearchError => {
		console.error(showSearchError);
		msg.channel.createMessage({embed: {
			title: "Error " + showSearchError.response.status,
			description: "Content " + showSearchError.response.statusText + " for `" + args.join(" ") + "`",
			color: 0xFF0000,
			footer: {
				text: "Show info and images from The TVDB",
			}
		}});
	});
}, {
	argsRequired: true,
	errorMessage: "Please make sure you typed in a tv show name. Ex: `showWatch game of thrones`",
	description: "Search TV Shows to auto watch.",
	fullDescription: "Search for a TV Show to have the bot auto watch and post about.",
	usage: "`<show name>`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
bot.registerCommandAlias("sw", "showWatch");

showWatch.registerSubcommand("select", (msg, args) => {
	if (showSearch[msg.channel.guild.id]) {
		if (!isNaN(args.join(""))) {
			if (parseInt(args.join("")) > 0 && parseInt(args.join("")) <= showSearch[msg.channel.guild.id].series.length) {
				// Valid result #
				tvdb.getSeriesById(showSearch[msg.channel.guild.id].series[parseInt(args.join(""))-1]).then(seriesInfo => {
					tvdb.getSeriesImages(seriesInfo.id, "poster").then(posterResponse => {
						const posterList = posterResponse.sort(function(a, b) {
							return (b.ratingsInfo.average - a.ratingsInfo.average);
						});
						jimp.read(tvdbImageBase + posterList[0].fileName, (err, sourceImage) => {
							if (err) console.error(err);
							// getColor(sourceImage[, quality])
							var dominantColor = colorThief.getColor(sourceImage, 1);
							// dominantColor = [intRed, intGreen, intBlue]

							msg.channel.createMessage({embed: {
								title: "Now watching for" + seriesInfo.seriesName + " on " + seriesInfo.network,
								description: seriesInfo.overview,
								color: parseInt(rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]), 16),
								footer: {
									text: "Show info and images from The TVDB",
								},
								thumbnail: {
									url: tvdbImageBase + posterList[0].fileName,
								}
							}});
						});
					}).catch(posterError => {
						msg.channel.createMessage({embed: {
							title: "Now watching for" + seriesInfo.seriesName + " on " + seriesInfo.network,
							description: seriesInfo.overview,
							color: 0x00FF00,
							footer: {
								text: "Show info and images from The TVDB",
							}
						}});
					});
					
					pool.getConnection(function(err1, connection1) {
						if (err1) throw err1;
						
						connection1.query("INSERT INTO guild_tvWatchlist SET ? ON DUPLICATE KEY UPDATE tvdbShow_id=VALUES(tvdbShow_id)", {guild_id: msg.channel.guild.id, tvdbShow_id: showSearch[msg.channel.guild.id].series[parseInt(args.join(""))-1]}, function(error1, results1, fields1) {
							connection1.release();
							
							if (error1) throw error1;
						});
					});
				}).catch(seriesError => {
					msg.channel.createMessage({embed: {
						title: "Error " + seriesError.response.status,
						description: "Content " + seriesError.response.statusText + " for `" + args.join(" ") + "`",
						color: 0xFF0000,
						footer: {
							text: "Show info and images from The TVDB",
						}
					}});
				});
			} else {
				msg.channel.createMessage({embed: {
					title: "Error",
					description: "There is no result #`" + parseInt(args.join("")) + "`",
					color: 0xFF0000,
				}});
			}
		} else {
			msg.channel.createMessage({embed: {
				title: "Error",
				description: "`" + args.join("") + "` is not a number",
				color: 0xFF0000,
			}});
		}
	} else {
		msg.channel.createMessage({embed: {
			title: "Error",
			description: "There has been no recent search. Please search again. Ex: `showWatch game of thrones`",
			color: 0xFF0000,
		}});
	}
}, {
	argsRequired: true,
	errorMessage: "Please make sure you typed in a result number from the search results. Ex: `showWatch select 1`",
	description: "Choose result from search.",
	fullDescription: "Select a result from the search result list.",
	usage: "`<number or result>`",
	permissionMessage: "You must have the `Manage Channels` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageChannels": true
		}
	}
});
showWatch.registerSubcommandAlias("s", "select");
showWatch.registerSubcommandAlias("pick", "select");
showWatch.registerSubcommandAlias("p", "select");

// Message watchlist
bot.on("messageReactionAdd", (message, emoji, userID) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("SELECT message_id FROM notifMsgWatchlist WHERE message_id = ? AND channel_id = ?", [message.id, message.channel.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
			
			if (results1.length > 0) {
				// Message is in watch list. Find out guild and add role
				pool.getConnection(function(err2, connection2) {
					if (err2) throw err2;
					
					connection2.query("SELECT notificationRole_id FROM guild_preferences WHERE guild_id = ?", [message.channel.guild.id], function(error2, resutls2, fields2) {
						connection2.release();

						if (error2) throw error1;
						
						bot.addGuildMemberRole(message.channel.guild.id, userID, resutls2[0].notificationRole_id);
					});
				});
			}
		});
	});
});
bot.on("messageReactionRemove", (message, emoji, userID) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("SELECT message_id FROM notifMsgWatchlist WHERE message_id = ? AND channel_id = ?", [message.id, message.channel.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
			
			if (results1.length > 0) {
				// Message is in watch list. Find out guild and remove role
				pool.getConnection(function(err2, connection2) {
					if (err2) throw err2;
					
					connection2.query("SELECT notificationRole_id FROM guild_preferences WHERE guild_id = ?", [message.channel.guild.id], function(error2, resutls2, fields2) {
						connection2.release();

						if (error2) throw error1;
						
						bot.removeGuildMemberRole(message.channel.guild.id, userID, resutls2[0].notificationRole_id);
					});
				});
			}
		});
	});
});

// Remove guild from preferences if deleted
bot.on("guildDelete", (guild) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("DELETE FROM guild_preferences WHERE guild_id = ?", [guild.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
		});
	});
});

// Remove channel from preferences if deleted
bot.on("channelDelete", (channel) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("DELETE FROM guild_preferences WHERE guild_id = ? AND textChannel_id = ?", [channel.guild.id, channel.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
		});
	});
});

// Remove role from preferences if deleted
bot.on("guildRoleDelete", (guild, role) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("UPDATE guild_preferences WHERE guild_id = ? AND notificationRole_id = ?", [guild.id, role.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
		});
	});
});

// Stop watching for messages if message is deleted
bot.on("messageDelete", (message) => {
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;

		connection1.query("DELETE FROM notifMsgWatchlist WHERE channel_id = ? AND message_id = ?", [message.channel.id, message.id], function(error1, results1, fields1) {
			connection1.release();

			if (error1) throw error1;
		});
	});
});
// Stop watching for messages if message is deleted
bot.on("messageDeleteBulk", (messages) => {
	// Manual for loop to wait for async commands
	var messageCounter = 0;
	function messageStepper(message) {
		pool.getConnection(function(err1, connection1) {
			if (err1) throw err1;

			connection1.query("DELETE FROM notifMsgWatchlist WHERE channel_id = ? AND message_id = ?", [message.channel.id, message.id], function(error1, results1, fields1) {
				connection1.release();

				if (error1) throw error1;
				
				messageCounter++;
				if (messageCounter < messages.length) {
					messageStepper(messages[messageCounter]);
				}
			});
		});
	}
	// First time
	messageStepper(messages[messageCounter]);
});

function rgbToHex(r, g, b) {
	return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}