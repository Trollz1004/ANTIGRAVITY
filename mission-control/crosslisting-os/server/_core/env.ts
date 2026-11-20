export const DEFAULT_STORAGE_DIR =
  "mission-control/crosslisting-os/data/uploads";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  get storageDir(): string {
    return process.env.STORAGE_DIR?.trim() || DEFAULT_STORAGE_DIR;
  },
  apiBaseUrl:
    process.env.OPENAI_BASE_URL ?? process.env.OMNIROUTE_BASE_URL ?? "",
  apiKey: process.env.OPENAI_API_KEY ?? process.env.OMNIROUTE_API_KEY ?? "",
};
