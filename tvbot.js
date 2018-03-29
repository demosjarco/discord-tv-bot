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
	
}, {
	description: "",
	fullDescription: "",
	usage: "",
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