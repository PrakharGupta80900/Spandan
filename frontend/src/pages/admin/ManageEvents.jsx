import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus,
  FiUsers, FiCalendar, FiArrowLeft, FiRefreshCw,
} from "react-icons/fi";

const CATEGORY_COLORS = {
  Dance: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Music: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  "Fine Arts": "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Literary: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Dramatics: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Other: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
};

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const { data } = await API.get("/admin/events");
      setEvents(data);
    } catch {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
        <Link to="/admin" className="text-[#41431B]/80 hover:text-[#41431B] transition">
          <FiArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-[#41431B] flex-1">Manage Events</h1>
        <button
          onClick={fetchEvents}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={15} />
          {refreshing ? "Refreshing" : "Refresh"}
        </button>
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
          <FiCalendar size={40} className="mx-auto text-[#41431B]/70 mb-3" />
          <p className="text-[#41431B]/80 mb-4">No events yet.</p>
          <Link to="/admin/events/new" className="btn-primary inline-block">Create First Event</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className={`card p-4 flex gap-4 items-center transition ${!event.isListed ? "opacity-60" : ""}`}>
              {event.image?.url ? (
                <img src={event.image.url} alt={event.title} className="w-16 h-12 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-16 h-12 bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg shrink-0 flex items-center justify-center">
                  <FiCalendar className="text-[#41431B]/70" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#41431B] truncate">{event.title}</h3>
                  <span className={`badge ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                    {event.category}
                  </span>
                  <span className={`badge ${event.isListed ? "bg-[#AEB784] !text-black border border-[#41431B]/30" : "bg-[#E3DBBB] text-red-700 border border-red-700/40"}`}>
                    {event.isListed ? "Listed" : "Unlisted"}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-[#41431B]/80 mt-1">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={11} />
                    {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers size={11} />
                    {event.registeredCount}/{event.maxParticipants}
                  </span>
                  {event.participationType === "group" && event.theme && (
                    <span className="truncate">Theme: {event.theme}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={`/admin/events/${event._id}/registrations`}
                  className="p-2 text-[#41431B]/80 hover:text-[#41431B] hover:bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg transition"
                  title="View registrations"
                >
                  <FiUsers size={15} />
                </Link>
                <Link
                  to={`/admin/events/${event._id}/edit`}
                  className="p-2 text-[#41431B]/80 hover:text-[#41431B] hover:bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg transition"
                  title="Edit"
                >
                  <FiEdit2 size={15} />
                </Link>
                <button
                  onClick={() => handleToggle(event._id)}
                  className={`p-2 rounded-lg transition ${event.isListed ? "text-[#41431B] hover:bg-[#E3DBBB] border border-[#41431B]/30" : "text-[#41431B]/70 hover:bg-[#E3DBBB] border border-[#41431B]/30 hover:text-[#41431B]"}`}
                  title={event.isListed ? "Unlist" : "List"}
                >
                  {event.isListed ? <FiEye size={15} /> : <FiEyeOff size={15} />}
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="p-2 text-[#41431B]/70 hover:text-red-700 hover:bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg transition"
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

