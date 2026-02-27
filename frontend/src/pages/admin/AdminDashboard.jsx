import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { FiCalendar, FiUsers, FiList, FiCheckSquare, FiRefreshCw } from "react-icons/fi";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4`}>
        <Icon size={20} className="!text-black" />
      </div>
      <p className="text-[#41431B]/80 text-sm">{label}</p>
      <p className="text-3xl font-black text-[#41431B] mt-1">{value ?? <span className="text-[#41431B]/70">-</span>}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const { data } = await API.get("/admin/stats", { params: { _t: Date.now() } });
      setStats(data);
    } catch (err) {
      // keep previous stats on error
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#41431B]">Admin Dashboard</h1>
          <p className="text-[#41431B]/80 mt-1">Spandan 2026 Control Panel</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <Link to="/admin/events/new" className="btn-primary flex items-center gap-2 text-sm">+ New Event</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Total Events" value={stats?.totalEvents} color="bg-[#E3DBBB] border border-[#41431B]/30" />
        <StatCard icon={FiCheckSquare} label="Listed Events" value={stats?.listedEvents} color="bg-[#AEB784] border border-[#41431B]/30" />
        <StatCard icon={FiUsers} label="Registered Users" value={stats?.totalUsers} color="bg-[#E3DBBB] border border-[#41431B]/30" />
        <StatCard icon={FiList} label="Registrations" value={stats?.totalRegistrations} color="bg-[#AEB784] border border-[#41431B]/30" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/events" className="card p-6 hover:border-[#41431B]/40 transition group">
          <FiCalendar className="text-[#41431B] mb-3" size={24} />
          <h3 className="font-bold text-[#41431B] text-lg">Manage Events</h3>
          <p className="text-[#41431B]/80 text-sm mt-1">Create, edit, list, unlist or delete events</p>
        </Link>
        <Link to="/admin/users" className="card p-6 hover:border-[#41431B]/40 transition group">
          <FiUsers className="text-[#41431B] mb-3" size={24} />
          <h3 className="font-bold text-[#41431B] text-lg">View Users</h3>
          <p className="text-[#41431B]/80 text-sm mt-1">Browse all registered participants</p>
        </Link>
      </div>
    </div>
  );
}

