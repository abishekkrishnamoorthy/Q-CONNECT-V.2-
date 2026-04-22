// d:\projects\QCONNECT(V2.0)\frontend\src\api\users.js
import { httpClient } from "./httpClient";

/**
 * User onboarding API methods.
 */
export const usersApi = {
  me: async () => {
    const { data } = await httpClient.get("/users/me");
    return data;
  },
  checkUsername: async (username) => {
    const { data } = await httpClient.get("/users/username-availability", {
      params: { username }
    });
    return data;
  },
  setupProfile: async (payload) => {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("username", payload.username);
    if (payload.bio) {
      formData.append("bio", payload.bio);
    }
    formData.append("interestedTopics", JSON.stringify(payload.interestedTopics || []));
    if (payload.profilePic) {
      formData.append("profilePic", payload.profilePic);
    }

    const { data } = await httpClient.patch("/users/profile-setup", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  }
};
