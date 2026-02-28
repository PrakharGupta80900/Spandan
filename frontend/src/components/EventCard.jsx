import { Link } from "react-router-dom";
import { FiCalendar, FiMapPin, FiUsers } from "react-icons/fi";

const CATEGORY_COLORS = {
  Dance: "bg-[#E3DBBB] !text-black",
  Music: "bg-[#E3DBBB] !text-black",
  "Fine Arts": "bg-[#E3DBBB] !text-black",
  Literary: "bg-[#E3DBBB] !text-black",
  Dramatics: "bg-[#E3DBBB] !text-black",
  Other: "bg-[#E3DBBB] !text-black",
};

export default function EventCard({ event }) {
  const spotsLeft = event.maxParticipants - event.registeredCount;
  const isFull = spotsLeft <= 0;
  const fillPercent = Math.min((event.registeredCount / event.maxParticipants) * 100, 100);

  return (
    <Link
      to={`/events/${event._id}`}
      className="group card border border-[#41431B] overflow-hidden hover:border-[#41431B] transition-all duration-300 hover:shadow-xl hover:shadow-primary-900/20 block"
    >
      {/* Image */}
      <div className="relative h-44 bg-[#E3DBBB] overflow-hidden">
        {event.image?.url ? (
          <img
            src={event.image.url}
            alt={event.title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiCalendar size={40} className="text-[#41431B]" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other} font-medium`}>
            {event.category}
          </span>
        </div>
        {isFull && (
          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
            <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">FULL</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-white text-lg leading-snug mb-2 group-hover:text-primary-300 transition line-clamp-2">
          {event.title}
        </h3>
        {event.participationType === "group" && event.theme && (
          <p className="text-[#E3DBBB] text-xs mb-2 line-clamp-1">Theme: {event.theme}</p>
        )}
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{event.description}</p>

        <div className="space-y-1.5 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <FiCalendar size={13} className="text-primary-400 shrink-0" />
            <span>{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            {event.time && <span className="text-gray-500">- {event.time}</span>}
          </div>
          <div className="flex items-center gap-2">
            <FiMapPin size={13} className="text-primary-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>
        {/* Spots */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="flex items-center gap-1"><FiUsers size={11} /> {event.registeredCount}/{event.maxParticipants} registered</span>
            <span className={isFull ? "text-red-400" : spotsLeft <= 5 ? "text-yellow-400" : "text-green-400"}>
              {isFull ? "Full" : `${spotsLeft} spots left`}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${isFull ? "bg-red-500" : fillPercent > 75 ? "bg-yellow-500" : "bg-primary-500"}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

