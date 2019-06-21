const secretKeys = require("./secret-keys.js");
const { CommandClient } = require("eris");

const bot = new CommandClient(secretKeys.botToken, {
	compress: true
}, {
	defaultCommandOptions: {
		caseInsensitive: true,
		deleteCommand: true,
		guildOnly: true
	}
});

bot.connect();

bot.on('warn', (message, id) => {
	console.warn(message);
});

bot.on('error', (err, id) => {
	throw err;
});

const mysql = require("mysql").createPool({
	connectionLimit: 50,
	host: secretKeys.dbHost,
	user: secretKeys.dbUser,
	password: secretKeys.dbPass,
	database: secretKeys.dbDb,
	supportBigNumbers: false,
});

bot.on('ready', () => {
	console.info("TV Bot Ready!");
	bot.editStatus('idle', null);
});

const workerThreadsPool = require('worker-threads-pool');

const wtPool = new workerThreadsPool({ max: require('os').cpus().length });