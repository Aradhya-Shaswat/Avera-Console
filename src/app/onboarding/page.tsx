"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/lib/auth/use-profile";
import { emailOtp } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, User, Minus, Plus, Mail, ShieldCheck, RefreshCw } from "lucide-react";

interface StepperControlProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  subtitle?: string;
}

function StepperControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  subtitle,
}: StepperControlProps) {
  function handleDecrement() {
    const next = step < 1 ? +(value - step).toFixed(1) : value - step;
    if (next >= min) {
      onChange(next);
    }
  }

  function handleIncrement() {
    const next = step < 1 ? +(value + step).toFixed(1) : value + step;
    if (next <= max) {
      onChange(next);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono uppercase tracking-wider text-muted font-medium">
          {label}
        </label>
        {unit && <span className="text-[11px] font-mono text-muted/70">{unit}</span>}
      </div>

      <div className="flex items-center border border-border rounded overflow-hidden bg-surface-raised/40 hover:border-foreground/30 transition-colors">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised active:scale-90 transition-all select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1 flex items-center justify-center border-x border-border/50 py-2">
          <input
            type="text"
            inputMode="decimal"
            value={step < 1 ? value.toFixed(1) : String(value)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= min && val <= max) {
                onChange(val);
              }
            }}
            className="w-full text-center bg-transparent font-mono text-base font-medium text-foreground focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised active:scale-90 transition-all select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {subtitle && (
        <span className="text-[11px] font-mono text-muted/70 mt-1 block">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, isLoading, refetch, updateProfile } = useUserProfile();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [age, setAge] = useState(28);
  const [weightKg, setWeightKg] = useState(72);
  const [maxHr, setMaxHr] = useState(188);
  const [sleepGoalHours, setSleepGoalHours] = useState(8.0);

  const isGoogleAccount = user?.image?.includes("googleusercontent.com") || false;
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    valid: boolean;
    available: boolean;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (isGoogleAccount || user.emailVerified) {
      setIsEmailVerified(true);
    }

    if (profile) {
      if (profile.onboardingCompleted) {
        router.replace("/");
        return;
      }
      setFullName(profile.fullName || user.name || "");
      setUsername(profile.username || "");
      setAvatarUrl(profile.avatarUrl || user.image || "");
      if (profile.age) setAge(profile.age);
      if (profile.weightKg) setWeightKg(profile.weightKg);
      if (profile.maxHr) setMaxHr(profile.maxHr);
      if (profile.sleepGoalHours) setSleepGoalHours(profile.sleepGoalHours);
      if (profile.onboardingStep && profile.onboardingStep > 1) {
        setStep(profile.onboardingStep);
      }
    } else if (user) {
      setFullName(user.name || "");
      setAvatarUrl(user.image || "");
    }
  }, [user, profile, isLoading, isGoogleAccount, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setUsernameStatus(data);
      } catch {
        setUsernameStatus(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  async function handleVerifyOtp(codeToVerify: string) {
    if (!user?.email) return;
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      setOtpError("Please enter the verification code from your email.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await emailOtp.verifyEmail({
        email: user.email,
        otp: cleanCode,
      });

      if (res?.error) {
        setOtpError(res.error.message || "Invalid or expired verification code.");
        setIsVerifyingOtp(false);
        return;
      }

      setIsEmailVerified(true);
      setOtpSuccess("Email verified successfully.");
      setOtpCode("");
      refetch();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!user?.email || resendCooldown > 0 || isSendingOtp) return;

    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email: user.email,
        type: "email-verification",
      });

      if (res?.error) {
        setOtpError(res.error.message || "Failed to send verification code.");
        return;
      }

      setOtpSuccess("A new verification code has been sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send code.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleNextStep() {
    setErrorMsg(null);

    if (step === 1) {
      if (!isEmailVerified && !isGoogleAccount) {
        setErrorMsg("Please verify your email using the verification code sent to your inbox.");
        return;
      }
      if (!fullName.trim()) {
        setErrorMsg("Please provide your full name.");
        return;
      }
      if (!username.trim() || username.trim().length < 3) {
        setErrorMsg("Handle must be at least 3 characters.");
        return;
      }
      if (usernameStatus && !usernameStatus.available) {
        setErrorMsg("This handle is already taken. Please choose another.");
        return;
      }

      try {
        setIsSubmitting(true);
        await updateProfile({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          avatarUrl: avatarUrl.trim() || null,
          onboardingStep: 2,
        });
        setStep(2);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to save information.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === 2) {
      if (age < 12 || age > 110) {
        setErrorMsg("Please enter a valid age between 12 and 110.");
        return;
      }
      if (weightKg < 30 || weightKg > 250) {
        setErrorMsg("Please enter a valid weight in kg.");
        return;
      }
      if (maxHr < 120 || maxHr > 230) {
        setErrorMsg("Please enter a valid max heart rate.");
        return;
      }

      try {
        setIsSubmitting(true);
        await updateProfile({
          age,
          weightKg,
          maxHr,
          sleepGoalHours,
          onboardingStep: 3,
        });
        setStep(3);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to save baselines.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleComplete() {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await updateProfile({
        onboardingCompleted: true,
        onboardingStep: 3,
      });
      router.replace("/");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to complete onboarding.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background select-none p-6">
        <div className="h-6 w-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background select-none p-4 sm:p-6">
      <div className="w-full max-w-xl bg-surface border border-border-subtle p-8 md:p-10 shadow-sm rounded-lg space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <span className="font-display text-2xl md:text-3xl tracking-tight text-foreground font-normal">
                Onboarding
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { num: 1, label: "Identity" },
                { num: 2, label: "Biometrics" },
                { num: 3, label: "Review" },
              ].map(({ num, label }) => {
                const isCurrent = step === num;
                const isCompleted = step > num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (num < step) setStep(num);
                    }}
                    disabled={num > step}
                    title={num < step ? `Back to ${label}` : undefined}
                    className={cn(
                      "h-7 px-2.5 sm:px-3 rounded-full flex items-center gap-1.5 text-xs font-mono transition-all select-none",
                      isCurrent
                        ? "bg-foreground text-background font-medium shadow-sm"
                        : isCompleted
                        ? "bg-surface-raised border border-border text-foreground hover:bg-surface-raised/80 hover:border-foreground/40 cursor-pointer active:scale-95"
                        : "bg-surface-raised/40 border border-border-subtle text-muted/40 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3 text-quality-good shrink-0" />
                    ) : (
                      <span className="shrink-0">{num}</span>
                    )}
                    <span className="hidden sm:inline text-[11px] uppercase tracking-wider">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-quality-poor/10 border border-quality-poor/30 text-quality-poor text-xs font-mono rounded">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 p-4 rounded bg-surface-raised/40 border border-border-subtle">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt={fullName || "User"}
                  className="h-14 w-14 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted uppercase tracking-wider">
                    Connected Account
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border",
                      isEmailVerified || isGoogleAccount
                        ? "bg-quality-good/10 text-quality-good border-quality-good/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    )}
                  >
                    {isGoogleAccount
                      ? "Google SSO"
                      : isEmailVerified
                      ? "Verified Email"
                      : "Verification Pending"}
                  </span>
                </div>
                <span className="text-sm font-sans text-foreground font-medium block">
                  {user?.email}
                </span>
              </div>
            </div>

            {!isEmailVerified && !isGoogleAccount ? (
              <div className="p-4 rounded-lg bg-surface-raised/40 border border-border space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-foreground" />
                      <span className="text-xs font-mono uppercase tracking-wider text-foreground font-medium">
                        Email Verification
                      </span>
                      <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Code Required
                      </span>
                    </div>
                    <p className="text-xs text-muted font-sans leading-relaxed">
                      A verification code was sent to <span className="font-mono text-foreground">{user?.email}</span>. Enter the code below to verify your account.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={12}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value);
                          if (otpError) setOtpError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otpCode.trim().length >= 4) {
                            e.preventDefault();
                            handleVerifyOtp(otpCode);
                          }
                        }}
                        placeholder="Enter verification code"
                        className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-sm font-mono tracking-wider text-foreground placeholder:tracking-normal placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleVerifyOtp(otpCode)}
                      disabled={isVerifyingOtp || otpCode.trim().length < 4}
                      className="px-4 py-2.5 rounded bg-foreground text-background text-xs font-mono uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium shrink-0 flex items-center gap-1.5"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <div className="h-3 w-3 rounded-full border-2 border-background border-t-transparent animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify Code <Check className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className="text-muted hover:text-foreground underline underline-offset-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-all flex items-center gap-1.5"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Sending new code...
                        </>
                      ) : resendCooldown > 0 ? (
                        `Resend code in ${resendCooldown}s`
                      ) : (
                        "Didn't get the code? Resend verification code"
                      )}
                    </button>
                  </div>

                  {otpError && (
                    <p className="text-xs font-mono text-quality-poor animate-fade-in pt-1">
                      {otpError}
                    </p>
                  )}

                  {otpSuccess && (
                    <p className="text-xs font-mono text-quality-good animate-fade-in pt-1 flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> {otpSuccess}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded bg-quality-good/5 border border-quality-good/25 text-quality-good text-xs font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Email verified & authenticated</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5 font-medium">
                  Full Name <span className="text-quality-poor">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted font-medium">
                    Unique Handle / Username <span className="text-quality-poor">*</span>
                  </label>
                  {isCheckingUsername ? (
                    <span className="text-[11px] font-mono text-muted">Checking...</span>
                  ) : usernameStatus ? (
                    <span
                      className={cn(
                        "text-[11px] font-mono",
                        usernameStatus.available ? "text-quality-good" : "text-quality-poor"
                      )}
                    >
                      {usernameStatus.message}
                    </span>
                  ) : null}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-mono text-muted select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="alexmorgan"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-mono text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5 font-medium">
                  Avatar Image URL <span className="text-muted/60">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-surface-raised/40 border border-border rounded text-sm font-sans text-foreground placeholder:text-muted/60 focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <StepperControl
                label="Age"
                unit="Years"
                value={age}
                onChange={setAge}
                min={12}
                max={110}
                step={1}
              />

              <StepperControl
                label="Weight"
                unit="kg"
                value={weightKg}
                onChange={setWeightKg}
                min={30}
                max={250}
                step={1}
              />

              <StepperControl
                label="Max Heart Rate"
                unit="bpm"
                value={maxHr}
                onChange={setMaxHr}
                min={120}
                max={230}
                step={1}
                subtitle={`Formula baseline: 220 − age (${220 - age} bpm)`}
              />

              <StepperControl
                label="Sleep Target"
                unit="Hours"
                value={sleepGoalHours}
                onChange={setSleepGoalHours}
                min={4.0}
                max={12.0}
                step={0.5}
                subtitle="Nightly restorative cycle target"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="divide-y divide-border-subtle border border-border-subtle rounded overflow-hidden">
              <div className="flex items-center justify-between p-3.5 bg-surface-raised/20 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <span className="text-xs font-mono text-muted block">Athlete</span>
                  <span className="text-sm font-sans font-medium text-foreground">{fullName} (@{username})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-mono text-muted hover:text-foreground underline underline-offset-4 cursor-pointer active:scale-95 transition-all"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-raised/20 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <span className="text-xs font-mono text-muted block">Account Email</span>
                  <span className="text-sm font-sans text-foreground">{user?.email}</span>
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-quality-good/10 text-quality-good border border-quality-good/30 flex items-center gap-1">
                  <Check className="h-2.5 w-2.5" /> Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-raised/20 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <span className="text-xs font-mono text-muted block">Age & Weight</span>
                  <span className="text-sm font-mono text-foreground">{age} yrs · {weightKg} kg</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-mono text-muted hover:text-foreground underline underline-offset-4 cursor-pointer active:scale-95 transition-all"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-raised/20 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <span className="text-xs font-mono text-muted block">Max HR Ceiling</span>
                  <span className="text-sm font-mono text-foreground">{maxHr} bpm</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-mono text-muted hover:text-foreground underline underline-offset-4 cursor-pointer active:scale-95 transition-all"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-raised/20 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <span className="text-xs font-mono text-muted block">Sleep Target</span>
                  <span className="text-sm font-mono text-foreground">{sleepGoalHours.toFixed(1)} hours / night</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-mono text-muted hover:text-foreground underline underline-offset-4 cursor-pointer active:scale-95 transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2.5 rounded border border-border text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground hover:bg-surface-raised active:scale-[0.97] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-foreground text-background text-xs font-mono uppercase tracking-wider hover:opacity-90 active:scale-[0.97] shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded bg-foreground text-background text-xs font-mono uppercase tracking-wider hover:opacity-90 active:scale-[0.97] shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-background border-t-transparent animate-spin" />
                  Finalizing Setup...
                </>
              ) : (
                <>
                  Complete Setup <Check className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
