import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiSave, FiUser } from "react-icons/fi";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    phone: user?.phone || "",
    college: user?.college || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put("/auth/profile", form);
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#41431B] mb-8">Edit Profile</h1>

      {/* Identity Info (read-only from Google) */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full ring-2 ring-[#41431B]" />
          ) : (
            <div className="w-16 h-16 bg-[#AEB784] rounded-full flex items-center justify-center text-2xl font-bold !text-black">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[#41431B] font-semibold text-lg">{user?.name}</p>
            <p className="text-[#41431B]/80 text-sm">{user?.email}</p>
            <span className="badge bg-[#E3DBBB] border border-[#41431B]/30 !text-black mt-1">{user?.pid}</span>
          </div>
        </div>
        <p className="text-xs text-[#41431B]/70 mt-4 flex items-center gap-1">
          <FiUser size={11} /> Name and email are managed by your Google account.
        </p>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h2 className="font-semibold text-[#41431B]">Additional Information</h2>

        <div>
          <label className="block text-sm text-[#41431B] mb-1.5">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm text-[#41431B] mb-1.5">College / Institution</label>
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={handleChange}
            placeholder="Your college name"
            className="input"
          />
        </div>

        <button type="submit" className="btn-primary !bg-[#AEB784] !text-black hover:!bg-[#9ea876] flex items-center gap-2" disabled={saving}>
          <FiSave size={15} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
