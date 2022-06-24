# discord-reCAPTCHA

This is an advanced reCaptcha verification system for new members in discord server.

## Requirements!

- NodeJS verson with 16.9.0 or later
- NPM version with 7.0 or later
- A Discord Application with bot account
- Google reCAPTCHA v2 API

## Config

`config.json` options

```
{
  "server_id"               : String - Your Server ID.
  "verified_email_required" : Boolean - Default true. Reqirement of user with verified email.
  "dark_theme"              : String - Default false, set true for dark theme.
  "verifiedrole_id"         : String - Your Server Verified Role ID.
  "client_id"               : String - Your Client ID.
  "callback_url"            : url - Your website url. Example: "https://example.com/verify"
}
```

`.env` options (without any spaces, new value to new line)

```
TOKEN=
CLIENT_SECRET=
RECAPTCHA_SITEKEY=
RECAPTCHA_SECRET=
```

## Setup Steps

Coming soon...
