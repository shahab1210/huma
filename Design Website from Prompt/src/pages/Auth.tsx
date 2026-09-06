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
    sendWhatsAppOtp,
    verifyWhatsAppOtp,
    googleAuth,
    completeGoogleRegistration,
    forgotPasswordSendOtp,
    forgotPasswordVerifyOtp,
    resetPassword,
  } = useApp() as any; // Using any for new context methods

  const [activeView, setActiveView] = useState<ViewState>("login");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // OTP Timer
  const [otpTimer, setOtpTimer] = useState(60);

  // Google specific state
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [resetToken, setResetToken] = useState("");

  const googleLoginButtonRef = useRef<HTMLDivElement>(null);
  const googleRegisterButtonRef = useRef<HTMLDivElement>(null);
  const handleGoogleResponseRef = useRef<(response: any) => void>(() => {});

  const handleGoogleResponse = async (response: any) => {
    if (response.credential) {
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
      }
    }
  };

  handleGoogleResponseRef.current = handleGoogleResponse;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      (activeView === "otp-verify" ||
        activeView === "google-otp" ||
        activeView === "forgot-otp") &&
      otpTimer > 0
    ) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeView, otpTimer]);

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

      const targetRef = activeView === "login" ? googleLoginButtonRef : activeView === "register" ? googleRegisterButtonRef : null;

      if (targetRef?.current && (activeView === "login" || activeView === "register")) {
        try {
          targetRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(
            targetRef.current,
            {
              theme: "outline",
              size: "large",
              text: "continue_with",
              width: 320,
            }
          );
        } catch (err) {
          console.warn("Failed to render Google button:", err);
        }
      }
    }
  }, [activeView]);

  const triggerGoogleAuth = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      showToast("Google authentication is not available right now.", "warning");
    }
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
    setOtpCode("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !password) return;
    const success = await loginCustomer(mobileNumber, password);
    if (success) {
      navigate("dashboard");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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

    try {
      const regRes = await registerCustomer({
        fullName,
        mobileNumber,
        password,
      });
      if (regRes) {
        setActiveView("otp-verify");
        startOtpTimer();
        showToast("Verification code sent to your WhatsApp", "info");
      }
    } catch (err) {
      showToast("Failed to connect to server", "error");
    }
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyWhatsAppOtp(mobileNumber, otpCode, "register");
      if (res.success) {
        showToast("Registration successful", "success");
        navigate("dashboard");
      } else {
        showToast(res.message || "Invalid WhatsApp OTP", "error");
      }
    } catch (err) {
      showToast("Failed to verify OTP", "error");
    }
  };

  const handleGoogleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !password) return;
    try {
      const res = await completeGoogleRegistration({
        idToken: googleIdToken,
        mobileNumber,
        password,
        fullName,
      });
      if (res.success) {
        setActiveView("google-otp");
        startOtpTimer();
        showToast("Verification code sent to your WhatsApp", "info");
      } else {
        showToast(res.message || "Failed to initiate registration", "error");
      }
    } catch (err) {
      showToast("Failed to connect to server", "error");
    }
  };

  const handleGoogleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyWhatsAppOtp(mobileNumber, otpCode, "google-link");
      if (res.success) {
        showToast("Successfully registered with Google", "success");
        navigate("dashboard");
      } else {
        showToast(res.message || "Invalid WhatsApp OTP", "error");
      }
    } catch (err) {
      showToast("Failed to verify OTP", "error");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber) return;
    try {
      const res = await forgotPasswordSendOtp(mobileNumber);
      if (res.success) {
        setActiveView("forgot-otp");
        startOtpTimer();
        showToast("Verification code sent to your WhatsApp", "info");
      } else {
        showToast(res.message || "Failed to send reset code", "error");
      }
    } catch (err) {
      showToast("Failed to connect to server", "error");
    }
  };

  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPasswordVerifyOtp(mobileNumber, otpCode);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        setActiveView("reset-password");
      } else {
        showToast(res.message || "Invalid WhatsApp OTP", "error");
      }
    } catch (err) {
      showToast("Failed to verify OTP", "error");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
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
    } catch (err) {
      showToast("Failed to connect to server", "error");
    }
  };

  const resendOtp = async (purpose: string) => {
    try {
      let res;
      if (purpose === "forgot") {
        res = await forgotPasswordSendOtp(mobileNumber);
      } else {
        res = await sendWhatsAppOtp(mobileNumber, purpose);
      }
      if (res.success) {
        startOtpTimer();
        showToast("New verification code sent to your WhatsApp", "info");
      } else {
        showToast(res.message || "Failed to resend OTP", "error");
      }
    } catch (err) {
      showToast("Failed to resend OTP", "error");
    }
  };

  const GoogleIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-md px-5 py-24 lg:py-28">
      {/* Main Card */}
      {["login", "register", "forgot-password", "reset-password"].includes(activeView) && (
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-md md:p-8 w-full max-w-md mx-auto">
          
          {/* Tabs for Login / Register */}
          {["login", "register"].includes(activeView) && (
            <div className="flex border-b border-hairline pb-4 mb-6">
              <button
                type="button"
                onClick={() => setActiveView("login")}
                className={`flex-1 text-center font-display text-lg pb-2 border-b-2 transition-all ${
                  activeView === "login" ? "border-gold text-brand font-semibold" : "border-transparent text-muted"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActiveView("register")}
                className={`flex-1 text-center font-display text-lg pb-2 border-b-2 transition-all ${
                  activeView === "register" ? "border-gold text-brand font-semibold" : "border-transparent text-muted"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeView === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-mobile" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  id="login-mobile"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="Enter registered mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="login-pass" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="login-pass"
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
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

              <button
                type="submit"
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 mt-2"
              >
                Sign In
              </button>

              <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-hairline after:mt-0.5 after:flex-1 after:border-t after:border-hairline">
                <p className="mx-4 mb-0 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                  Or
                </p>
              </div>

              <div ref={googleLoginButtonRef} className="w-full flex justify-center mt-2" />
            </form>
          )}

          {/* REGISTER FORM */}
          {activeView === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Ananya Srivastava"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-mobile" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Mobile Number
                </label>
                <input
                  id="reg-mobile"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-pass" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  required
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 mt-2"
              >
                Verify Mobile &amp; Register
              </button>

              <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-hairline after:mt-0.5 after:flex-1 after:border-t after:border-hairline">
                <p className="mx-4 mb-0 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                  Or
                </p>
              </div>

              <div ref={googleRegisterButtonRef} className="w-full flex justify-center mt-2" />
            </form>
          )}

          {/* FORGOT PASSWORD - Mobile Input */}
          {activeView === "forgot-password" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl text-brand">Reset Password</h3>
                <p className="text-xs text-muted mt-2">Enter your registered mobile number. We'll send a WhatsApp OTP to verify it's you.</p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-mobile" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <input
                    id="forgot-mobile"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
                >
                  Send WhatsApp OTP
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

          {/* RESET PASSWORD - New Password */}
          {activeView === "reset-password" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-xl text-brand">Create New Password</h3>
                <p className="text-xs text-muted mt-2">Your mobile has been verified. Please create a new password.</p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-pass" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="new-pass-confirm" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    id="new-pass-confirm"
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700"
                >
                  Save New Password
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* OTP Modals (WhatsApp) */}
      {["otp-verify", "google-otp", "forgot-otp"].includes(activeView) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h3 className="font-display text-xl text-brand text-center">Verify WhatsApp</h3>
            <p className="mt-2 text-center text-xs text-muted leading-relaxed">
              We have sent a verification code to your WhatsApp <span className="font-semibold text-brand">{mobileNumber}</span>.
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
                <label htmlFor="otp-input" className="block text-center text-[10px] font-semibold text-gold uppercase tracking-wider">
                  Enter 6-Digit Code
                </label>
                <input
                  id="otp-input"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="e.g. 123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="mt-2.5 w-full rounded-lg border border-hairline bg-cream/30 px-4 py-3 text-center font-display text-lg tracking-[0.4em] text-brand focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold tracking-wide text-cream hover:bg-brand-700 transition-colors"
              >
                Verify Code
              </button>

              <div className="text-center pt-2 text-xs">
                {otpTimer > 0 ? (
                  <span className="text-muted">Resend OTP in {otpTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resendOtp(
                      activeView === "otp-verify" ? "register" :
                      activeView === "google-otp" ? "google-link" : "forgot"
                    )}
                    className="font-semibold text-gold hover:underline"
                  >
                    Resend Code via WhatsApp
                  </button>
                )}
              </div>
              
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setActiveView(
                    activeView === "otp-verify" ? "register" :
                    activeView === "google-otp" ? "google-mobile" : "forgot-password"
                  )}
                  className="text-xs text-muted hover:text-brand"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Mobile Verification Modal */}
      {activeView === "google-mobile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h3 className="font-display text-xl text-brand text-center">Complete Setup</h3>
            <p className="mt-2 text-center text-xs text-muted leading-relaxed">
              Please provide your mobile number to complete your Google registration.
            </p>

            <form onSubmit={handleGoogleMobileSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="google-mobile-input" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
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
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="google-pass" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                  Set a Password
                </label>
                <input
                  id="google-pass"
                  type="password"
                  required
                  placeholder="Create a password for your account"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-hairline bg-cream/30 px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-brand py-2.5 text-sm font-semibold tracking-wide text-cream hover:bg-brand-700 transition-colors"
              >
                Send WhatsApp OTP
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
