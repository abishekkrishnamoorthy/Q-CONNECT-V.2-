// d:\projects\QCONNECT(V2.0)\frontend\src\store\authStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Zustand store for authentication and onboarding state.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: "qconnect-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);
