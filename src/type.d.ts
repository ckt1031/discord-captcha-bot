import { type Output } from 'valibot';
import { EnvironmentVariableSchema } from './validate-env';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends Output<typeof EnvironmentVariableSchema> {}
  }
}

declare module 'express-session' {
  export interface SessionData {
    verify_userid: string;
    verify_status: 'waiting_recaptcha' | 'done';
  }
}
