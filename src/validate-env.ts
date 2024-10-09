import 'dotenv/config';
import { object, parse, string, enum_, optional } from 'valibot';

// As TypeScript enum
enum CaptchaProvider {
  HCAPTCHA = 'hcaptcha',
  RECAPTCHA = 'recaptcha',
  TURNSTILE = 'turnstile',
}

const EnvironmentVariableSchema = object({
  TOKEN: string(),
  CLIENT_SECRET: string(),
  CALLBACK_URL: string(),

  CAPTCHA_PROVIDER: enum_(CaptchaProvider),

  RECAPTCHA_SITEKEY: optional(string()),
  RECAPTCHA_SECRET: optional(string()),

  HCAPTCHA_SITEKEY: optional(string()),
  HCAPTCHA_SECRET: optional(string()),

  TURNSTILE_SECRET: optional(string()),
  TURNSTILE_SITEKEY: optional(string()),

  SERVER_ID: string(),

  REQUIRE_VERIFIED_EMAIL: string(),
  VERIFIED_ROLE_ID: string(),

  PORT: optional(string()),
});

const env = parse(EnvironmentVariableSchema, process.env);

export { env, EnvironmentVariableSchema };
