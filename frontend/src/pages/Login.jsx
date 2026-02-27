import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const error = new URLSearchParams(location.search).get("error");

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = !form.email || emailRegex.test(form.email);
  const pwdValid = !form.password || form.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill all fields");
    if (!emailRegex.test(form.email)) return toast.error("Enter a valid email address");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success("Logged in!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-[#AEB784]">
      <div className="w-full max-w-md">
        <div className="card p-8 !bg-white/20 backdrop-blur-xl border border-white/35 shadow-[0_20px_50px_rgba(65,67,27,0.25)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E3DBBB] to-[#AEB784] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="!text-black font-black text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your Spandan 2026 account</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
              Authentication failed. Please try again.
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
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
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={12} /> Enter a valid email</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {form.password && !pwdValid && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><FiAlertCircle size={12} /> Must be at least 6 characters</p>
              )}
            </div>

            <button type="submit" disabled={submitting || (form.email && !emailValid) || (form.password && !pwdValid)} className="btn-primary w-full">
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

