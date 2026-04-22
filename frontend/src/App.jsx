import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { authApi } from "./api/auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import FeedDemoPage from "./pages/FeedDemoPage";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import VerifyPage from "./pages/VerifyPage";
import { useAuthStore } from "./store/authStore";

function ProfileRouteGate({ children }) {
  const user = useAuthStore((state) => state.user);

  if (user?.isProfileComplete) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function HomeRouteGate({ children }) {
  const user = useAuthStore((state) => state.user);

  if (!user?.isProfileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}

/**
 * Application route tree for auth, onboarding, and home feed.
 */
export default function App() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        return;
      }
      try {
        const result = await authApi.me();
        setUser(result.user);
      } catch {
        logout();
      }
    };

    hydrate();
  }, [logout, setUser, token]);

  const authedLanding = user?.isProfileComplete ? "/home" : "/profile-setup";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? authedLanding : "/login"} replace />} />
      <Route path="/login" element={token ? <Navigate to={authedLanding} replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to={authedLanding} replace /> : <LoginPage defaultTab="register" />} />
      <Route path="/verify" element={token ? <Navigate to={authedLanding} replace /> : <VerifyPage />} />
      <Route path="/feed-demo" element={<FeedDemoPage />} />

      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileRouteGate>
              <ProfileSetupPage />
            </ProfileRouteGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomeRouteGate>
              <MainLayout />
            </HomeRouteGate>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={token ? authedLanding : "/login"} replace />} />
    </Routes>
  );
}

