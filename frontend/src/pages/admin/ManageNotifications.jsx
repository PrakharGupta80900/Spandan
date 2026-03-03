import { useState, useEffect } from "react";
import API from "../../api/axios";
import { FiBell, FiTrash2, FiPlus, FiToggleLeft, FiToggleRight, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

const TYPE_OPTIONS = [
  { value: "info",    label: "Info",    color: "bg-[#41431B] text-[#E3DBBB]" },
  { value: "warning", label: "Warning", color: "bg-amber-600 text-white" },
  { value: "success", label: "Success", color: "bg-emerald-700 text-white" },
  { value: "danger",  label: "Danger",  color: "bg-red-700 text-white" },
];

const TYPE_BADGE = {
  info:    "bg-[#41431B]/10 text-[#41431B] border border-[#41431B]/30",
  warning: "bg-amber-100 text-amber-800 border border-amber-300",
  success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  danger:  "bg-red-100 text-red-800 border border-red-300",
};

const EMPTY_FORM = { message: "", type: "info", active: true, order: 0 };

export default function ManageNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/notifications/all");
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error("Message is required.");
    setSubmitting(true);
    try {
      const { data } = await API.post("/notifications", form);
      setNotifications([data, ...notifications]);
      setForm(EMPTY_FORM);
      toast.success("Notification created!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (n) => {
    try {
      const { data } = await API.put(`/notifications/${n._id}`, { active: !n.active });
      setNotifications(notifications.map((x) => (x._id === n._id ? data : x)));
      toast.success(data.active ? "Notification activated." : "Notification deactivated.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(notifications.filter((x) => x._id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const startEdit = (n) => {
    setEditId(n._id);
    setEditData({ message: n.message, type: n.type, order: n.order, active: n.active });
  };

  const saveEdit = async (id) => {
    try {
      const { data } = await API.put(`/notifications/${id}`, editData);
      setNotifications(notifications.map((x) => (x._id === id ? data : x)));
      setEditId(null);
      toast.success("Updated.");
    } catch {
      toast.error("Failed to update.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#41431B] flex items-center gap-2">
          <FiBell size={28} /> Manage Announcements
        </h1>
        <p className="text-[#41431B]/70 mt-1">
          Active notifications appear as a scrolling banner below the navbar for all visitors.
        </p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleCreate} className="card p-6 mb-8 space-y-4">
        <h2 className="font-bold text-[#41431B] text-lg">New Announcement</h2>

        <div>
          <label className="block text-sm font-medium text-[#41431B]/80 mb-1">Message *</label>
          <input
            type="text"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="e.g. Registrations close on March 10th at midnight!"
            className="input w-full"
            required
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-[#41431B]/80 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input w-full"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-[#41431B]/80 mb-1">Order</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="input w-full"
              min={0}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 accent-[#41431B]"
              />
              <span className="text-sm font-medium text-[#41431B]/80">Active immediately</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FiPlus size={15} />
          {submitting ? "Creating…" : "Create Announcement"}
        </button>
      </form>

      {/* List */}
      <div className="space-y-3">
        <h2 className="font-bold text-[#41431B] text-lg">All Announcements ({notifications.length})</h2>

        {loading ? (
          <p className="text-[#41431B]/60 text-sm">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="card p-6 text-center text-[#41431B]/60">No announcements yet.</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`card p-4 ${!n.active ? "opacity-60" : ""}`}>
              {editId === n._id ? (
                // Inline edit
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.message}
                    onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                    className="input w-full text-sm"
                  />
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={editData.type}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                      className="input text-sm flex-1 min-w-[120px]"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editData.order}
                      onChange={(e) => setEditData({ ...editData, order: Number(e.target.value) })}
                      className="input text-sm w-24"
                      min={0}
                      placeholder="Order"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => saveEdit(n._id)} className="btn-primary text-xs flex items-center gap-1">
                      <FiCheck size={13} /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="btn-secondary text-xs flex items-center gap-1">
                      <FiX size={13} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type]}`}>
                        {n.type.toUpperCase()}
                      </span>
                      {!n.active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">INACTIVE</span>
                      )}
                      <span className="text-xs text-[#41431B]/50">order: {n.order}</span>
                    </div>
                    <p className="text-[#41431B] text-sm font-medium break-words">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(n)}
                      className="p-1.5 rounded-lg hover:bg-[#E3DBBB] transition text-[#41431B]"
                      title={n.active ? "Deactivate" : "Activate"}
                    >
                      {n.active ? <FiToggleRight size={18} className="text-emerald-700" /> : <FiToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => startEdit(n)}
                      className="p-1.5 rounded-lg hover:bg-[#E3DBBB] transition text-[#41431B]"
                      title="Edit"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(n._id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 transition text-red-600"
                      title="Delete"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
