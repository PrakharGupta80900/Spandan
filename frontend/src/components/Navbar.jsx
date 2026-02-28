import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FiMenu, FiX, FiLogOut, FiSettings,
  FiHome, FiCalendar, FiGrid, FiCode,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    const handleClickAway = (e) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [dropdownOpen]);

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b border-jewel-500/20 ${isHome ? "home-nav" : ""}`}
      style={{ backgroundColor: isHome ? "#000000" : "#E3DBBB" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHome ? "bg-[#E3DBBB]" : "bg-[#AEB784]"}`}>
              <span className="!text-black font-black text-xs">S26</span>
            </div>
            <span className={`${isHome ? "!text-white" : ""} font-bold text-lg tracking-tight`}>
              Spandan <span className={isHome ? "!text-white" : "text-accent-300"}>2026</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-sm">
              <FiHome size={15} /> Home
            </Link>
            <Link to="/events" className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-sm">
              <FiCalendar size={15} /> Events
            </Link>
            <Link to="/developer" className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-sm">
              <FiCode size={15} /> Developer
            </Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-sm">
                <FiGrid size={15} /> Admin
              </Link>
            )}
          </div>

          {/* Right - Auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-[#F8F3E1] hover:bg-[#E3DBBB] !text-black rounded-lg px-3 py-2 transition"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 bg-[#AEB784] rounded-full flex items-center justify-center text-xs font-bold !text-black">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm !text-black font-medium max-w-[120px] truncate">{user.name}</span>
                  {user.pid && (
                    <span className="badge bg-[#E3DBBB] !text-black">{user.pid}</span>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#F8F3E1] border border-[#41431B]/40 rounded-xl shadow-xl py-1 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm !text-black hover:bg-[#E3DBBB] transition"
                    >
                      <FiCalendar size={14} /> My Registrations
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm !text-black hover:bg-[#E3DBBB] transition"
                    >
                      <FiSettings size={14} /> Edit Profile
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm !text-black hover:bg-[#E3DBBB] transition"
                      >
                        <FiGrid size={14} /> Admin Panel
                      </Link>
                    )}
                    <hr className="border-[#41431B]/30 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm !text-[#7f1d1d] hover:bg-[#E3DBBB] transition"
                    >
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-gray-800 px-4 py-4 space-y-3"
          style={{ backgroundColor: isHome ? "#000000" : "#41431B" }}
        >
          <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Home</Link>
          <Link to="/events" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Events</Link>
          <Link to="/developer" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Developer</Link>
          {user?.role === "admin" && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Admin Panel</Link>
          )}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">My Registrations</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-white py-2">Profile</Link>
              <button onClick={handleLogout} className="block text-red-400 py-2">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary block text-center">Get Started</Link>
          )}
        </div>
      )}
    </nav>
  );
}
