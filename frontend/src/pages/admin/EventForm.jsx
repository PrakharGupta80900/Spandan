import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPlus, FiX, FiUpload } from "react-icons/fi";

const CATEGORIES = ["Dance", "Music", "Fine Arts", "Literary", "Dramatics"];

const INITIAL_FORM = {
  title: "", description: "", category: "Dance",
  date: "", time: "", venue: "",
  maxParticipants: "",
  participationType: "solo", teamSizeMin: "2", teamSizeMax: "4",
  rules: [], coordinators: [],
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [ruleInput, setRuleInput] = useState("");
  const [coordInput, setCoordInput] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    if (isEdit) {
      API.get(`/admin/events`).then(({ data }) => {
        const event = data.find((e) => e._id === id);
        if (event) {
          setForm({
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date?.split("T")[0] || "",
            time: event.time || "",
            venue: event.venue,
            maxParticipants: String(event.maxParticipants),
            participationType: event.participationType || "solo",
            teamSizeMin: String(event.teamSize?.min || 2),
            teamSizeMax: String(event.teamSize?.max || 4),
            rules: event.rules || [],
            coordinators: event.coordinators || [],
          });
          if (event.image?.url) setImagePreview(event.image.url);
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addRule = () => {
    if (ruleInput.trim()) {
      setForm({ ...form, rules: [...form.rules, ruleInput.trim()] });
      setRuleInput("");
    }
  };

  const addCoord = () => {
    if (coordInput.name.trim()) {
      setForm({ ...form, coordinators: [...form.coordinators, { ...coordInput }] });
      setCoordInput({ name: "", phone: "", email: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "teamSizeMin" || key === "teamSizeMax") return; // handled separately
      if (Array.isArray(val)) fd.append(key, JSON.stringify(val));
      else fd.append(key, val);
    });
    // Send teamSize as JSON
    if (form.participationType === "group") {
      fd.append("teamSize", JSON.stringify({ min: parseInt(form.teamSizeMin) || 2, max: parseInt(form.teamSizeMax) || 4 }));
    }
    if (imageFile) fd.append("image", imageFile);

    try {
      if (isEdit) {
        await API.put(`/admin/events/${id}`, fd);
        toast.success("Event updated!");
      } else {
        await API.post("/admin/events", fd);
        toast.success("Event created!");
      }
      navigate("/admin/events");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/events" className="text-gray-400 hover:text-white">
          <FiArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-white">{isEdit ? "Edit Event" : "Create New Event"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white">Basic Information</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Event Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="e.g. Code Wars 2026" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4} className="input resize-none" placeholder="Describe the event..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Participation Type *</label>
              <select
                name="participationType"
                value={form.participationType}
                onChange={handleChange}
                className="input"
              >
                <option value="solo">Solo</option>
                <option value="group">Group / Team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Time</label>
              <input name="time" type="text" value={form.time} onChange={handleChange} className="input" placeholder="e.g. 10:00 AM" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Venue *</label>
              <input name="venue" value={form.venue} onChange={handleChange} required className="input" placeholder="Auditorium / Ground" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Max Participants *</label>
              <input name="maxParticipants" type="number" min="1" value={form.maxParticipants} onChange={handleChange} required className="input" placeholder="100" />
            </div>
          </div>

          {form.participationType === "group" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Min Team Size</label>
                <input name="teamSizeMin" type="number" min="2" value={form.teamSizeMin} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Max Team Size</label>
                <input name="teamSizeMax" type="number" min="2" value={form.teamSizeMax} onChange={handleChange} className="input" />
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Event Banner</h2>
          <label className="block cursor-pointer">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <p className="text-white text-sm"><FiUpload className="inline mr-1" />Change Image</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-700 rounded-lg h-36 flex flex-col items-center justify-center text-gray-500 hover:border-primary-600 transition">
                <FiUpload size={24} className="mb-2" />
                <p className="text-sm">Click to upload event banner</p>
                <p className="text-xs mt-1">JPG, PNG, WebP • Max 5MB</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
        </div>

        {/* Rules */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Rules</h2>
          <div className="flex gap-2 mb-3">
            <input value={ruleInput} onChange={(e) => setRuleInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRule())} className="input flex-1" placeholder="Add a rule" />
            <button type="button" onClick={addRule} className="btn-secondary px-3"><FiPlus /></button>
          </div>
          <ol className="space-y-2">
            {form.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-primary-400 font-bold shrink-0">{i + 1}.</span>
                <span className="flex-1">{rule}</span>
                <button type="button" onClick={() => setForm({ ...form, rules: form.rules.filter((_, ri) => ri !== i) })} className="text-gray-600 hover:text-red-400">
                  <FiX size={13} />
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Coordinators */}
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Coordinators</h2>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input value={coordInput.name} onChange={(e) => setCoordInput({ ...coordInput, name: e.target.value })} className="input" placeholder="Name" />
            <input value={coordInput.phone} onChange={(e) => setCoordInput({ ...coordInput, phone: e.target.value })} className="input" placeholder="Phone" />
            <div className="flex gap-2">
              <input value={coordInput.email} onChange={(e) => setCoordInput({ ...coordInput, email: e.target.value })} className="input flex-1" placeholder="Email" />
              <button type="button" onClick={addCoord} className="btn-secondary px-3"><FiPlus /></button>
            </div>
          </div>
          <div className="space-y-2">
            {form.coordinators.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                <span className="text-white font-medium">{c.name}</span>
                {c.phone && <span className="text-gray-400">• {c.phone}</span>}
                {c.email && <span className="text-gray-400">• {c.email}</span>}
                <button type="button" className="ml-auto text-gray-500 hover:text-red-400" onClick={() => setForm({ ...form, coordinators: form.coordinators.filter((_, ci) => ci !== i) })}>
                  <FiX size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
          </button>
          <Link to="/admin/events" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
