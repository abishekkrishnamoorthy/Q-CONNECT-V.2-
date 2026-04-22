// d:\projects\QCONNECT(V2.0)\frontend\src\api\auth.js
import { httpClient } from "./httpClient";

/**
 * Auth API client methods.
 */
export const authApi = {
  register: async (payload) => {
    const normalizedPayload = {
      email: String(payload.email || "").trim().toLowerCase(),
      password: String(payload.password || "")
    };
    const { data } = await httpClient.post("/auth/register", normalizedPayload);
    return data;
  },
  login: async (payload) => {
    const { data } = await httpClient.post("/auth/login", payload);
    return data;
  },
  oauthGoogle: async (payload) => {
    const { data } = await httpClient.post("/auth/oauth", payload);
    return data;
  },
  verify: async (token) => {
    const { data } = await httpClient.get("/auth/verify", { params: { token } });
    return data;
  },
  resend: async (email) => {
    const { data } = await httpClient.post("/auth/resend", { email });
    return data;
  },
  checkStatus: async (email) => {
    const { data } = await httpClient.get("/auth/checkstatus", {
      headers: { "x-user-email": email }
    });
    return data;
  },
  me: async () => {
    const { data } = await httpClient.get("/auth/me");
    return data;
  },
  logout: async () => {
    const { data } = await httpClient.post("/auth/logout");
    return data;
  }
};
