const { z } = require('zod');

const EnvironmentVariableSchema = z.object({
  TOKEN: z.string(),
  CLIENT_SECRET: z.string(),
  CALLBACK_URL: z.string(),

  RECAPTCHA_SITEKEY: z.string(),
  RECAPTCHA_SECRET: z.string(),

  SERVER_ID: z.string(),

  REQUIRE_VERIFIED_EMAIL: z.string(),
  VERIFIED_ROLE_ID: z.string(),
});

EnvironmentVariableSchema.parse(process.env);

module.exports = { EnvironmentVariableSchema };
