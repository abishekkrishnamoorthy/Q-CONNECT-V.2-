// d:\projects\QCONNECT(V2.0)\frontend\src\pages\LoginPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { usersApi } from "../api/users";
import AuthLeftPanel from "../components/auth/AuthLeftPanel";
import { useAuthStore } from "../store/authStore";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Combined auth page with login and register tabs.
 * @param {{defaultTab?:"login"|"register"}} props
 * @returns {JSX.Element}
 */
export default function LoginPage({ defaultTab = "login" }) {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerEmailError, setRegisterEmailError] = useState("");
  const [registerPasswordError, setRegisterPasswordError] = useState("");
  const [oauthError, setOauthError] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    if (!googleClientId) {
      setOauthError("Google sign-in is not configured.");
      return;
    }

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onerror = () => setOauthError("Google OAuth script failed to load.");
    document.body.appendChild(script);
  }, []);

  const handleLoginChange = (event) => {
    setLoginForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setLoginError("");
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      setRegisterEmailError("");
    }
    if (name === "password") {
      setRegisterPasswordError("");
    }
    setRegisterError("");
  };

  const routeAfterAuth = async (accessToken, user) => {
    try {
      login(accessToken, user);
      const me = await usersApi.me();
      login(accessToken, me.user);
      navigate(me.user?.isProfileComplete ? "/home" : "/profile-setup", { replace: true });
    } catch (error) {
      console.error("Failed to load user profile after login:", error);
      // Still navigate to profile setup even if me() fails
      navigate("/profile-setup", { replace: true });
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");
    setIsLoginSubmitting(true);

    try {
      const result = await authApi.login(loginForm);
      await routeAfterAuth(result.accessToken, result.user);
    } catch (err) {
      setLoginError(err?.response?.data?.error?.message || "Login failed.");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterEmailError("");
    setRegisterPasswordError("");
    setIsRegisterSubmitting(true);

    try {
      await authApi.register(registerForm);
      navigate(`/verify?email=${encodeURIComponent(registerForm.email.trim().toLowerCase())}`);
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const message = apiError?.message || "Registration failed.";

      if (apiError?.code === "EMAIL_EXISTS") {
        setRegisterEmailError(message);
      } else if (apiError?.code === "VALIDATION_ERROR") {
        const fieldErrors = apiError?.details?.fieldErrors || {};
        const emailFieldError = Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : "";
        const passwordFieldError = Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : "";

        if (emailFieldError) {
          setRegisterEmailError(emailFieldError);
        }
        if (passwordFieldError) {
          setRegisterPasswordError(passwordFieldError);
        }

        if (!emailFieldError && !passwordFieldError) {
          setRegisterError(apiError?.summary || message);
        }
      } else {
        setRegisterError(message);
      }
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthError("");

    if (!window.google?.accounts?.id) {
      setOauthError("Google OAuth is unavailable right now.");
      return;
    }

    try {
      const credential = await new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) {
              resolve(response.credential);
            } else {
              reject(new Error("Missing credential"));
            }
          }
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("OAuth popup blocked or skipped"));
          }
        });
      });

      const result = await authApi.oauthGoogle({ credential });
      await routeAfterAuth(result.accessToken, result.user);
    } catch {
      setOauthError("Popup may be blocked. Allow popups and try again, or use email login.");
    }
  };

  const isLogin = activeTab === "login";

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden md:flex-row">
      <AuthLeftPanel
        eyebrow="where curiosity meets community"
        tagline="Ask bold.<br>Learn <em>together.</em><br>Grow fast."
        subtext="Join thousands asking real questions, sharing sharp answers, and building knowledge that sticks."
      >
        <SocialProof />
      </AuthLeftPanel>

      <div className="w-full flex-1 overflow-y-auto bg-bg px-6 py-8 animate-[fade-up_0.4s_ease-out] md:flex md:min-h-screen md:w-[35%] md:flex-col md:justify-center md:px-9 md:py-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex gap-1 rounded-[10px] bg-warm-sidebar p-1">
            <button
              type="button"
              className={`flex-1 rounded-[7px] py-2 text-[13px] font-medium transition-all ${
                isLogin ? "bg-white text-amber-deep shadow-sm" : "text-text-secondary"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-[7px] py-2 text-[13px] font-medium transition-all ${
                !isLogin ? "bg-white text-amber-deep shadow-sm" : "text-text-secondary"
              }`}
              onClick={() => setActiveTab("register")}
            >
              Create account
            </button>
          </div>

          {isLogin ? (
            <div className="mb-6">
              <h2 className="font-display text-[24px] font-bold text-text-primary">Welcome back</h2>
              <p className="mt-1 text-[13px] text-text-secondary">Good to see you again.</p>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="font-display text-[24px] font-bold text-text-primary">Join Qconnect</h2>
              <p className="mt-1 text-[13px] text-text-secondary">Start learning with your community.</p>
            </div>
          )}

          <button
            type="button"
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-white py-2.5 text-[13px] font-medium text-text-primary transition-colors hover:border-amber-dark"
            onClick={handleGoogleLogin}
          >
            <GoogleColorIcon />
            {isLogin ? "Continue with Google" : "Sign up with Google"}
          </button>
          {oauthError && <p className="mb-5 text-sm text-red-600">{oauthError}</p>}

          <div className="mb-5 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-text-secondary">or email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <section className={isLogin ? "block" : "hidden"}>
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[12px] font-medium text-text-primary" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className="w-full rounded-[9px] border border-border bg-white px-3 py-2.5 font-body text-[13px] text-text-primary outline-none transition-colors focus:border-amber"
                  required
                />
              </div>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[12px] font-medium text-text-primary" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-[9px] border border-border bg-white px-3 py-2.5 font-body text-[13px] text-text-primary outline-none transition-colors focus:border-amber"
                  required
                />
              </div>
              {loginError && <p className="mb-3.5 text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="mt-1 flex w-full items-center justify-center rounded-[10px] bg-amber py-3 text-[14px] font-medium text-white transition-colors hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoginSubmitting ? <Spinner /> : "Sign in"}
              </button>
            </form>
            <p className="mt-[18px] text-center text-[12px] text-text-secondary">
              No account?{" "}
              <button
                type="button"
                className="font-medium text-amber-deep hover:underline"
                onClick={() => setActiveTab("register")}
              >
                Create account
              </button>
            </p>
          </section>

          <section className={!isLogin ? "block" : "hidden"}>
            <form onSubmit={handleRegisterSubmit}>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[12px] font-medium text-text-primary" htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className="w-full rounded-[9px] border border-border bg-white px-3 py-2.5 font-body text-[13px] text-text-primary outline-none transition-colors focus:border-amber"
                  required
                />
                {registerEmailError && <p className="mt-1 text-sm text-red-600">{registerEmailError}</p>}
              </div>
              <div className="mb-3.5">
                <label className="mb-1.5 block text-[12px] font-medium text-text-primary" htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  minLength={8}
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  className="w-full rounded-[9px] border border-border bg-white px-3 py-2.5 font-body text-[13px] text-text-primary outline-none transition-colors focus:border-amber"
                  required
                />
                {registerPasswordError && <p className="mt-1 text-sm text-red-600">{registerPasswordError}</p>}
              </div>
              {registerError && <p className="mb-3.5 text-sm text-red-600">{registerError}</p>}
              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="mt-1 flex w-full items-center justify-center rounded-[10px] bg-amber py-3 text-[14px] font-medium text-white transition-colors hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegisterSubmitting ? <Spinner /> : "Create account"}
              </button>
            </form>
            <p className="mt-[18px] text-center text-[12px] text-text-secondary">
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-amber-deep hover:underline"
                onClick={() => setActiveTab("login")}
              >
                Sign in
              </button>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function GoogleColorIcon() {
  return (
    <svg viewBox="0 0 18 18" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7963 2.7163v2.2582h2.9086c1.7018-1.5668 2.6841-3.8741 2.6841-6.6154Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8068 5.9564-2.1809l-2.9086-2.2582c-.8068.5405-1.8409.8591-3.0478.8591-2.3441 0-4.3282-1.5827-5.0364-3.7105H.9573v2.3291C2.4382 15.9805 5.4818 18 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.9636 10.7095A5.4108 5.4108 0 0 1 3.6818 9c0-.5927.1023-1.1691.2818-1.7095V4.9614H.9573A9.0054 9.0054 0 0 0 0 9c0 1.4523.3477 2.8277.9573 4.0386l3.0063-2.3291Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4391 1.3454l2.5795-2.5796C13.4636.8918 11.4264 0 9 0 5.4818 0 2.4382 2.0195.9573 4.9614l3.0063 2.3291C4.6718 5.1623 6.6559 3.5795 9 3.5795Z"
      />
    </svg>
  );
}

function SocialProof() {
  const items = [
    { label: "AK", className: "bg-amber-800" },
    { label: "SR", className: "bg-teal-700" },
    { label: "MJ", className: "bg-purple-600" },
    { label: "+", className: "bg-amber text-espresso" }
  ];

  return (
    <div className="flex items-center gap-3.5">
      <div className="flex">
        {items.map((item) => (
          <div
            key={item.label}
            className={`-mr-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-espresso text-[11px] font-medium text-white ${item.className}`}
          >
            {item.label}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/45">
        <span className="font-medium text-white/75">4,200+ learners</span> already inside
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
      aria-hidden="true"
    />
  );
}
