export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/business_exchange?schema=public',
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars-long',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SESSION_COOKIE_NAME: 'be_session',
  
  // Ollama Cloud
  OLLAMA_CLOUD_API_KEY: process.env.OLLAMA_CLOUD_API_KEY || '',
  OLLAMA_CLOUD_BASE_URL: process.env.OLLAMA_CLOUD_BASE_URL || 'https://ollama.com/api',
  OLLAMA_CLOUD_MODEL: process.env.OLLAMA_CLOUD_MODEL || 'gemma3:27b',
  
  // Email (for admin notifications, verification)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@businessexchange.local',
  ADMIN_ALERT_EMAIL: process.env.ADMIN_ALERT_EMAIL,
  
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Security
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100,
};

export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key] && !env[key as keyof typeof env]);
  
  if (missing.length > 0 && env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}