# discord-reCAPTCHA
This is an advanced reCaptcha verification system for new members in discord server.

## Requirements!
- NodeJS v12 Server
- A Discord Application with bot account
- Google reCAPTCHA v2 API

## Config

`config.json` options
```
{
  "server_id"               : String - Your Server ID.
  "verified_email_required" : Boolean - Default true. Reqirement of user with verified email.
  "dark_theme"              : String - "light" or "dark" in verify page theme.
  "verifiedrole_id"         : String - Your Server Verified Role ID.
  "client_id"               : String - Your Client ID.
  "domain"                  : url - Your website url. Example: "https://example.com"
  "custom_dir"              : Boolean - Default null, set "verify" if you want verification page url to example.com/verify.
}
```
`.env` options (without any spaces, new value to new line)
```
TOKEN=
CLIENT_SECRET=
```

## Setup Steps
