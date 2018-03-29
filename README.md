# Discord TV Bot

## Installation

### Requirements
* Node JS 8+ (Tested with v9.10.0)
* MySQL 5.5+ (Tested with v5.7)

1. Install Node JS 8+ and MySQL 5.5+ (I have personally tested everything works with current LTS versions at time of writing).
2. Create MySQL schema for this bot and run `dbinit.sql` to create needed tables.
3. Create Discord Application and create a bot user for that application (link below).
4. Create TVDB account and create a project to get API Key (link below).
5. Remove `.sample` from `secret-keys.js.sample` and fill in info (See below for information on what is what).
6. Run bot `node tvbot.js`

#### secret-keys.js
> `botToken` is the discord bot token [Create Discord Application](https://discordapp.com/developers/applications/me/create)

> `dbHost` is the MySQL server host url

> `dbUser` is the MySQL user

> `dbPass` is the MySQL password

> `dbDb` is the MySQL server host url

> `tvdbKey` is the API Key for your TheTVDB [Register project for API](https://www.thetvdb.com/?tab=apiregister)