import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  FiCalendar, FiMapPin, FiUsers, FiArrowLeft,
  FiCheckCircle, FiPhoneCall, FiInfo, FiPlus, FiX, FiUserPlus,
} from "react-icons/fi";

const CATEGORY_COLORS = {
  Dance: "bg-pink-900/60 text-pink-300",
  Music: "bg-blue-900/60 text-blue-300",
  "Fine Arts": "bg-orange-900/60 text-orange-300",
  Literary: "bg-yellow-900/60 text-yellow-300",
  Dramatics: "bg-red-900/60 text-red-300",
  Other: "bg-gray-800 text-gray-300",
};

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regTid, setRegTid] = useState("");
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [pidInput, setPidInput] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data);
        if (user) {
          // Check registration
          const regs = await API.get("/registrations/my/all");
          setRegistered(regs.data.some((r) => r.event._id === id));
        }
      } catch (err) {
        toast.error("Event not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const addTeamMember = () => {
    const pid = pidInput.trim().toUpperCase();
    if (!pid) return;
    if (pid === user?.pid) return toast.error("You're already the team leader");
    if (teamMembers.some((m) => m.pid === pid)) return toast.error("PID already added");
    setTeamMembers([...teamMembers, { pid }]);
    setPidInput("");
  };

  const removeTeamMember = (pid) => {
    setTeamMembers(teamMembers.filter((m) => m.pid !== pid));
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    const isGroup = event.participationType === "group";

    if (isGroup && !showTeamForm) {
      setShowTeamForm(true);
      return;
    }

    if (isGroup) {
      if (!teamName.trim()) return toast.error("Enter a team name");
      const totalSize = teamMembers.length + 1;
      if (totalSize < (event.teamSize?.min || 2)) {
        return toast.error(`Add at least ${(event.teamSize?.min || 2) - 1} team member(s)`);
      }
      if (totalSize > (event.teamSize?.max || 4)) {
        return toast.error(`Team cannot exceed ${event.teamSize?.max || 4} members`);
      }
    }

    setRegistering(true);
    try {
      const body = isGroup ? { teamName: teamName.trim(), teamMembers } : {};
      const { data } = await API.post(`/registrations/${id}`, body);
      setRegistered(true);
      setShowTeamForm(false);
      if (data.tid) setRegTid(data.tid);
      setEvent((prev) => ({ ...prev, registeredCount: prev.registeredCount + 1 }));
      toast.success(data.tid ? `Registered! Team ID: ${data.tid}` : "Successfully registered!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center pt-24">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!event) return null;

  const spotsLeft = event.maxParticipants - event.registeredCount;
  const isFull = spotsLeft <= 0;
  const fillPercent = Math.min((event.registeredCount / event.maxParticipants) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
        <FiArrowLeft /> Back to Events
      </Link>

      {/* Hero Image */}
      {event.image?.url && (
        <div className="h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <img src={event.image.url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`badge ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                {event.category}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">{event.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <FiCalendar className="text-primary-400" />
              {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {event.time && ` • ${event.time}`}
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <FiMapPin className="text-primary-400" /> {event.venue}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">About this Event</h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {event.rules?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FiInfo className="text-primary-400" /> Rules
              </h2>
              <ul className="space-y-2">
                {event.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
                    <span className="text-primary-400 font-bold shrink-0">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.coordinators?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FiPhoneCall className="text-primary-400" /> Coordinators
              </h2>
              <div className="grid gap-3">
                {event.coordinators.map((c, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-lg p-3 text-sm">
                    <p className="text-white font-medium">{c.name}</p>
                    {c.phone && <p className="text-gray-400">{c.phone}</p>}
                    {c.email && <p className="text-gray-400">{c.email}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Registration Card */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            {/* Event type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge ${event.participationType === "group" ? "bg-orange-900/60 text-orange-300" : "bg-blue-900/60 text-blue-300"}`}>
                {event.participationType === "group" ? <><FiUsers size={11} className="mr-1" />Group Event</> : "Solo Event"}
              </span>
              {event.participationType === "group" && (
                <span className="text-xs text-gray-500">
                  {event.teamSize?.min || 2}–{event.teamSize?.max || 4} members
                </span>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span className="flex items-center gap-1"><FiUsers size={13} /> Participants</span>
                <span>{event.registeredCount}/{event.maxParticipants}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${isFull ? "bg-red-500" : fillPercent > 75 ? "bg-yellow-500" : "bg-primary-500"}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className={`text-sm mt-1 ${isFull ? "text-red-400" : spotsLeft <= 5 ? "text-yellow-400" : "text-green-400"}`}>
                {isFull ? "Event is full" : `${spotsLeft} spots remaining`}
              </p>
            </div>

            {registered ? (
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center bg-green-900/40 border border-green-700 text-green-300 rounded-lg py-3 text-sm font-semibold">
                  <FiCheckCircle /> You're registered!
                </div>
                {regTid && (
                  <div className="mt-3 bg-orange-900/30 border border-orange-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Your Team ID</p>
                    <p className="text-orange-300 font-mono font-bold text-lg">{regTid}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleRegister}
                  disabled={isFull || registering}
                  className="btn-primary w-full"
                >
                  {registering
                    ? "Registering..."
                    : isFull
                      ? "Event Full"
                      : !user
                        ? "Sign in to Register"
                        : event.participationType === "group" && !showTeamForm
                          ? "Register Team"
                          : event.participationType === "group"
                            ? "Confirm Team Registration"
                            : "Register Now"}
                </button>

                  {/* Team form for group events (shown below after CTA) */}
                  {showTeamForm && event.participationType === "group" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Team Name *</label>
                        <input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Code Warriors"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1.5">
                          Add Members by PID <span className="text-gray-600">({teamMembers.length + 1}/{event.teamSize?.max || 4})</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={pidInput}
                            onChange={(e) => setPidInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeamMember())}
                            placeholder="e.g. PID260002"
                            className="input flex-1 font-mono text-sm"
                          />
                          <button type="button" onClick={addTeamMember} className="btn-secondary px-3"><FiPlus /></button>
                        </div>
                      </div>

                      {/* You (leader) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-800/50 rounded-lg px-3 py-2 text-sm">
                          <FiUserPlus size={13} className="text-purple-400 shrink-0" />
                          <span className="text-white font-medium">{user?.name}</span>
                          <span className="text-purple-400 font-mono text-xs ml-auto">{user?.pid}</span>
                          <span className="text-xs text-purple-500">(You)</span>
                        </div>

                        {teamMembers.map((m) => (
                          <div key={m.pid} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                            <FiUsers size={13} className="text-gray-500 shrink-0" />
                            <span className="text-gray-300 font-mono text-xs">{m.pid}</span>
                            <button onClick={() => removeTeamMember(m.pid)} className="ml-auto text-gray-600 hover:text-red-400">
                              <FiX size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}

            {user && registered && (
              <p className="text-center text-xs text-gray-500 mt-2">
                Check your <Link to="/dashboard" className="text-primary-400 hover:underline">dashboard</Link> for details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
