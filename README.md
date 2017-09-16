# DimiDimitBot
My bot on Discord. Has many functions, still in beta.

## Invite it to your server
To invite this bot to your server, click [here](https://discordapp.com/oauth2/authorize?client_id=357542810099908618&scope=bot&permissions=2146958591). It currently asks for all permissions because it's in beta. When I finish it, it will only ask for the ones it needs.

**WARNING:** This bot *may* be private. I keep changing that so try your luck. If not, try later.

## Run its code on your bot
**NOTE:** This project requires Node.js 8 (harmony). It has been tested on version 8.5.0.

**NOTE:** This requires you to set up a Discord application and link a bot to it. To do this, click [here](https://discordapp.com/developers/applications/me) and click `Create App`. Enter its name, optionally add an icon and description and click `Create App`. Click on `Create a Bot User` and confirm. Then in the Bot User section find where it says token and click on `click to reveal` next to it. Copy the token and paste it in `bot-token.txt`, overwriting its contents. **DANGER:** if someone learns your code they can decide what your bot should do. So never share it!!!

To run this bot's code on your bot, clone the project and type in its root directory:

```shell
node --harmony .
```
