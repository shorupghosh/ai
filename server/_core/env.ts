export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Validate critical environment variables at startup
if (!ENV.cookieSecret) {
  console.error("[Security] CRITICAL: JWT_SECRET is not set! Session tokens will be insecure.");
  if (ENV.isProduction) {
    throw new Error("JWT_SECRET must be set in production");
  }
}

if (!ENV.databaseUrl) {
  console.warn("[Database] DATABASE_URL is not set. Database features will be unavailable.");
}

