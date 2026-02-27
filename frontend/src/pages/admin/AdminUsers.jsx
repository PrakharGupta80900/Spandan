import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { FiArrowLeft, FiSearch, FiDownload, FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async ({ initial = false } = {}) => {
    if (initial) setLoading(true);
    setRefreshing(true);
    try {
      const { data } = await API.get("/admin/users", { params: { _t: Date.now() } });
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load users");
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers({ initial: true });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.pid?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (user) => {
    const confirm = window.confirm(`Delete user ${user.name} (${user.pid}) and all their registrations? This cannot be undone.`);
    if (!confirm) return;

    setDeletingId(user._id);
    try {
      await API.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    } finally {
      setDeletingId("");
    }
  };

  const exportCSV = () => {
    const headers = ["PID", "Name", "Email", "Phone", "College", "Joined"];
    const rows = filtered.map((u) => [u.pid, u.name, u.email, u.phone, u.college, new Date(u.createdAt).toLocaleDateString("en-IN")]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "spandan2026-users.csv"; a.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-[#41431B]/80 hover:text-[#41431B]"><FiArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-bold text-[#41431B] flex-1">All Participants</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41431B]/70" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 max-w-xs" placeholder="Search by name, email, PID..." />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FiUsers size={40} className="mx-auto text-[#41431B]/70 mb-3" />
          <p className="text-[#41431B]/80">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#41431B]/20">
            <p className="text-sm text-[#41431B]/80">{filtered.length} participants</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#41431B]/20 bg-[#E3DBBB]">
                          {["PID", "Name", "Email", "Phone", "College", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#41431B]/70 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#41431B]/15">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-[#E3DBBB]">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs !text-black bg-[#E3DBBB] border border-[#41431B]/30 px-2 py-0.5 rounded">{u.pid}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt={u.name} />
                        ) : (
                          <div className="w-7 h-7 bg-[#AEB784] rounded-full text-xs font-bold flex items-center justify-center !text-black">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-[#41431B] whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#41431B]/80 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 text-[#41431B]/80 whitespace-nowrap">{u.phone || "-"}</td>
                    <td className="px-4 py-3 text-[#41431B]/80 max-w-[160px] truncate">{u.college || "-"}</td>
                    <td className="px-4 py-3 text-[#41431B]/70 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        disabled={!!deletingId}
                        title="Delete user"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


