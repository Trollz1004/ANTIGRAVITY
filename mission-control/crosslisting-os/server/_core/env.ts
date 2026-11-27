export const DEFAULT_DATABASE_PATH = "data/crosslisting.sqlite3";
export const DEFAULT_STORAGE_DIR =
  "mission-control/crosslisting-os/data/uploads";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  get databaseUrl(): string {
    return process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_PATH;
  },
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  get storageDir(): string {
    return process.env.STORAGE_DIR?.trim() || DEFAULT_STORAGE_DIR;
  },
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
