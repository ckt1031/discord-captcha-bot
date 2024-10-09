import { type Output } from 'valibot';
import { EnvironmentVariableSchema } from './validate-env';

declare global {
  namespace NodeJS {
    type ProcessEnv = Output<typeof EnvironmentVariableSchema>;
  }
}

declare module 'express-session' {
  export interface SessionData {
    verify_userid: string;
    verify_status: 'waiting_captcha' | 'done';
  }
}
