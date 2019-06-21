# Discord TV Bot

## Installation

### Requirements
* Node JS 10.5+ (Tested with v12.4.0)
* Install Node JS 10.5+ and MySQL 5.5+ (If you are using Node JS earlier than 11.7, you need to run it with `--experimental-workers`).

1. Install Node JS 10.5+ and MySQL 5.5+.
2. Create MySQL schema for this bot and run `dbinit.sql` to create needed tables.
3. Create Discord Application and create a bot user for that application (link below).
4. Create TVDB account and create a project to get API Key (link below).
5. Remove `.sample` from `secret-keys.js.sample` and fill in info (See below for information on what is what).
6. Run bot `node start`

#### secret-keys.js
> `botToken` is the discord bot token [Create Discord Application](https://discordapp.com/developers/applications/me/create)

> `dbHost` is the MySQL server host url

> `dbUser` is the MySQL user

> `dbPass` is the MySQL password

> `dbDb` is the MySQL server host url

> `tvdbKey` is the API Key for your TheTVDB [Register project for API](https://www.thetvdb.com/?tab=apiregister)
