import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus,
  FiUsers, FiCalendar, FiArrowLeft,
} from "react-icons/fi";

const CATEGORY_COLORS = {
  Dance: "bg-pink-900/60 text-pink-300",
  Music: "bg-blue-900/60 text-blue-300",
  "Fine Arts": "bg-orange-900/60 text-orange-300",
  Literary: "bg-yellow-900/60 text-yellow-300",
  Dramatics: "bg-red-900/60 text-red-300",
  Other: "bg-gray-800 text-gray-300",
};

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/events")
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const { data } = await API.patch(`/admin/events/${id}/toggle`);
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? { ...e, isListed: data.isListed } : e))
      );
      toast.success(data.message);
    } catch {
      toast.error("Failed to toggle event");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event and all its registrations? This cannot be undone.")) return;
    try {
      await API.delete(`/admin/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-gray-400 hover:text-white transition">
          <FiArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-white flex-1">Manage Events</h1>
        <Link to="/admin/events/new" className="btn-primary flex items-center gap-2">
          <FiPlus size={15} /> New Event
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <FiCalendar size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 mb-4">No events yet.</p>
          <Link to="/admin/events/new" className="btn-primary inline-block">Create First Event</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className={`card p-4 flex gap-4 items-center transition ${!event.isListed ? "opacity-60" : ""}`}>
              {event.image?.url ? (
                <img src={event.image.url} alt={event.title} className="w-16 h-12 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-16 h-12 bg-gray-800 rounded-lg shrink-0 flex items-center justify-center">
                  <FiCalendar className="text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white truncate">{event.title}</h3>
                  <span className={`badge ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                    {event.category}
                  </span>
                  <span className={`badge ${event.isListed ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300"}`}>
                    {event.isListed ? "Listed" : "Unlisted"}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={11} />
                    {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers size={11} />
                    {event.registeredCount}/{event.maxParticipants}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={`/admin/events/${event._id}/registrations`}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                  title="View registrations"
                >
                  <FiUsers size={15} />
                </Link>
                <Link
                  to={`/admin/events/${event._id}/edit`}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                  title="Edit"
                >
                  <FiEdit2 size={15} />
                </Link>
                <button
                  onClick={() => handleToggle(event._id)}
                  className={`p-2 rounded-lg transition ${event.isListed ? "text-green-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-800 hover:text-green-400"}`}
                  title={event.isListed ? "Unlist" : "List"}
                >
                  {event.isListed ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
                  title="Delete"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
