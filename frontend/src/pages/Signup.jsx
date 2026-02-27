import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

const COLLEGES = ["SRMS CET&R", "SRMS NURSING", "CET", "SRMS IMS", "SRMS IPS"];

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    college: "",
  });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Validation helpers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = !form.email || emailRegex.test(form.email);
  const pwdHasLength = form.password.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(form.password);
  const pwdHasNumber = /\d/.test(form.password);
  const pwdHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password);
  const pwdAllValid = pwdHasLength && pwdHasUpper && pwdHasNumber && pwdHasSpecial;
  const pwdMatch = form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return toast.error("Name, email and password are required");
    }
    if (!emailRegex.test(form.email)) {
      return toast.error("Enter a valid email address");
    }
    if (!pwdAllValid) {
      return toast.error("Password must be 8+ chars with an uppercase letter, a number, and a special character");
    }
    if (!pwdMatch) {
      return toast.error("Passwords do not match");
    }

    setSubmitting(true);
    try {
      const { confirmPassword, ...signupData } = form;
      await signup(signupData);
      toast.success("Account created! Welcome to Spandan 2026");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 bg-[#AEB784]">
      <div className="w-full max-w-lg">
        <div className="card p-8 !bg-white/20 backdrop-blur-xl border border-white/35 shadow-[0_20px_50px_rgba(65,67,27,0.25)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E3DBBB] to-[#AEB784] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="!text-black font-black text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="text-gray-400 text-sm mt-1">
              Join Spandan 2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full Name *</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email Address *</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input pl-10 ${form.email && !emailValid ? 'ring-2 ring-red-500' : ''}`}
                  required
                />
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
                  <input
                    type={showPwd ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars"
                    className="input pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
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
                  <input
                    type={showPwd ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
className={`input pl-10 ${form.confirmPassword && !pwdMatch ? 'ring-2 ring-red-500' : ''}`}
                  required
                  />
                  {form.confirmPassword && !pwdMatch && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={12} /> Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* College */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">College / Institution</label>
              <select name="college" value={form.college} onChange={handleChange} className="input">
                <option value="">Select College</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={submitting || (form.email && !emailValid) || (form.password && !pwdAllValid) || (form.confirmPassword && !pwdMatch)} className="btn-primary w-full mt-2">
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

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

