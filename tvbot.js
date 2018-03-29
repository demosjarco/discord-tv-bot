const Eris = require("eris");
const mysql = require("mysql");
const secretKeys = require("./secret-keys.js");

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
});
bot.on("error", (err, id) => {
	console.error(err);
	bot.disconnect({reconnect: "auto"});
});

bot.connect();

bot.registerCommand("setChannel", (msg, args) => {
	// Check if user mentioned a channel
	var channel = "";
	if (msg.channelMentions) {
		// User mentioned a channel. Use that channel
		channel = msg.channelMentions[0];
	} else {
		// No channel mentioned. Use current channel message is in
		channel = msg.channel.id;
	}
	pool.getConnection(function(err1, connection1) {
		if (err1) throw err1;
		
		connection1.query("INSERT INTO guild_preferences (guild_id, textChannel_id) VALUES (?, ?)", [msg.channel.guild.id, channel], function(error1, results1, fields1) {
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

bot.registerCommand("setRole", (msg, args) => {
	
}, {
	description: "",
	fullDescription: "",
	usage: "",
	permissionMessage: "You must have the `Manage Roles` permission or higher to use this command",
	requirements: {
		permissions: {
			"manageRoles": true
		}
	}
});
bot.registerCommandAlias("sr", "setRole");