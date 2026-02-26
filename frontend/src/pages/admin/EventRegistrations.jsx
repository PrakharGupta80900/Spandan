import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import { FiArrowLeft, FiDownload, FiUsers, FiMail, FiPhone, FiBookOpen, FiTrash2, FiEdit2 } from "react-icons/fi";
import toast from "react-hot-toast";

function HoverCard({ children, user }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && user && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 pointer-events-none animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user.name}</p>
              {user.pid && <p className="text-purple-400 text-xs font-mono">{user.pid}</p>}
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-gray-400">
            <p className="flex items-center gap-1.5"><FiMail size={11} className="text-gray-500 shrink-0" /> {user.email}</p>
            {user.phone && <p className="flex items-center gap-1.5"><FiPhone size={11} className="text-gray-500 shrink-0" /> {user.phone}</p>}
            {user.college && <p className="flex items-center gap-1.5"><FiBookOpen size={11} className="text-gray-500 shrink-0" /> {user.college}</p>}
          </div>
          <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-gray-900 border-r border-b border-gray-700 rotate-45" />
        </div>
      )}
    </span>
  );
}

export default function EventRegistrations() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [eventName, setEventName] = useState("");
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    Promise.all([
      API.get(`/admin/events/${id}/registrations`),
      API.get(`/events/${id}`),
    ]).then(([regsRes, eventRes]) => {
      setRegistrations(regsRes.data);
      setEventName(eventRes.data.title);
      setEventData(eventRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const isGroup = eventData?.participationType === "group";

  const exportCSV = () => {
    const headers = isGroup
      ? ["TID", "Team Name", "PID", "Name", "College"]
      : ["PID", "Name", "College"];
    const rows = registrations.map((r) => {
      if (isGroup) {
        return [
          r.tid || "",
          r.teamName || "",
          r.pid,
          r.user?.name,
          r.user?.college,
        ];
      }
      return [
        r.pid,
        r.user?.name,
        r.user?.college,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName}-registrations.csv`;
    a.click();
  };

  const handleDelete = async (regId) => {
    const confirm = window.confirm("Delete this registration? This cannot be undone.");
    if (!confirm) return;

    setDeletingId(regId);
    try {
      await API.delete(`/admin/registrations/${regId}`);
      setRegistrations((prev) => prev.filter((r) => r._id !== regId));
      toast.success("Registration deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeletingId("");
    }
  };

  const handleEditTeam = async (reg) => {
    const initial = reg.teamName || "";
    const nextName = window.prompt("Update team name", initial);
    if (nextName === null) return;
    const trimmed = nextName.trim();
    if (!trimmed) {
      toast.error("Team name cannot be empty");
      return;
    }

    setEditingId(reg._id);
    try {
      const { data } = await API.patch(`/admin/registrations/${reg._id}`, { teamName: trimmed });
      const updated = data.registration || { ...reg, teamName: trimmed };
      setRegistrations((prev) => prev.map((r) => (r._id === reg._id ? { ...r, teamName: updated.teamName } : r)));
      toast.success("Team name updated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update team");
    } finally {
      setEditingId("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/events" className="text-gray-400 hover:text-white">
          <FiArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Registrations</h1>
          <p className="text-gray-400 text-sm">
            {eventName}
            {isGroup && <span className="ml-2 badge bg-orange-900/60 text-orange-300 text-[10px]">Group</span>}
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <FiDownload size={14} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}
        </div>
      ) : registrations.length === 0 ? (
        <div className="card p-12 text-center">
          <FiUsers size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No registrations yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <p className="text-sm text-gray-400">
              {registrations.length} {isGroup ? "teams" : "participants"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  {[
                    ...(isGroup ? ["TID", "Team Name"] : []),
                    "PID", "Name",
                    ...(isGroup ? ["Team Members"] : ["Email"]),
                    "Registered",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-gray-900/50 transition">
                    {isGroup && (
                      <>
                        <td className="px-4 py-3 text-orange-400 font-mono text-xs font-bold whitespace-nowrap">{reg.tid || "—"}</td>
                        <td className="px-4 py-3 text-orange-300 font-medium whitespace-nowrap">{reg.teamName || "—"}</td>
                      </>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HoverCard user={reg.user}>
                        <span className="text-primary-300 font-mono text-xs cursor-default hover:text-purple-300 transition">{reg.pid}</span>
                      </HoverCard>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <HoverCard user={reg.user}>
                        <span className="text-white font-medium cursor-default hover:text-purple-300 transition">{reg.user?.name}</span>
                      </HoverCard>
                    </td>
                    {isGroup ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(reg.teamMembers || []).map((m) => (
                            <span key={m.pid} className="badge bg-gray-800 text-gray-300 text-[10px]">
                              {m.name || m.pid} <span className="text-gray-500 font-mono ml-0.5">{m.pid}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{reg.user?.email}</td>
                    )}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      {isGroup && (
                        <button
                          onClick={() => handleEditTeam(reg)}
                          className="text-gray-400 hover:text-white transition disabled:opacity-50"
                          disabled={!!editingId}
                          title="Edit team name"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(reg._id)}
                        className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                        disabled={!!deletingId}
                        title="Delete registration"
                      >
                        <FiTrash2 size={16} />
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
