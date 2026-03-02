import { useState, useEffect } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiCheck,
  FiBookOpen, FiChevronDown, FiChevronUp,
} from "react-icons/fi";

// ── Sub-component: inline rule editor for a single section ───────────────────
function RuleEditor({ section, onSaved, onCancelled }) {
  const isNew = !section._id;
  const [title, setTitle] = useState(section.title || "");
  const [type, setType] = useState(section.type || "general");
  const [rulesText, setRulesText] = useState(
    (section.rules || []).join(". ")
  );
  const [order, setOrder] = useState(section.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title is required.");
    const rules = rulesText
      .split(".")
      .map((r) => r.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (isNew) {
        const { data } = await API.post("/rules", { title, type, rules, order });
        toast.success("Rule section created.");
        onSaved(data, true);
      } else {
        const { data } = await API.put(`/rules/${section._id}`, {
          title,
          type,
          rules,
          order,
        });
        toast.success("Rule section updated.");
        onSaved(data, false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 border-2 border-[#41431B]/30">
      <h4 className="font-bold text-[#41431B] mb-4 text-sm uppercase tracking-wider">
        {isNew ? "New Rule Section" : "Edit Rule Section"}
      </h4>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#41431B]/70 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            className="input w-full"
            placeholder="e.g. Dance Competition Rules / General Instructions"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-[#41431B]/70 mb-1">
            Type
          </label>
          <select
            className="input w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="general">General Instructions</option>
            <option value="dance">Dance</option>
            <option value="music">Music</option>
            <option value="literary">Literary</option>
            <option value="fine-arts">Fine Arts</option>
            <option value="dramatics">Dramatics</option>
            <option value="informal">Informal</option>
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-xs font-semibold text-[#41431B]/70 mb-1">
            Display Order
          </label>
          <input
            type="number"
            className="input w-full"
            placeholder="0"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Rules */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#41431B]/70 mb-1">
          Rules{" "}
          <span className="font-normal text-[#41431B]/50">
            (separate each rule with a full stop .)
          </span>
        </label>
        <textarea
          rows={8}
          className="input w-full font-mono text-sm resize-y"
          placeholder={
            "Participants must register before the deadline. Team size should be 2–5 members. Each participant must carry a valid college ID."
          }
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
        />
        <p className="text-xs text-[#41431B]/40 mt-1">
          {rulesText.split(".").filter((r) => r.trim()).length} rule(s) entered
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FiCheck size={15} />
          {saving ? "Saving…" : "Save Section"}
        </button>
        <button
          onClick={onCancelled}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <FiX size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ManageRules() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/rules");
      setSections(data);
    } catch {
      toast.error("Failed to load rules.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (saved, isNew) => {
    if (isNew) {
      setSections((prev) => [...prev, saved].sort((a, b) => a.order - b.order || new Date(a.createdAt) - new Date(b.createdAt)));
      setShowNew(false);
    } else {
      setSections((prev) =>
        prev.map((s) => (s._id === saved._id ? saved : s))
      );
      setEditingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete section "${title}"? This cannot be undone.`))
      return;
    try {
      await API.delete(`/rules/${id}`);
      setSections((prev) => prev.filter((s) => s._id !== id));
      toast.success("Section deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Delete failed.");
    }
  };

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#41431B] flex items-center gap-2">
            <FiBookOpen size={26} /> Manage Rules
          </h1>
          <p className="text-[#41431B]/70 mt-1 text-sm">
            Create and manage rulebook sections visible to all participants.
          </p>
        </div>
        <button
          onClick={() => {
            setShowNew(true);
            setEditingId(null);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <FiPlus size={16} /> New Section
        </button>
      </div>

      {/* New Section Form */}
      {showNew && (
        <div className="mb-6">
          <RuleEditor
            section={{}}
            onSaved={(data) => handleSaved(data, true)}
            onCancelled={() => setShowNew(false)}
          />
        </div>
      )}

      {/* Sections List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#41431B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-20 card">
          <FiBookOpen size={40} className="mx-auto text-[#41431B]/30 mb-3" />
          <p className="text-[#41431B]/60 font-medium">No rule sections yet.</p>
          <p className="text-[#41431B]/40 text-sm mt-1">
            Click "New Section" to add the first one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((section) =>
            editingId === section._id ? (
              <RuleEditor
                key={section._id}
                section={section}
                onSaved={(data) => handleSaved(data, false)}
                onCancelled={() => setEditingId(null)}
              />
            ) : (
              <div key={section._id} className="card p-5 border border-[#41431B]/15">
                {/* Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#41431B] text-lg leading-tight">
                        {section.title}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          section.type === "general"
                            ? "bg-[#AEB784]/50 text-[#41431B]"
                            : "bg-[#E3DBBB] text-[#41431B]"
                        }`}
                      >
                        {{
                          general: "General",
                          dance: "Dance",
                          music: "Music",
                          literary: "Literary",
                          "fine-arts": "Fine Arts",
                          dramatics: "Dramatics",
                          informal: "Informal",
                        }[section.type] || section.type}
                      </span>
                      <span className="text-xs text-[#41431B]/40">
                        Order: {section.order}
                      </span>
                    </div>
                    <p className="text-xs text-[#41431B]/50 mt-0.5">
                      {section.rules.length} rule(s)
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleExpand(section._id)}
                      className="p-1.5 rounded text-[#41431B]/60 hover:text-[#41431B] hover:bg-[#E3DBBB] transition"
                      title="Preview rules"
                    >
                      {expanded[section._id] ? (
                        <FiChevronUp size={16} />
                      ) : (
                        <FiChevronDown size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(section._id);
                        setShowNew(false);
                      }}
                      className="p-1.5 rounded text-[#41431B]/60 hover:text-[#41431B] hover:bg-[#E3DBBB] transition"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(section._id, section.title)}
                      className="p-1.5 rounded text-red-600/60 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Preview Accordion */}
                {expanded[section._id] && (
                  <div className="mt-4 pt-4 border-t border-[#41431B]/10">
                    {section.rules.length === 0 ? (
                      <p className="text-[#41431B]/40 text-sm italic">
                        No rules in this section.
                      </p>
                    ) : (
                      <ol className="space-y-3">
                        {section.rules.map((rule, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[#41431B]/80 text-sm"
                          >
                            <span className="min-w-[1.4rem] h-5 w-5 flex items-center justify-center rounded-full bg-[#E3DBBB] text-[#41431B] text-xs font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed pt-0.5">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
