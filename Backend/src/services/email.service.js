// d:\projects\QCONNECT(V2.0)\Backend\src\services\email.service.js
import axios from "axios";
import { config } from "../config/index.js";

/**
 * Checks Brevo integration configuration and lightweight API connectivity.
 * @returns {Promise<{configured:boolean,reachable:boolean,message:string}>}
 */
export async function checkEmailConnectivity() {
  if (!config.brevoApiKey || !config.emailUser) {
    return {
      configured: false,
      reachable: false,
      message: "Email service is not configured"
    };
  }

  try {
    await axios.get("https://api.brevo.com/v3/account", {
      headers: {
        "api-key": config.brevoApiKey
      },
      timeout: 8000
    });

    return {
      configured: true,
      reachable: true,
      message: "Email provider connectivity is reachable"
    };
  } catch (error) {
    const err = /** @type {{response?:{status?:number}}} */ (error);
    const status = err.response?.status;
    const statusText = status ? ` (status ${status})` : "";
    return {
      configured: true,
      reachable: false,
      message: `Email provider connectivity is unreachable${statusText}`
    };
  }
}

/**
 * Sends a verification email using Brevo transactional API.
 * @param {{toEmail:string,verificationUrl:string}} payload
 * @returns {Promise<void>}
 */
export async function sendVerificationEmail(payload) {
  if (!config.brevoApiKey || !config.emailUser) {
    const configError = new Error("Email verification is not configured");
    // @ts-expect-error attach status for error middleware
    configError.statusCode = 503;
    // @ts-expect-error attach code for error middleware
    configError.code = "EMAIL_SERVICE_NOT_CONFIGURED";
    throw configError;
  }

  const body = {
    sender: { email: config.emailUser, name: "Qconnect" },
    to: [{ email: payload.toEmail }],
    subject: "Verify your Qconnect account",
    htmlContent: `<p>Welcome to Qconnect.</p><p>Click to verify your email:</p><p><a href=\"${payload.verificationUrl}\">Verify Email</a></p>`,
    textContent: `Verify your Qconnect account: ${payload.verificationUrl}`
  };

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", body, {
      headers: {
        "api-key": config.brevoApiKey,
        "content-type": "application/json"
      },
      timeout: 10000
    });
  } catch (error) {
    const err = /** @type {{response?:{status?:number,data?:unknown}}} */ (error);
    const status = err.response?.status || 500;
    const emailError = new Error("Unable to send verification email");
    // @ts-expect-error attach status for error middleware
    emailError.statusCode = status >= 400 && status < 500 ? 502 : 500;
    // @ts-expect-error attach code for error middleware
    emailError.code = "BREVO_SEND_FAILED";
    throw emailError;
  }
}
