import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth";
import AuthLeftPanel from "./AuthLeftPanel";

/**
 * Email verification polling panel with resend cooldown.
 * @param {{email:string,onVerified:()=>void}} props
 * @returns {JSX.Element}
 */
export default function VerifyPanel({ email, onVerified }) {
  const [status, setStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const statusLabel = useMemo(() => {
    if (status === "verified") {
      return "Email verified. Redirecting...";
    }
    if (status === "not_found") {
      return "Session expired, register again.";
    }
    return "Waiting for verification.";
  }, [status]);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      try {
        const result = await authApi.checkStatus(email);
        if (!isMounted) {
          return;
        }
        setStatus(result.status);
        setError("");
        if (result.status === "verified") {
          setTimeout(() => {
            onVerified();
          }, 1500);
        }
      } catch {
        if (!isMounted) {
          return;
        }
        setError("Unable to check verification status.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    poll();
    const intervalId = setInterval(poll, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [email, onVerified]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      setError("");
      await authApi.resend(email);
      setCooldown(60);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not resend verification email.");
    }
  };

  return (
    <div className="-mx-4 -my-8 flex min-h-screen flex-col md:flex-row">
      <AuthLeftPanel
        eyebrow="almost there"
        tagline="One tap away<br>from your <em>community.</em>"
        subtext="Your account is waiting. Check your inbox and click the link to unlock everything."
      >
        <StepTracker
          steps={[
            { label: "Account created", description: "you're in the system", done: true },
            { label: "Verify your email", description: "check your inbox now", current: true },
            { label: "Set up your profile", description: "tell us who you are" },
            { label: "Join groups, ask away", description: "start learning" }
          ]}
        />
      </AuthLeftPanel>

      <div className="w-full flex-1 overflow-y-auto bg-[#f5efe6] px-6 py-8 animate-[fade-up_0.4s_ease-out] md:flex md:min-h-screen md:w-[35%] md:flex-col md:justify-center md:px-9 md:py-10">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center">
          <div className="relative mx-auto mb-7 h-[5.5rem] w-[5.5rem]">
            <div className="absolute inset-0 rounded-full border-2 border-amber animate-[pulse-ring_2s_ease-out_infinite]" />
            <div className="absolute inset-0 rounded-full border-2 border-amber animate-[pulse-ring_2s_ease-out_0.6s_infinite]" />
            <div className="relative z-10 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full border border-border bg-white">
              <EnvelopeIcon />
            </div>
          </div>

          <div className="mb-7 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-1.5 text-[12px] font-medium text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
              Waiting for verification
            </div>
          </div>

          <p className="mb-4 text-center text-sm text-text-secondary">
            {isLoading ? "Checking verification status..." : statusLabel}
          </p>

          {status === "not_found" && (
            <p className="mb-3 text-sm text-red-600">
              Session expired, register again at <Link className="underline" to="/register">/register</Link>.
            </p>
          )}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <button
            className="w-full rounded-[10px] border border-border bg-transparent py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:border-amber hover:text-amber-deep disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleResend}
            disabled={cooldown > 0 || status === "verified"}
            type="button"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
          </button>

          <p className="mt-4 text-[12px] text-text-secondary">
            <Link className="font-medium text-amber-deep" to="/register">Wrong email? Go back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" aria-hidden="true">
      <path d="M4 7.5h16v9H4z" stroke="#f59e0b" strokeWidth="1.7" />
      <path d="m4.5 8 7.5 6 7.5-6" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepTracker({ steps }) {
  return (
    <div className="flex flex-col gap-3.5">
      {steps.map((step, index) => (
        <div className="flex items-start gap-3" key={step.label}>
          <div
            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-medium ${
              step.done || step.current
                ? "border-amber bg-amber/25 text-amber"
                : "border-white/15 bg-white/5 text-white/30"
            }`}
          >
            {step.done ? "\u2713" : index + 1}
          </div>
          <p className="text-[13px] leading-snug text-white/50">
            <span className="font-medium text-white/80">{step.label}</span>
            {" \u2014 "}
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}
