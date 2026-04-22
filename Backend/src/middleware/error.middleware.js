// d:\projects\QCONNECT(V2.0)\Backend\src\middleware\error.middleware.js
import { ZodError } from "zod";
import { config } from "../config/index.js";

/**
 * Creates a normalized application error.
 * @param {string} message
 * @param {number} statusCode
 * @param {string} code
 * @param {unknown} [details]
 * @returns {Error & {statusCode:number,code:string,details?:unknown}}
 */
export function createAppError(message, statusCode, code, details) {
  const error = new Error(message);
  // @ts-expect-error status extension
  error.statusCode = statusCode;
  // @ts-expect-error code extension
  error.code = code;
  // @ts-expect-error details extension
  error.details = details;
  return /** @type {Error & {statusCode:number,code:string,details?:unknown}} */ (error);
}

/**
 * Express centralized error handler.
 * @param {unknown} err
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 * @returns {void}
 */
export function errorMiddleware(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    const summary = firstIssue?.message || "Invalid request payload";
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        summary,
        details: err.flatten()
      }
    });
    return;
  }

  const multerError = /** @type {{name?:string,code?:string,message?:string}} */ (err);
  if (multerError.name === "MulterError" && multerError.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      error: {
        code: "INVALID_IMAGE_SIZE",
        message: "Profile image must be at most 5MB"
      }
    });
    return;
  }

  const known = /** @type {{statusCode?:number,code?:string,message?:string,details?:unknown}} */ (err);
  const statusCode = known.statusCode || 500;
  const code = known.code || "INTERNAL_ERROR";
  const message = known.message || "Something went wrong";

  const body = {
    error: {
      code,
      message,
      ...(config.nodeEnv !== "production" && known.details ? { details: known.details } : {})
    }
  };

  res.status(statusCode).json(body);
}
