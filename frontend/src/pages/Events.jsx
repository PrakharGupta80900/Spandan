import { useState, useEffect } from "react";
import API from "../api/axios";
import EventCard from "../components/EventCard";
import { FiSearch, FiFilter } from "react-icons/fi";

const CATEGORIES = ["All", "Dance", "Music", "Fine Arts", "Literary", "Dramatics"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== "All") params.category = category;
        if (search.trim()) params.search = search;
        const { data } = await API.get("/events", { params });
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-white">All Events</h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-64"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? "bg-[#F8F3E1] text-black border border-black/20"
                : "bg-[#F8F3E1] text-black border border-black/15 hover:bg-[#E3DBBB]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-900" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <FiFilter size={40} className="mx-auto mb-3" />
          <p className="text-lg">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
