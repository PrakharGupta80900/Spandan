import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiCalendar, FiMapPin, FiX, FiUser, FiCopy } from "react-icons/fi";

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/registrations/my/all")
      .then(({ data }) => setRegistrations(data))
      .catch(() => toast.error("Failed to load registrations"))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (eventId) => {
    if (!confirm("Cancel this registration?")) return;
    try {
      await API.delete(`/registrations/${eventId}`);
      setRegistrations((prev) =>
        prev.filter((r) => r.event._id !== eventId)
      );
      toast.success("Registration cancelled");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel");
    }
  };

  const copyPid = () => {
    navigator.clipboard.writeText(user.pid);
    toast.success("PID copied!");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* User Card */}
      <div className="card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-primary-500" />
        ) : (
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          {user?.college && <p className="text-gray-500 text-sm">{user.college} • {user.department}</p>}
        </div>
        <div className="text-center bg-primary-900/40 border border-primary-700/50 rounded-xl px-6 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Participant ID</p>
          <div className="flex items-center gap-2">
            <p className="text-primary-300 font-mono font-bold text-xl">{user?.pid || "—"}</p>
            {user?.pid && (
              <button onClick={copyPid} className="text-gray-500 hover:text-primary-400 transition">
                <FiCopy size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Registrations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Registrations</h2>
          <span className="badge bg-primary-900 text-primary-300">{registrations.length} events</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <div className="card p-12 text-center">
            <FiCalendar size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">You haven't registered for any events yet.</p>
            <Link to="/" className="btn-primary inline-block">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => (
              <div key={reg._id} className="card p-4 flex gap-4 items-start hover:border-gray-700 transition">
                {reg.event.image?.url ? (
                  <img src={reg.event.image.url} alt={reg.event.title} className="w-20 h-16 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-16 bg-primary-900 rounded-lg flex items-center justify-center shrink-0">
                    <FiCalendar className="text-primary-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/events/${reg.event._id}`} className="font-semibold text-white hover:text-primary-300 transition truncate">
                      {reg.event.title}
                    </Link>
                    <span className="badge bg-green-900/60 text-green-300 shrink-0">Confirmed</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={11} />
                      {new Date(reg.event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMapPin size={11} />
                      {reg.event.venue}
                    </span>
                    <span className="text-primary-400 font-mono">PID {reg.pid}</span>
                    {reg.tid && <span className="text-orange-400 font-mono font-bold">TID: {reg.tid}</span>}
                    {reg.teamName && <span className="text-orange-300">{reg.teamName}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(reg.event._id)}
                  className="text-gray-600 hover:text-red-400 transition shrink-0 p-1"
                  title="Cancel registration"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
