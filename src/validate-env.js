const { object, parse, string, enum_, optional } = require('valibot');

const EnvironmentVariableSchema = object({
  TOKEN: string(),
  CLIENT_SECRET: string(),
  CALLBACK_URL: string(),

  CAPTCHA_PROVIDER: enum_(['hcaptcha', 'recaptcha', 'turnstile']),

  RECAPTCHA_SITEKEY: optional(string()),
  RECAPTCHA_SECRET: optional(string()),

  HCAPTCHA_SITEKEY: optional(string()),
  HCAPTCHA_SECRET: optional(string()),

  TURNSTILE_SECRET: optional(string()),
  TURNSTILE_SITEKEY: optional(string()),

  SERVER_ID: string(),

  REQUIRE_VERIFIED_EMAIL: string(),
  VERIFIED_ROLE_ID: string(),
});

parse(EnvironmentVariableSchema, process.env);

module.exports = { EnvironmentVariableSchema };
