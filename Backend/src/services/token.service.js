// d:\projects\QCONNECT(V2.0)\Backend\src\services\token.service.js
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { config } from "../config/index.js";

const revokedJti = new Map();

/**
 * Generates SHA-256 hash in hex format.
 * @param {string} value
 * @returns {string}
 */
export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Issues a signed short-lived access token.
 * @param {{id:string,email:string}} user
 * @returns {{token:string,jti:string}}
 */
export function issueAccessToken(user) {
  const jti = randomUUID();
  const token = jwt.sign({ sub: user.id, email: user.email, jti }, config.jwtSecret, { expiresIn: "15m" });
  return { token, jti };
}

/**
 * Issues a signed refresh token and returns expiry date.
 * @param {{id:string,email:string}} user
 * @returns {{token:string,expiresAt:Date}}
 */
export function issueRefreshToken(user) {
  const token = jwt.sign({ sub: user.id, email: user.email, jti: randomUUID() }, config.jwtRefreshSecret, {
    expiresIn: "7d"
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, expiresAt };
}

/**
 * Verifies an access token and returns payload.
 * @param {string} token
 * @returns {{sub:string,email:string,jti:string,iat:number,exp:number}}
 */
export function verifyAccessToken(token) {
  return /** @type {{sub:string,email:string,jti:string,iat:number,exp:number}} */ (
    jwt.verify(token, config.jwtSecret)
  );
}

/**
 * Verifies a refresh token and returns payload.
 * @param {string} token
 * @returns {{sub:string,email:string,jti:string,iat:number,exp:number}}
 */
export function verifyRefreshToken(token) {
  return /** @type {{sub:string,email:string,jti:string,iat:number,exp:number}} */ (
    jwt.verify(token, config.jwtRefreshSecret)
  );
}

/**
 * Adds a JTI to in-memory revocation list until token expiry.
 * @param {string} jti
 * @param {number} exp Unix seconds
 * @returns {void}
 */
export function revokeJti(jti, exp) {
  const expiryMs = exp * 1000;
  revokedJti.set(jti, expiryMs);
}

/**
 * Checks whether a JTI is revoked.
 * @param {string} jti
 * @returns {boolean}
 */
export function isJtiRevoked(jti) {
  const now = Date.now();
  for (const [key, expiryMs] of revokedJti.entries()) {
    if (expiryMs <= now) {
      revokedJti.delete(key);
    }
  }
  return revokedJti.has(jti);
}
