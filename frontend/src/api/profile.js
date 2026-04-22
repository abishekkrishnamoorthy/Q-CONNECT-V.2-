// d:\projects\QCONNECT(V2.0)\frontend\src\api\profile.js
import { httpClient } from "./httpClient";

export const profileApi = {
  checkUsername: async (username) => {
    const { data } = await httpClient.get("/api/profile/check-username", {
      params: { username }
    });
    return data;
  },
  suggestTopics: async (selectedDomains) => {
    const { data } = await httpClient.post("/api/profile/suggest-topics", {
      selectedDomains
    });
    return data;
  },
  setupProfile: async (payload) => {
    // Handling form data mapping for file uploads
    const formData = new FormData();
    formData.append("username", payload.username);
    if (payload.bio) formData.append("bio", payload.bio);
    if (payload.tagline) formData.append("tagline", payload.tagline);
    if (payload.banner) formData.append("banner", payload.banner);
    if (payload.dob) formData.append("dob", payload.dob);
    
    // Important: send interests as JSON string
    formData.append("interests", JSON.stringify(payload.interests || []));
    
    // If it's a File object
    if (payload.profileImage && payload.profileImage instanceof File) {
      formData.append("profileImage", payload.profileImage);
    } else if (typeof payload.profileImage === "string" && payload.profileImage !== "") {
      formData.append("profileImageStr", payload.profileImage); // If passing existing string URL
    }

    const { data } = await httpClient.post("/api/profile/setup", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },
  me: async () => {
    const { data } = await httpClient.get("/api/profile/me");
    return data;
  }
};
