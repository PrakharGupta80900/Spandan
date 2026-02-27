import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  FiCalendar, FiMapPin, FiUsers, FiArrowLeft, FiCheckCircle, FiPlus, FiX, FiUserPlus,
} from "react-icons/fi";

const CATEGORY_COLORS = {
  Dance: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Music: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  "Fine Arts": "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Literary: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Dramatics: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
  Other: "bg-[#E3DBBB] !text-black border border-[#41431B]/30",
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
  const [checkingPid, setCheckingPid] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data } = await API.get(`/events/${id}`);
        setEvent(data);
        if (user) {
          // Check registration
          const regs = await API.get("/registrations/my/all");
          setRegistered(regs.data.some((r) => String(r?.event?._id) === id));
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Event not found");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, user]);

  const addTeamMember = async () => {
    const pid = pidInput.trim().toUpperCase();
    if (!pid) return;
    if (checkingPid) return;
    if (pid === user?.pid) return toast.error("You're already the team leader");
    if (teamMembers.some((m) => m.pid === pid)) return toast.error("PID already added");
    const maxTeamSize = event?.teamSize?.max || 4;
    if (teamMembers.length + 1 >= maxTeamSize) {
      return toast.error(`Team cannot exceed ${maxTeamSize} members`);
    }

    setCheckingPid(true);
    try {
      await API.get(`/registrations/pid/${encodeURIComponent(pid)}/exists`);
      setTeamMembers((prev) => [...prev, { pid }]);
      setPidInput("");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid PID");
    } finally {
      setCheckingPid(false);
    }
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
      <div className="w-10 h-10 border-4 border-[#41431B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!event) return null;

  const spotsLeft = event.maxParticipants - event.registeredCount;
  const isFull = spotsLeft <= 0;
  const fillPercent = Math.min((event.registeredCount / event.maxParticipants) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="flex items-center gap-2 text-[#41431B]/80 hover:text-[#41431B] transition mb-6 text-sm">
        <FiArrowLeft /> Back to Events
      </Link>

      {/* Hero Image */}
      {event.image?.url && (
        <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden mb-8 bg-[#F8F3E1] border-2 border-[#41431B]">
          <img src={event.image.url} alt={event.title} className="w-full h-full object-cover opacity-80" />
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
            <h1 className="text-3xl font-black text-[#41431B]">{event.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[14px]">
            <div className="flex items-center gap-2 text-[#41431B] font-semibold">
              <FiCalendar className="text-[#41431B]" />
              {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              {event.time && ` - ${event.time}`}
            </div>
            <div className="flex items-center gap-2 text-[#41431B] font-semibold">
              <FiMapPin className="text-[#41431B]" /> {event.venue}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#41431B] mb-2">About this Event</h2>
            <p className="text-[#41431B]/90 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

        </div>

        {/* Registration Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-[#41431B] mb-2">
                <span className="flex items-center gap-1"><FiUsers size={13} /> Participants</span>
                <span>{event.registeredCount}/{event.maxParticipants}</span>
              </div>
              <div className="w-full bg-[#E3DBBB] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${isFull ? "bg-red-500" : fillPercent > 75 ? "bg-[#B78A3C]" : "bg-[#41431B]"}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className={`text-sm mt-1 ${isFull ? "text-red-400" : spotsLeft <= 5 ? "text-yellow-400" : "text-green-400"}`}>
                {isFull ? "Event is full" : `${spotsLeft} spots remaining`}
              </p>
            </div>

            {registered ? (
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center bg-[#AEB784] border border-[#41431B] !text-black rounded-lg py-3 text-sm font-semibold">
                  <FiCheckCircle /> You're registered!
                </div>
                {regTid && (
                  <div className="mt-3 bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg p-3">
                    <p className="text-xs text-[#41431B]/80 mb-1">Your Team ID</p>
                    <p className="text-[#41431B] font-mono font-bold text-lg">{regTid}</p>
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

                {showTeamForm && event.participationType === "group" && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm text-[#41431B] mb-1.5">Team Name *</label>
                      <input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Code Warriors"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#41431B] mb-1.5">
                        Add Members by PID <span className="text-[#41431B]/70">({teamMembers.length + 1}/{event.teamSize?.max || 4})</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={pidInput}
                          onChange={(e) => setPidInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTeamMember())}
                          placeholder="e.g. PID260002"
                          className="input flex-1 font-mono text-sm"
                        />
                        <button type="button" onClick={addTeamMember} disabled={checkingPid} className="btn-secondary px-3 disabled:opacity-60">
                          <FiPlus />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 bg-[#E3DBBB] border border-[#41431B]/30 rounded-lg px-3 py-2 text-sm">
                        <FiUserPlus size={13} className="text-[#41431B] shrink-0" />
                        <span className="!text-black font-medium">{user?.name}</span>
                        <span className="text-[#41431B] font-mono text-xs ml-auto">{user?.pid}</span>
                        <span className="text-xs text-[#41431B]/80">(You)</span>
                      </div>

                      {teamMembers.map((m) => (
                        <div key={m.pid} className="flex items-center gap-2 bg-[#F8F3E1] border border-[#41431B]/20 rounded-lg px-3 py-2 text-sm">
                          <FiUsers size={13} className="text-[#41431B]/80 shrink-0" />
                          <span className="text-[#41431B] font-mono text-xs">{m.pid}</span>
                          <button onClick={() => removeTeamMember(m.pid)} className="ml-auto text-[#41431B]/70 hover:text-red-500">
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
              <p className="text-center text-xs text-[#41431B]/80 mt-2">
                Check your <Link to="/dashboard" className="text-[#41431B] hover:underline">dashboard</Link> for details
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

