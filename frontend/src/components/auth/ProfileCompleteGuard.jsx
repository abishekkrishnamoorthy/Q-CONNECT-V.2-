// d:\projects\QCONNECT(V2.0)\frontend\src\components\auth\ProfileCompleteGuard.jsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Guard that renders children only when profile is incomplete.
 * @param {{children:JSX.Element}} props
 * @returns {JSX.Element}
 */
export default function ProfileCompleteGuard({ children }) {
  const user = useAuthStore((state) => state.user);

  if (user?.isProfileComplete) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
