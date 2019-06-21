const workerThreadsPool = require('worker-threads-pool');
const wtPool = new workerThreadsPool({ max: require('os').cpus().length });

wtPool.acquire('./notificationTimer.js', function (err, worker) {
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

const secretKeys = require('./secret-keys.js');
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

bot.on('ready', () => {
	console.info("TV Bot Ready!");
	bot.editStatus('idle', null);
});