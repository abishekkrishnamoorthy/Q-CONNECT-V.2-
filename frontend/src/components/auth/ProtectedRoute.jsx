// d:\projects\QCONNECT(V2.0)\frontend\src\components\auth\ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Route guard that allows only authenticated users.
 * @param {{children:JSX.Element}} props
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
