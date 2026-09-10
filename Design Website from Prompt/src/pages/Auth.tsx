import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notificationPrompt?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

type ViewState =
  | "login"
  | "register"
  | "register-email"
  | "register-mobile"
  | "otp-verify"
  | "google-mobile"
  | "google-otp"
  | "forgot-password"
  | "forgot-otp"
  | "reset-password";

let isGoogleInitializedGlobally = false;

export default function Auth() {
  const {
    loginCustomer,
    registerCustomer,
    navigate,
    showToast,
    sendEmailOtp,
    verifyEmailOtp,
    sendWhatsAppOtp,
    verifyWhatsAppOtp,
    googleAuth,
    completeGoogleRegistration,
    forgotPasswordSendOtp,
    forgotPasswordVerifyOtp,
    resetPassword,
  } = useApp() as any;

  const [activeView, setActiveView] = useState<ViewState>("login");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // OTP Timers
  const [otpExpiryTimer, setOtpExpiryTimer] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(90); // 90 seconds

  // Method tracking
  const [otpMethod, setOtpMethod] = useState<"email" | "whatsapp">("whatsapp");
  const [forgotMethod, setForgotMethod] = useState<"email" | "whatsapp">("whatsapp");

  // Google specific state
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  const googleLoginButtonRef = useRef<HTMLDivElement>(null);
  const googleRegisterButtonRef = useRef<HTMLDivElement>(null);
  const handleGoogleResponseRef = useRef<(response: any) => void>(() => {});

  const handleGoogleResponse = async (response: any) => {
    if (response.credential) {
      setIsLoading(true);
      try {
        const result = await googleAuth(response.credential);
        if (result.success) {
          if (result.requiresMobile) {
            setGoogleIdToken(response.credential);
            if (result.googleProfile) {
              setFullName(result.googleProfile.name || "");
            }
            setActiveView("google-mobile");
            showToast("Please link a mobile number to continue.", "info");
          } else {
            showToast("Successfully logged in with Google", "success");
            navigate("dashboard");
          }
        } else {
          showToast(result.message || "Google authentication failed", "error");
        }
      } catch {
        showToast("Error during Google authentication", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  handleGoogleResponseRef.current = handleGoogleResponse;

  // OTP expiry timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      ["otp-verify", "google-otp", "forgot-otp"].includes(activeView) &&
      otpExpiryTimer > 0
    ) {
      interval = setInterval(() => {
        setOtpExpiryTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeView, otpExpiryTimer]);

  // Resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      ["otp-verify", "google-otp", "forgot-otp"].includes(activeView) &&
      resendCooldown > 0
    ) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeView, resendCooldown]);

  // Google Sign-In initialization
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      if (!isGoogleInitializedGlobally) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res: any) => handleGoogleResponseRef.current(res),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isGoogleInitializedGlobally = true;
        } catch (err) {
          console.warn("Failed to initialize Google Sign-In:", err);
        }
      }

      const targetRef =
        activeView === "login"
          ? googleLoginButtonRef
          : activeView === "register"
          ? googleRegisterButtonRef
          : null;

      if (
        targetRef?.current &&
        (activeView === "login" || activeView === "register")
      ) {
        try {
          targetRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(targetRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            width: 320,
          });
        } catch (err) {
          console.warn("Failed to render Google button:", err);
        }
      }
    }
  }, [activeView]);

  const startOtpTimers = () => {
    setOtpExpiryTimer(300); // 5 minutes
    setResendCooldown(90); // 90 seconds
    setOtpCode("");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !password) return;
    setIsLoading(true);
    try {
      const success = await loginCustomer(loginIdentifier, password);
      if (success) {
        navigate("dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── REGISTER (Email) ──
  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const res = await registerCustomer({
        fullName,
        email,
        password,
        method: "email",
      });
      if (res) {
        setOtpMethod("email");
        setActiveView("otp-verify");
        startOtpTimers();
        showToast("Verification code sent to your email", "info");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── REGISTER (Mobile) ──
  const handleRegisterMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobileNumber || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (mobileNumber.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "warning");
      return;
    }
    setIsLoading(true);
    try {
      const res = await registerCustomer({
        fullName,
        mobileNumber,
        password,
        method: "whatsapp",
      });
      if (res) {
        setOtpMethod("whatsapp");
        setActiveView("otp-verify");
        startOtpTimers();
        showToast("Verification code sent to your WhatsApp", "info");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── VERIFY REGISTRATION OTP ──
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let res;
      if (otpMethod === "email") {
        res = await verifyEmailOtp(email, otpCode, "register");
      } else {
        res = await verifyWhatsAppOtp(mobileNumber, otpCode, "register");
      }
      if (res.success) {
        showToast("Registration successful!", "success");
        navigate("dashboard");
      } else {
        showToast(res.message || "Invalid OTP", "error");
      }
    } catch {
      showToast("Failed to verify OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── GOOGLE MOBILE SUBMIT ──
  const handleGoogleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !password) return;
    setIsLoading(true);
    try {
      const res = await completeGoogleRegistration({
        idToken: googleIdToken,
        mobileNumber,
        password,
        fullName,
      });
      if (res.success) {
        setOtpMethod("whatsapp");
        setActiveView("google-otp");
        startOtpTimers();
        showToast("Verification code sent to your WhatsApp", "info");
      } else {
        showToast(res.message || "Failed to initiate registration", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── GOOGLE OTP VERIFY ──
  const handleGoogleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await verifyWhatsAppOtp(mobileNumber, otpCode, "google-link");
      if (res.success) {
        showToast("Successfully registered with Google", "success");
        navigate("dashboard");
      } else {
        showToast(res.message || "Invalid OTP", "error");
      }
    } catch {
      showToast("Failed to verify OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── FORGOT PASSWORD ──
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotMethod === "email" && !email) return;
    if (forgotMethod === "whatsapp" && !mobileNumber) return;
    setIsLoading(true);
    try {
      const res = await forgotPasswordSendOtp({
        email: forgotMethod === "email" ? email : undefined,
        mobileNumber: forgotMethod === "whatsapp" ? mobileNumber : undefined,
        method: forgotMethod,
      });
      if (res.success) {
        setOtpMethod(forgotMethod);
        setActiveView("forgot-otp");
        startOtpTimers();
        showToast(
          forgotMethod === "email"
            ? "Verification code sent to your email"
            : "Verification code sent to your WhatsApp",
          "info"
        );
      } else {
        showToast(res.message || "Failed to send reset code", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── FORGOT OTP VERIFY ──
  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await forgotPasswordVerifyOtp({
        email: otpMethod === "email" ? email : undefined,
        mobileNumber: otpMethod === "whatsapp" ? mobileNumber : undefined,
        otp: otpCode,
        method: otpMethod,
      });
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setActiveView("reset-password");
      } else {
        showToast(res.message || "Invalid OTP", "error");
      }
    } catch {
      showToast("Failed to verify OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── RESET PASSWORD ──
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPassword(resetToken, password);
      if (res.success) {
        showToast("Password reset successfully. Please login.", "success");
        setActiveView("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        showToast(res.message || "Failed to reset password", "error");
      }
    } catch {
      showToast("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ── RESEND OTP ──
  const resendOtp = async () => {
    setIsLoading(true);
    try {
      let res;
      const purpose =
        activeView === "forgot-otp" ? "forgot_password" : "register";

      if (otpMethod === "email") {
        res = await sendEmailOtp(email, purpose);
      } else {
        res = await sendWhatsAppOtp(mobileNumber, purpose);
      }

      if (res.success) {
        setResendCooldown(90);
        setOtpExpiryTimer(300);
        setOtpCode("");
        showToast(
          otpMethod === "email"
            ? "New verification code sent to your email"
            : "New verification code sent to your WhatsApp",
          "info"
        );
      } else {
        showToast(res.message || "Failed to resend OTP", "error");
      }
    } catch {
      showToast("Failed to resend OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg
      className="h-5 w-5 mr-2"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";
  const labelClass =
    "block text-[11px] font-semibold text-gold uppercase tracking-wider";
  const btnPrimary =
    "w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="mx-auto max-w-md px-5 py-24 lg:py-28">
      {/* Main Card */}
      {[
        "login",
        "register",
        "register-email",
        "register-mobile",
        "forgot-password",
        "reset-password",
      ].includes(activeView) && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-md md:p-8 w-full max-w-md mx-auto">
          {/* Tabs for Login / Register */}
          {["login", "register", "register-email", "register-mobile"].includes(
            activeView
          ) && (
            <div className="flex border-b border-hairline pb-4 mb-6">
              <button
                type="button"
                onClick={() => setActiveView("login")}
                className={`flex-1 text-center font-display text-lg pb-2 border-b-2 transition-all ${
                  activeView === "login"
                    ? "border-gold text-brand font-semibold"
                    : "border-transparent text-muted"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveView("register")}
                className={`flex-1 text-center font-display text-lg pb-2 border-b-2 transition-all ${
                  activeView !== "login"
                    ? "border-gold text-brand font-semibold"
                    : "border-transparent text-muted"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* ═══ LOGIN FORM ═══ */}
          {activeView === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-id" className={labelClass}>
                  Email or Mobile Number
                </label>
                <input
                  id="login-id"
                  type="text"
                  required
                  placeholder="Enter email or mobile number"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  autoComplete="username"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="login-pass" className={labelClass}>
                  Password
                </label>
                <input
                  id="login-pass"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveView("forgot-password")}
                  className="text-xs font-semibold text-gold hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-hairline after:mt-0.5 after:flex-1 after:border-t after:border-hairline">
                <p className="mx-4 mb-0 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                  Or
                </p>
              </div>

              <div
                ref={googleLoginButtonRef}
                className="w-full flex justify-center mt-2"
              />
            </form>
          )}

          {/* ═══ REGISTER — METHOD CHOOSER ═══ */}
          {activeView === "register" && (
            <div className="space-y-4">
              <p className="text-xs text-muted text-center mb-2">
                Create your Huma Mehendi account
              </p>

              <div
                ref={googleRegisterButtonRef}
                className="w-full flex justify-center"
              />

              <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-hairline after:mt-0.5 after:flex-1 after:border-t after:border-hairline">
                <p className="mx-4 mb-0 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                  Or
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("register-email")}
                className="w-full rounded-md border-2 border-brand py-3 text-sm font-semibold tracking-wide text-brand transition-colors hover:bg-brand hover:text-cream"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Register with Email
                </span>
              </button>
              <p className="text-[10px] text-muted text-center -mt-1">
                Verify your email with a 6-digit OTP
              </p>

              <button
                type="button"
                onClick={() => setActiveView("register-mobile")}
                className="w-full rounded-md border-2 border-gold py-3 text-sm font-semibold tracking-wide text-gold transition-colors hover:bg-gold hover:text-white"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Register with Mobile
                </span>
              </button>
              <p className="text-[10px] text-muted text-center -mt-1">
                Verify your mobile number with a 6-digit WhatsApp OTP
              </p>
            </div>
          )}

          {/* ═══ REGISTER — EMAIL FORM ═══ */}
          {activeView === "register-email" && (
            <form onSubmit={handleRegisterEmail} className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveView("register")}
                className="flex items-center text-xs text-muted hover:text-brand mb-2"
              >
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to options
              </button>

              <h3 className="font-display text-lg text-brand">Register with Email</h3>

              <div>
                <label htmlFor="reg-name-e" className={labelClass}>Full Name</label>
                <input id="reg-name-e" type="text" required placeholder="e.g. Ananya Srivastava" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-email" className={labelClass}>Email Address</label>
                <input id="reg-email" type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-pass-e" className={labelClass}>Password</label>
                <input id="reg-pass-e" type="password" required placeholder="Create password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-confirm-e" className={labelClass}>Confirm Password</label>
                <input id="reg-confirm-e" type="password" required placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
              </div>

              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? "Sending OTP..." : "Verify Email & Register"}
              </button>
            </form>
          )}

          {/* ═══ REGISTER — MOBILE FORM ═══ */}
          {activeView === "register-mobile" && (
            <form onSubmit={handleRegisterMobile} className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveView("register")}
                className="flex items-center text-xs text-muted hover:text-brand mb-2"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to options
              </button>

              <h3 className="font-display text-lg text-brand">Register with Mobile</h3>

              <div>
                <label htmlFor="reg-name-m" className={labelClass}>Full Name</label>
                <input id="reg-name-m" type="text" required placeholder="e.g. Ananya Srivastava" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-mobile" className={labelClass}>Mobile Number</label>
                <input id="reg-mobile" type="tel" required maxLength={10} placeholder="10-digit mobile number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} autoComplete="tel" className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-pass-m" className={labelClass}>Password</label>
                <input id="reg-pass-m" type="password" required placeholder="Create password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
              </div>

              <div>
                <label htmlFor="reg-confirm-m" className={labelClass}>Confirm Password</label>
                <input id="reg-confirm-m" type="password" required placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
              </div>

              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? "Sending OTP..." : "Verify Mobile & Register"}
              </button>
            </form>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {activeView === "forgot-password" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl text-brand">Reset Password</h3>
                <p className="text-xs text-muted mt-2">
                  Choose how to receive your verification code.
                </p>
              </div>

              {/* Method toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForgotMethod("email")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md border transition-colors ${
                    forgotMethod === "email"
                      ? "bg-brand text-cream border-brand"
                      : "bg-transparent text-muted border-hairline hover:border-brand"
                  }`}
                >
                  Via Email
                </button>
                <button
                  type="button"
                  onClick={() => setForgotMethod("whatsapp")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md border transition-colors ${
                    forgotMethod === "whatsapp"
                      ? "bg-brand text-cream border-brand"
                      : "bg-transparent text-muted border-hairline hover:border-brand"
                  }`}
                >
                  Via WhatsApp
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {forgotMethod === "email" ? (
                  <div>
                    <label htmlFor="forgot-email" className={labelClass}>Email Address</label>
                    <input id="forgot-email" type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="forgot-mobile" className={labelClass}>Mobile Number</label>
                    <input id="forgot-mobile" type="tel" required maxLength={10} placeholder="10-digit mobile number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className={inputClass} />
                  </div>
                )}

                <button type="submit" disabled={isLoading} className={btnPrimary}>
                  {isLoading ? "Sending OTP..." : "Send Verification Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("login")}
                  className="w-full text-center text-xs font-semibold text-muted hover:text-brand mt-2"
                >
                  Back to Login
                </button>
              </form>
            </div>
          )}

          {/* ═══ RESET PASSWORD ═══ */}
          {activeView === "reset-password" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl text-brand">Create New Password</h3>
                <p className="text-xs text-muted mt-2">
                  Your identity has been verified. Please create a new password.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-pass" className={labelClass}>New Password</label>
                  <input id="new-pass" type="password" required placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="new-pass-confirm" className={labelClass}>Confirm New Password</label>
                  <input id="new-pass-confirm" type="password" required placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                </div>

                <button type="submit" disabled={isLoading} className={btnPrimary}>
                  {isLoading ? "Saving..." : "Save New Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ═══ OTP VERIFICATION MODAL ═══ */}
      {["otp-verify", "google-otp", "forgot-otp"].includes(activeView) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h3 className="font-display text-xl text-brand text-center">
              Verify {otpMethod === "email" ? "Email" : "Mobile"}
            </h3>
            <p className="mt-2 text-center text-xs text-muted leading-relaxed">
              We have sent a 6-digit verification code
              {otpMethod === "email" ? (
                <> to your email <span className="font-semibold text-brand">{email}</span></>
              ) : (
                <> via WhatsApp to <span className="font-semibold text-brand">{mobileNumber}</span></>
              )}
            </p>

            <form
              onSubmit={
                activeView === "otp-verify"
                  ? handleVerifyRegisterOtp
                  : activeView === "google-otp"
                  ? handleGoogleOtpSubmit
                  : handleForgotOtpSubmit
              }
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="otp-input"
                  className="block text-center text-[10px] font-semibold text-gold uppercase tracking-wider"
                >
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp-input"
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  autoComplete="one-time-code"
                  className="mt-2.5 w-full rounded-lg border border-hairline bg-cream/30 px-4 py-3 text-center font-display text-lg tracking-[0.4em] text-brand focus:border-gold focus:outline-none"
                />
              </div>

              {/* Expiry timer */}
              {otpExpiryTimer > 0 ? (
                <p className="text-center text-xs text-muted">
                  OTP expires in{" "}
                  <span className="font-semibold text-brand">
                    {formatTime(otpExpiryTimer)}
                  </span>
                </p>
              ) : (
                <p className="text-center text-xs text-red-500 font-semibold">
                  OTP has expired. Please request a new one.
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading || otpExpiryTimer === 0}
                className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold tracking-wide text-cream hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              {/* Resend section */}
              <div className="text-center pt-2 text-xs">
                {resendCooldown > 0 ? (
                  <span className="text-muted">
                    Resend OTP available in{" "}
                    <span className="font-semibold">
                      {formatTime(resendCooldown)}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isLoading}
                    className="font-semibold text-gold hover:underline disabled:opacity-60"
                  >
                    Resend Code
                    {otpMethod === "email" ? " via Email" : " via WhatsApp"}
                  </button>
                )}
              </div>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveView(
                      activeView === "otp-verify"
                        ? otpMethod === "email"
                          ? "register-email"
                          : "register-mobile"
                        : activeView === "google-otp"
                        ? "google-mobile"
                        : "forgot-password"
                    )
                  }
                  className="text-xs text-muted hover:text-brand"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ GOOGLE MOBILE VERIFICATION MODAL ═══ */}
      {activeView === "google-mobile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h3 className="font-display text-xl text-brand text-center">
              Complete Setup
            </h3>
            <p className="mt-2 text-center text-xs text-muted leading-relaxed">
              Please provide your mobile number to complete your Google
              registration.
            </p>

            <form onSubmit={handleGoogleMobileSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="google-mobile-input" className={labelClass}>
                  Mobile Number
                </label>
                <input
                  id="google-mobile-input"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="google-pass" className={labelClass}>
                  Set a Password
                </label>
                <input
                  id="google-pass"
                  type="password"
                  required
                  placeholder="Create a password for your account"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>

              <button type="submit" disabled={isLoading} className={btnPrimary}>
                {isLoading ? "Sending OTP..." : "Send WhatsApp OTP"}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setActiveView("login")}
                  className="text-xs text-muted hover:text-brand"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
