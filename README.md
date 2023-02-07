# Discord CAPTCHA Site

A powerful, advanced captcha verification system for new members in a Discord server.

## Technologies Used

- [Google reCAPTCHA v2](https://developers.google.com/recaptcha/docs/display) API
- [Node.js](https://nodejs.org)
- [NPM](https://npmjs.com)
- [Express](https://expressjs.com)
- [Discord.js](https://discord.js.org)

## System Requirements

- Node.js version 16.9.0 or later (**Recommended:** Latest LTS)
- NPM version 7.0 or later (**Recommended:** Latest)
- A Discord Application with a bot account
- A Google reCAPTCHA v2 API key

## Installation

1. Clone the repository
2. Install the dependencies with `npm install` or `yarn`

## Environment Variables

- `PORT` - The port to run the server on (default: `3000`)
- `TOKEN` - The **token** of your Discord bot (Bot -> Token)
- `CLIENT_ID` - The client ID of your Discord application (Oauth2 -> General -> Client ID)
- `CLIENT_SECRET` - The client secret of your Discord application (Oauth2 -> General -> Client Secret)
- `SERVER_ID` - The ID of the Discord your server (Right click on the server -> Copy ID)
- `CALLBACK_URL` - The URL of the server `https://[your domain]/verify` (e.g. `https://example.com/verify`)
- `REQUIRE_VERIFIED_EMAIL` - Whether to require a verified email address for the user to pass the captcha (default: `false`)
- `VERIFIED_ROLE_ID` - The ID of the role to give to the user after they pass the captcha (Right click on the role -> Copy ID)

> Register new Recaptcha v2 API key [here](https://www.google.com/recaptcha/admin/create)

- `RECAPTCHA_SITEKEY` - The site key of your Google reCAPTCHA v2 API key (Settings -> reCAPTCHA keys -> Copy Site key)
- `RECAPTCHA_SECRET` - The secret key of your Google reCAPTCHA v2 API key (Settings -> reCAPTCHA keys -> Copy Secret key)

## Usage

1. Start the server with `npm start` or `yarn start`
2. Add the bot to your server with `https://discord.com/api/oauth2/authorize?client_id=[CLIENT_ID]&permissions=8&scope=bot%20applications.commands`
3. In `Oauth2 -> Redirects` add the callback URL `https://[your domain]/verify` (e.g. `https://example.com/verify`)
4. Adding the bot to your server will automatically create a new role called `Verified` and a new channel called `#verify`
5. The bot will automatically send a message in the `#verify` channel with a link to the captcha verification page
6. The user will have to complete the captcha
7. After the user completes the captcha, they will be given the `Verified` role and notified in the DMs

## Production Deployment

1. Install [PM2](https://pm2.keymetrics.io) with `npm install pm2 -g` or `yarn global add pm2`
2. Start the server with `pm2 start ecosystem.config.js`
3. Run command `pm2 start --max-memory-restart 300M --attach npm -- run start`
4. (Optional) Run command `pm2 startup` to enable startup on boot

# Screenshots

## Captcha Verification Page

![Captcha Verification Page](./screenshots/verify-page.png)

## FAQ

1. **What is ZodError?**

```bash
ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "REQUIRE_VERIFIED_EMAIL"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "VERIFIED_ROLE_ID"
    ],
    "message": "Required"
  }
]
```

This error is caused by missing environment variables. Make sure you have set all the environment variables correctly and **add environment variables following to the `path` in the error message.**

From the example above, you need to add `REQUIRE_VERIFIED_EMAIL` and `VERIFIED_ROLE_ID` to the environment variables.

Please follow the [Environment Variables](#environment-variables) section for more information.
