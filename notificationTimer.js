let dayEpisodeTimers = [];

const mysql = require("mysql").createPool({
	connectionLimit: process.env.MYSQL_CONNLIMIT,
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD,
	database: process.env.MYSQL_DATABASE,
	supportBigNumbers: false,
});

function loadDayEpisodes() {
	mysql.getConnection(function (err1, connection1) {
		if (err1) throw err1;

		connection1.query('SELECT gp.textChannel_id, gp.notificationRole_id, gwl.guild_id, gwl.tvdbShow_id FROM guild_tvWatchlist gwl JOIN guild_preferences gp ON (gwl.guild_id = gp.guild_id)', function () {

		}).on('error', function (error1) {
			if (error1) throw error1;
		}).on('result', function (row) {
			connection1.pause();
			connection1.resume();
		}).on('end', function () {
			connection1.release();
		});
	});
}
// Run at launch
loadDayEpisodes();
// Run every 24 hours from now on
setInterval(loadDayEpisodes(), 1 * 24 * 60 * 60 * 1000);