import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiUser, FiHash, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiShield, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";

const COLLEGES = [
  "SRMS CET&R",
  "SRMS NURSING",
  "CET",
  "SRMS IMS",
  "SRMS IPS",
  "SRMS IBS",
  "SRMS UNNAO",
  "Others",
];

export default function Signup() {
  const { user, sendSignupOtp, verifySignupOtp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [otp, setOtp] = useState(["" , "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rollNumber: "",
    college: "",
  });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "rollNumber") {
      setForm({ ...form, rollNumber: value.replace(/\D/g, "") });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  // Validation helpers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = !form.email || emailRegex.test(form.email);
  const pwdHasLength = form.password.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(form.password);
  const pwdHasNumber = /\d/.test(form.password);
  const pwdHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password);
  const pwdAllValid = pwdHasLength && pwdHasUpper && pwdHasNumber && pwdHasSpecial;
  const pwdMatch = form.password === form.confirmPassword;
  const formReady = form.name && form.email && form.password && form.rollNumber && form.college && emailValid && pwdAllValid && pwdMatch;

  // ── STEP 1: Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formReady) return;

    setSubmitting(true);
    try {
      const { confirmPassword: _, ...signupData } = form;
      await sendSignupOtp(signupData);
      toast.success("OTP sent to your email!");
      setStep(2);
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // ── STEP 2: Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return toast.error("Enter the 6-digit OTP");

    setSubmitting(true);
    try {
      const { confirmPassword: _, ...signupData } = form;
      await verifySignupOtp(signupData, otpString);
      toast.success("Account created! Welcome to Spandan 2026");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (cooldown > 0) return;
    setSubmitting(true);
    try {
      const { confirmPassword: _, ...signupData } = form;
      await sendSignupOtp(signupData);
      toast.success("New OTP sent!");
      setOtp(["", "", "", "", "", ""]);
      setCooldown(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (value && index === 5 && updated.every((d) => d)) {
      setTimeout(() => handleVerifyOtp(), 150);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otp];
    for (let i = 0; i < 6; i++) updated[i] = pasted[i] || "";
    setOtp(updated);
    const nextEmpty = updated.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    if (pasted.length === 6) setTimeout(() => handleVerifyOtp(), 150);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 bg-[#AEB784]">
      <div className="w-full max-w-lg">
        <div className="card p-8 !bg-white/20 backdrop-blur-xl border border-white/35 shadow-[0_20px_50px_rgba(65,67,27,0.25)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E3DBBB] to-[#AEB784] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="!text-black font-black text-xl">{step === 1 ? "S" : <FiShield size={24} />}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {step === 1 ? "Create Your Account" : "Verify Your Email"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {step === 1 ? "Join Spandan 2026" : `We sent a 6-digit code to ${form.email}`}
            </p>
          </div>

          {/* ── STEP 1: Signup Form ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full Name *</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="input pl-10" required />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email Address *</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={`input pl-10 ${form.email && !emailValid ? 'ring-2 ring-red-500' : ''}`} required />
                  {form.email && !emailValid && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={12} /> Enter a valid email address</p>
                  )}
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type={showPwd ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="Min 8 chars" className="input pl-10 pr-10" required minLength={8} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPwd ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className={`text-xs flex items-center gap-1 ${pwdHasLength ? 'text-green-400' : 'text-gray-500'}`}>{pwdHasLength ? <FiCheck size={11} /> : <FiAlertCircle size={11} />} 8+ characters</p>
                      <p className={`text-xs flex items-center gap-1 ${pwdHasUpper ? 'text-green-400' : 'text-gray-500'}`}>{pwdHasUpper ? <FiCheck size={11} /> : <FiAlertCircle size={11} />} One uppercase letter</p>
                      <p className={`text-xs flex items-center gap-1 ${pwdHasNumber ? 'text-green-400' : 'text-gray-500'}`}>{pwdHasNumber ? <FiCheck size={11} /> : <FiAlertCircle size={11} />} One number</p>
                      <p className={`text-xs flex items-center gap-1 ${pwdHasSpecial ? 'text-green-400' : 'text-gray-500'}`}>{pwdHasSpecial ? <FiCheck size={11} /> : <FiAlertCircle size={11} />} One special character</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type={showPwd ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" className={`input pl-10 ${form.confirmPassword && !pwdMatch ? 'ring-2 ring-red-500' : ''}`} required />
                    {form.confirmPassword && !pwdMatch && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={12} /> Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Roll Number *</label>
                <div className="relative">
                  <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input type="text" name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="e.g. 230104" inputMode="numeric" pattern="[0-9]*" className="input pl-10" required />
                </div>
              </div>

              {/* College */}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">College / Institution *</label>
                <select name="college" value={form.college} onChange={handleChange} className="input" required>
                  <option value="">Select College</option>
                  {COLLEGES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={submitting || !formReady} className="btn-primary w-full mt-2">
                {submitting ? "Sending OTP..." : "Send Verification Code"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/15 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-[#AEB784] focus:border-transparent transition-all"
                  />
                ))}
              </div>

              <p className="text-center text-xs text-gray-400">
                Didn&apos;t receive the code?{" "}
                {cooldown > 0 ? (
                  <span className="text-gray-500">Resend in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResend} disabled={submitting} className="text-[#E3DBBB] hover:text-white font-medium underline underline-offset-2">
                    Resend OTP
                  </button>
                )}
              </p>

              <button type="submit" disabled={submitting || otp.join("").length !== 6} className="btn-primary w-full">
                {submitting ? "Verifying..." : "Verify & Create Account"}
              </button>

              <button type="button" onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }} className="w-full text-center text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
                <FiArrowLeft size={14} /> Back to form
              </button>
            </form>
          )}

          {/* Login link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

