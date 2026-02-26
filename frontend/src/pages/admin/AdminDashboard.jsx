import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { FiCalendar, FiUsers, FiList, FiCheckSquare } from "react-icons/fi";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-6">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-black text-white mt-1">{value ?? <span className="text-gray-600">—</span>}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get("/admin/stats").then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Spandan 2026 Control Panel</p>
        </div>
        <Link to="/admin/events/new" className="btn-primary">+ New Event</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiCalendar} label="Total Events" value={stats?.totalEvents} color="bg-blue-600" />
        <StatCard icon={FiCheckSquare} label="Listed Events" value={stats?.listedEvents} color="bg-green-600" />
        <StatCard icon={FiUsers} label="Registered Users" value={stats?.totalUsers} color="bg-purple-600" />
        <StatCard icon={FiList} label="Registrations" value={stats?.totalRegistrations} color="bg-orange-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/events" className="card p-6 hover:border-gray-700 transition group">
          <FiCalendar className="text-primary-400 mb-3" size={24} />
          <h3 className="font-bold text-white text-lg group-hover:text-primary-300">Manage Events</h3>
          <p className="text-gray-400 text-sm mt-1">Create, edit, list, unlist or delete events</p>
        </Link>
        <Link to="/admin/users" className="card p-6 hover:border-gray-700 transition group">
          <FiUsers className="text-primary-400 mb-3" size={24} />
          <h3 className="font-bold text-white text-lg group-hover:text-primary-300">View Users</h3>
          <p className="text-gray-400 text-sm mt-1">Browse all registered participants</p>
        </Link>
      </div>
    </div>
  );
}
