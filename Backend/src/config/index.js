// d:\projects\QCONNECT(V2.0)\Backend\src\config\index.js
import "dotenv/config";
import process from "node:process";

const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "BACKEND_BASE_URL",
  "CLIENT_ORIGIN",
  "PORT",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

const OPTIONAL_AT_STARTUP_ENV_VARS = ["GOOGLE_CLIENT_ID", "BREVO_API_KEY", "EMAIL_USER"];

/**
 * Validates required environment variables and returns normalized config.
 * @returns {{mongoUri:string,jwtSecret:string,jwtRefreshSecret:string,googleClientId:string,brevoApiKey:string,emailUser:string,backendBaseUrl:string,clientOrigin:string,port:number,nodeEnv:string,cookieSecure:boolean,cloudinaryCloudName:string,cloudinaryApiKey:string,cloudinaryApiSecret:string}}
 */
export function loadConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || !String(process.env[key]).trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  const port = Number(process.env.PORT);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("PORT must be a valid positive number");
  }

  const missingOptional = OPTIONAL_AT_STARTUP_ENV_VARS.filter(
    (key) => !process.env[key] || !String(process.env[key]).trim()
  );
  if (missingOptional.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `Optional env vars missing at startup: ${missingOptional.join(
        ", "
      )}. Related endpoints will return config errors until set.`
    );
  }

  return {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    brevoApiKey: process.env.BREVO_API_KEY || "",
    emailUser: process.env.EMAIL_USER || "",
    backendBaseUrl: process.env.BACKEND_BASE_URL,
    clientOrigin: process.env.CLIENT_ORIGIN,
    port,
    nodeEnv,
    cookieSecure: nodeEnv === "production",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET
  };
}

/**
 * Normalized application configuration object.
 * @type {ReturnType<typeof loadConfig>}
 */
export const config = loadConfig();
