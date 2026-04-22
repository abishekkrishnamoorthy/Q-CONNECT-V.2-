// d:\projects\QCONNECT(V2.0)\frontend\src\pages\VerifyPage.jsx
import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import VerifyPanel from "../components/auth/VerifyPanel";

/**
 * Email verification page showing polling panel.
 * @returns {JSX.Element}
 */
export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(() => (searchParams.get("email") || "").trim().toLowerCase(), [searchParams]);

  if (!email) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-text-primary">Email is required to check verification status.</p>
        <Link to="/register" className="mt-3 inline-block text-amber-deep underline">Go to register</Link>
      </div>
    );
  }

  return <VerifyPanel email={email} onVerified={() => navigate("/login", { replace: true })} />;
}
