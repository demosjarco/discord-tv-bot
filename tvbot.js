"use strict";

require('dotenv').config();
const { SHARE_ENV } = require('worker_threads');
const workerThreadsPool = require('worker-threads-pool');
const wtPool = new workerThreadsPool({ max: require('os').cpus().length });

wtPool.acquire('./notificationTimer.js', { env: SHARE_ENV }, function (err, worker) {
	if (err) throw err;
	worker.on('message', function (value) {
		console.log(value);
	});
	worker.on('error', function (error) {
		console.error(error);
	});
	worker.on('exit', (code) => {
		if (code !== 0)
			console.error('notificationTimer.js exited with code ' + code);
	});
});

const { CommandClient } = require("eris");

const bot = new CommandClient(process.env.DISCORD_BOTTOKEN, {
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

bot.on('ready', () => {
	console.info("TV Bot Ready!");
	bot.editStatus('idle', null);
});