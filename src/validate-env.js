const { object, parse, string } = require('valibot');

const EnvironmentVariableSchema = object({
  TOKEN: string(),
  CLIENT_SECRET: string(),
  CALLBACK_URL: string(),

  RECAPTCHA_SITEKEY: string(),
  RECAPTCHA_SECRET: string(),

  SERVER_ID: string(),

  REQUIRE_VERIFIED_EMAIL: string(),
  VERIFIED_ROLE_ID: string(),
});

parse(EnvironmentVariableSchema, process.env);

module.exports = { EnvironmentVariableSchema };
