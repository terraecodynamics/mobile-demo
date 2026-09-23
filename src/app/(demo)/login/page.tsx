"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  homePathForRole,
  matchDemoAccount,
} from "@/lib/auth";
import { kronis } from "@/lib/kronis";
import { AlertCircle, Eye, EyeOff, KeyRound, Lock, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type LoginMethod = "password" | "otp";

function isPhoneInput(text: string) {
  const cleaned = text.replace(/[\s\-()]/g, "");
  if (!cleaned) return false;
  if (/[a-zA-Z@]/.test(cleaned)) return false;
  return /^[+\d][\d]*$/.test(cleaned);
}

function formatPhoneNumber(text: string) {
  return text.replace(/[^\d]/g, "").slice(0, 10);
}

export default function LoginPage() {
  const router = useRouter();
  const { session, ready, login } = useAuth();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState<"email" | "phone">("email");

  useEffect(() => {
    if (!ready || !session) return;
    router.replace(homePathForRole(session.role));
  }, [ready, session, router]);

  const accent = kronis.lime;

  const primaryLabel = busy
    ? "Please wait..."
    : loginMethod === "password"
      ? "Log In"
      : otpSent
        ? "Verify"
        : "Send OTP";

  const primaryDisabled =
    busy || (loginMethod === "otp" && otpSent && otp.length !== 6);

  const finishLogin = (role: "owner" | "rentee", name: string, phone: string) => {
    login(role, name, phone.startsWith("+") ? phone : `+91 ${phone}`);
    router.replace(homePathForRole(role));
  };

  const handlePasswordLogin = () => {
    setError("");
    if (!emailOrMobile.trim()) {
      setError("Please enter email or mobile");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    const matched = matchDemoAccount(emailOrMobile);
    if (!matched || matched.account.password !== password) {
      setError("Invalid email/mobile or password");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      finishLogin(matched.role, matched.account.name, matched.account.phone);
      setBusy(false);
    }, 280);
  };

  const handleSendOtp = () => {
    setError("");
    if (!emailOrMobile.trim()) {
      setError("Please enter email or mobile");
      return;
    }
    const matched = matchDemoAccount(emailOrMobile);
    if (!matched) {
      setError("No account found for this email/mobile");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setOtpSent(true);
      setBusy(false);
    }, 280);
  };

  const handleOtpLogin = () => {
    setError("");
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit OTP");
      return;
    }
    const matched = matchDemoAccount(emailOrMobile);
    if (!matched || matched.account.otp !== otp) {
      setError("Invalid OTP");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      finishLogin(matched.role, matched.account.name, matched.account.phone);
      setBusy(false);
    }, 280);
  };

  const onPrimaryPress = () => {
    if (loginMethod === "password") handlePasswordLogin();
    else if (otpSent) handleOtpLogin();
    else handleSendOtp();
  };

  const switchToPassword = () => {
    setLoginMethod("password");
    setError("");
    setOtpSent(false);
    setOtp("");
  };

  const switchToOtp = () => {
    setLoginMethod("otp");
    setError("");
    setOtpSent(false);
    setOtp("");
  };

  const fieldIconColor = useMemo(
    () => (emailOrMobile ? accent : kronis.inkMuted),
    [emailOrMobile, accent]
  );

  if (!ready || session) {
    return (
      <div className="flex min-h-0 flex-1" style={{ background: kronis.background }} />
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ background: kronis.background }}>
      {/* Ambient glows — native LoginScreen */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          background: `rgba(${kronis.brandRgb},0.18)`,
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: 40,
          left: -70,
          width: 200,
          height: 200,
          borderRadius: 100,
          background: "rgba(230,57,70,0.10)",
        }}
      />

      <div className="no-scrollbar relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
        <div className="mb-10 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kronis-logo.svg" alt="TerraEco" width={160} height={58} className="h-[58px] w-[160px]" />
        </div>

        <div
          className="rounded-[22px]"
          style={{
            background: kronis.surface,
            boxShadow: "10px 14px 18px rgba(102,112,122,0.18)",
          }}
        >
          <div
            className="rounded-[22px] px-5 pb-[18px] pt-5"
            style={{
              border: "1px solid rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.55)",
            }}
          >
            <h1
              className="text-center text-[24px] font-bold tracking-[-0.2px]"
              style={{ color: kronis.ink }}
            >
              Welcome <span style={{ color: kronis.lime }}>back</span>
            </h1>
            <p className="mb-3.5 mt-1 text-center text-[13px]" style={{ color: kronis.inkMuted }}>
              {loginMethod === "otp" && otpSent
                ? "Enter the OTP sent to you"
                : "Login to continue"}
            </p>

            {/* Password / OTP segment */}
            <div
              className="mb-4 flex rounded-[14px] p-1"
              style={{ background: kronis.background }}
            >
              {(
                [
                  { id: "password" as const, label: "Password", onClick: switchToPassword },
                  { id: "otp" as const, label: "OTP", onClick: switchToOtp },
                ] as const
              ).map((tab) => {
                const active = loginMethod === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={tab.onClick}
                    className="flex-1 rounded-[11px] py-2.5 text-[13px] font-semibold transition-all"
                    style={{
                      color: active ? kronis.lime : kronis.inkMuted,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 2px 6px rgba(102,112,122,0.14)" : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-1">
              <label className="mb-1.5 block text-[13px] font-bold" style={{ color: kronis.ink }}>
                Email or Mobile
              </label>
              <div className="relative mb-3">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  {inputType === "phone" ? (
                    <Phone size={18} color={fieldIconColor} strokeWidth={2} />
                  ) : (
                    <Mail size={18} color={fieldIconColor} strokeWidth={2} />
                  )}
                </span>
                <input
                  value={emailOrMobile}
                  onChange={(e) => {
                    const text = e.target.value;
                    const phone = isPhoneInput(text);
                    setInputType(phone ? "phone" : "email");
                    setEmailOrMobile(phone ? formatPhoneNumber(text) : text);
                    setError("");
                  }}
                  disabled={otpSent}
                  inputMode={inputType === "phone" ? "tel" : "email"}
                  autoCapitalize="none"
                  autoComplete={inputType === "phone" ? "tel" : "email"}
                  placeholder={inputType === "phone" ? "10-digit mobile" : "Email address"}
                  maxLength={inputType === "phone" ? 10 : 100}
                  className="w-full rounded-xl border-[1.5px] py-3 pl-10 pr-3 text-[14px] outline-none disabled:opacity-70"
                  style={{
                    background: kronis.background,
                    color: kronis.ink,
                    borderColor: error ? kronis.alert : kronis.border,
                  }}
                />
              </div>

              {loginMethod === "password" ? (
                <>
                  <label className="mb-1.5 block text-[13px] font-bold" style={{ color: kronis.ink }}>
                    Password
                  </label>
                  <div className="relative mb-2">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock
                        size={18}
                        color={password ? accent : kronis.inkMuted}
                        strokeWidth={2}
                      />
                    </span>
                    <input
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onPrimaryPress();
                      }}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      className="w-full rounded-xl border-[1.5px] py-3 pl-10 pr-11 text-[14px] outline-none"
                      style={{
                        background: kronis.background,
                        color: kronis.ink,
                        borderColor: error ? kronis.alert : kronis.border,
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={kronis.inkMuted} strokeWidth={2} />
                      ) : (
                        <Eye size={20} color={kronis.inkMuted} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="mb-2 ml-auto block text-[13px] font-semibold"
                    style={{ color: kronis.lime }}
                    onClick={() => setError("Forgot password — coming soon (demo)")}
                  >
                    Forgot Password?
                  </button>
                </>
              ) : null}

              {loginMethod === "otp" && otpSent ? (
                <>
                  <label className="mb-1.5 block text-[13px] font-bold" style={{ color: kronis.ink }}>
                    OTP
                  </label>
                  <div className="relative mb-3">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <KeyRound
                        size={18}
                        color={otp ? accent : kronis.inkMuted}
                        strokeWidth={2}
                      />
                    </span>
                    <input
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onPrimaryPress();
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      maxLength={6}
                      className="w-full rounded-xl border-[1.5px] py-3 pl-10 pr-3 text-center text-[20px] tracking-[0.25em] outline-none"
                      style={{
                        background: kronis.background,
                        color: kronis.ink,
                        borderColor: error ? kronis.alert : kronis.border,
                      }}
                    />
                  </div>
                </>
              ) : null}

              {error ? (
                <div
                  className="mb-2 flex items-center gap-2 rounded-xl border px-2.5 py-2.5"
                  style={{
                    background: kronis.alertBg,
                    borderColor: "rgba(224,100,46,0.35)",
                  }}
                >
                  <AlertCircle size={18} color={kronis.alert} strokeWidth={2} />
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: kronis.alert }}>
                    {error}
                  </span>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              disabled={primaryDisabled}
              onClick={onPrimaryPress}
              className="mt-1.5 w-full overflow-hidden rounded-full active:scale-[0.99] disabled:opacity-65"
              style={{
                minHeight: 50,
                background: `linear-gradient(135deg, ${kronis.lime}, ${kronis.limeDark})`,
              }}
            >
              <span className="text-[15px] font-bold text-white">{primaryLabel}</span>
            </button>

            {loginMethod === "otp" && otpSent ? (
              <button
                type="button"
                className="mt-3 w-full text-center text-[13px] font-semibold"
                style={{ color: kronis.lime }}
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
              >
                Change email / mobile
              </button>
            ) : null}

            <div className="mt-4 text-center text-[13px] font-medium" style={{ color: kronis.inkMuted }}>
              New User?{" "}
              <button
                type="button"
                className="font-bold"
                style={{ color: kronis.lime }}
                onClick={() => setError("Registration — coming soon (demo)")}
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
