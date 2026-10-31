"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authClient, useSession, emailOtp } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { Mail, Check, RefreshCw, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const queryError = searchParams.get("error");

  useEffect(() => {
    if (session?.user) {
      router.replace("/auth/callback");
    }
  }, [session, router]);

  useEffect(() => {
    if (queryError) {
      if (queryError === "session_missing") {
        setErrorMsg("Authentication session could not be verified. Please sign in again.");
      } else {
        setErrorMsg("Authentication failed. Please verify your credentials.");
      }
    }
  }, [queryError]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const callbackURL = `${window.location.origin}/auth/callback`;
      await signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to initiate Google SSO.");
      setIsGoogleLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setOtpError(null);
    setOtpSuccess(null);
    setIsEmailLoading(true);

    try {
      if (isSignUp) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || "AVERA User",
        });

        if (res.error) {
          setErrorMsg(res.error.message || "Failed to create account.");
          setIsEmailLoading(false);
          return;
        }

        if (!res.data?.token) {
          setShowOtpStep(true);
          setIsEmailLoading(false);
          setResendCooldown(60);
          return;
        }
      } else {
        const res = await authClient.signIn.email({
          email,
          password,
        });

        if (res.error) {
          const msg = res.error.message?.toLowerCase() || "";
          if (msg.includes("verif") || res.error.status === 403) {
            setShowOtpStep(true);
            setIsEmailLoading(false);
            await emailOtp.sendVerificationOtp({
              email,
              type: "email-verification",
            }).catch(() => {});
            setResendCooldown(60);
            return;
          }
          setErrorMsg(res.error.message || "Invalid credentials.");
          setIsEmailLoading(false);
          return;
        }
      }

      router.replace("/auth/callback");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication error.");
      setIsEmailLoading(false);
    }
  }

  async function handleVerifyAndLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode) {
      setOtpError("Please enter the verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const verifyRes = await emailOtp.verifyEmail({
        email,
        otp: cleanCode,
      });

      if (verifyRes?.error) {
        setOtpError(verifyRes.error.message || "Invalid or expired verification code.");
        setIsVerifyingOtp(false);
        return;
      }

      const loginRes = await authClient.signIn.email({
        email,
        password,
      });

      if (loginRes?.error) {
        const currentSession = await authClient.getSession();
        if (!currentSession?.data?.user) {
          setOtpSuccess("Email verified! Please sign in with your password.");
          setShowOtpStep(false);
          setIsSignUp(false);
          setIsVerifyingOtp(false);
          return;
        }
      }

      router.replace("/auth/callback");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtpOnLogin() {
    if (resendCooldown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (res?.error) {
        setOtpError(res.error.message || "Failed to resend verification code.");
      } else {
        setOtpSuccess("A new verification code was sent to your email.");
        setResendCooldown(60);
      }
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background select-none p-6">
        <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background select-none p-4 sm:p-6">
      <div className="w-full max-w-md bg-surface border border-border-subtle p-8 md:p-10 shadow-sm rounded-lg space-y-7">
        <div className="text-center space-y-2">
          <span className="font-display text-4xl md:text-5xl tracking-tight text-foreground font-normal block">
            AVERA
          </span>
        </div>

        {errorMsg && !showOtpStep && (
          <div className="p-3 bg-quality-poor/10 border border-quality-poor/30 text-quality-poor text-xs font-mono rounded">
            {errorMsg}
          </div>
        )}

        {showOtpStep ? (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5 text-center border-b border-border-subtle pb-4">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-sm font-mono uppercase tracking-wider text-foreground font-medium">
                  Verify Your Email
                </h2>
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                A verification code was sent to <span className="font-mono text-foreground font-medium">{email}</span>.
              </p>
            </div>

            {otpError && (
              <div className="p-3 bg-quality-poor/10 border border-quality-poor/30 text-quality-poor text-xs font-mono rounded">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-quality-good/10 border border-quality-good/30 text-quality-good text-xs font-mono rounded flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={12}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value);
                    if (otpError) setOtpError(null);
                  }}
                  placeholder="Enter code"
                  className="w-full px-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-mono tracking-widest text-center text-foreground placeholder:tracking-normal placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.trim().length < 4}
                className="w-full h-11 rounded bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer font-medium flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue <Check className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs font-mono pt-1 text-muted">
                <button
                  type="button"
                  onClick={handleResendOtpOnLogin}
                  disabled={resendCooldown > 0 || isSendingOtp}
                  className="hover:text-foreground underline underline-offset-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-all flex items-center gap-1"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend Code"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowOtpStep(false);
                    setOtpCode("");
                    setOtpError(null);
                    setOtpSuccess(null);
                  }}
                  className="hover:text-foreground cursor-pointer transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded bg-surface-raised border border-border hover:border-foreground/40 hover:bg-surface-raised/80 transition-all font-mono text-sm text-foreground disabled:opacity-50 cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-muted border-t-foreground animate-spin" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <span className="relative px-3 bg-surface text-[11px] font-mono uppercase tracking-widest text-muted">
                or
              </span>
            </div>

            {!showEmailForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(true);
                  setErrorMsg(null);
                }}
                className="w-full text-center text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground py-2 transition-colors cursor-pointer"
              >
                Sign in with Email & Password
              </button>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Alex Morgan"
                      className="w-full px-3 py-2 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="alex@domain.com"
                    className="w-full px-3 py-2 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isEmailLoading}
                  className="w-full h-10 rounded bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer font-medium"
                >
                  {isEmailLoading
                    ? "Processing..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </button>

                <div className="flex justify-between items-center text-xs font-mono pt-1 text-muted">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg(null);
                    }}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    {isSignUp ? "Already registered? Sign in" : "Need an account? Sign up"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(false);
                      setErrorMsg(null);
                    }}
                    className="hover:text-foreground transition-colors cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background select-none p-6">
          <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
