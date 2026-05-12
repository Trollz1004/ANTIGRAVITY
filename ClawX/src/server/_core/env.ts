export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

// Named as ENV to match existing server import: `import { ENV } from './_core/env'`
export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-secret',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ?? '',
  PORT: parseInt(process.env.PORT ?? '8080', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  ownerOpenId: process.env.OWNER_OPEN_ID ?? '',
};

/** Alias for convenience */
export const env = ENV;
