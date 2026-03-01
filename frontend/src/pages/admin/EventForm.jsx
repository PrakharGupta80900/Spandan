import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { FiArrowLeft, FiUpload } from "react-icons/fi";

const CATEGORIES = ["Dance", "Music", "Fine Arts", "Literary", "Dramatics", "Informal"];

const INITIAL_FORM = {
  title: "", description: "", category: "Dance",
  date: "", time: "", venue: "",
  maxParticipants: "",
  participationType: "solo", theme: "", teamSizeMin: "2", teamSizeMax: "4",
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  // Removed rules/coordinators per request

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
            theme: event.theme || "",
            teamSizeMin: String(event.teamSize?.min || 2),
            teamSizeMax: String(event.teamSize?.max || 4),
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.participationType === "group") {
      const min = parseInt(form.teamSizeMin, 10);
      const max = parseInt(form.teamSizeMax, 10);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return toast.error("Enter valid team size values");
      }
      if (min < 2 || max < 2) {
        return toast.error("Team size must be at least 2");
      }
      if (min > max) {
        return toast.error("Min team size cannot be greater than max team size");
      }
    }

    setLoading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (key === "teamSizeMin" || key === "teamSizeMax") return; // handled separately
      fd.append(key, val);
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
        <Link to="/admin/events" className="text-[#41431B]/80 hover:text-[#41431B]">
          <FiArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-[#41431B]">{isEdit ? "Edit Event" : "Create New Event"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-[#41431B]">Basic Information</h2>

          <div>
            <label className="block text-sm text-[#41431B] mb-1.5">Event Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="input" placeholder="e.g. Code Wars 2026" />
          </div>

          <div>
            <label className="block text-sm text-[#41431B] mb-1.5">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4} className="input resize-none" placeholder="Describe the event..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Participation Type *</label>
              <select
                name="participationType"
                value={form.participationType}
                onChange={handleChange}
                className="input"
              >
                <option value="solo">solo</option>
                <option value="group">group / Team</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Date *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Time</label>
              <input name="time" type="text" value={form.time} onChange={handleChange} className="input" placeholder="e.g. 10:00 AM" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Venue *</label>
              <input name="venue" value={form.venue} onChange={handleChange} required className="input" placeholder="Auditorium / Ground" />
            </div>
            <div>
              <label className="block text-sm text-[#41431B] mb-1.5">Max Participants *</label>
              <input name="maxParticipants" type="number" min="1" value={form.maxParticipants} onChange={handleChange} required className="input" placeholder="100" />
            </div>
          </div>

          {form.participationType === "group" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#41431B] mb-1.5">Event Theme (Optional)</label>
                <input
                  name="theme"
                  value={form.theme}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g. Sustainability / Street Style / Retro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#41431B] mb-1.5">Min Team Size</label>
                <input name="teamSizeMin" type="number" min="2" value={form.teamSizeMin} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="block text-sm text-[#41431B] mb-1.5">Max Team Size</label>
                <input name="teamSizeMax" type="number" min="2" value={form.teamSizeMax} onChange={handleChange} className="input" />
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="card p-6">
          <h2 className="font-semibold text-[#41431B] mb-4">Event Banner</h2>
          <label className="block cursor-pointer">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
                <div className="absolute inset-0 bg-[#41431B]/35 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <p className="!text-white text-sm"><FiUpload className="inline mr-1" />Change Image</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#41431B]/35 rounded-lg h-36 flex flex-col items-center justify-center text-[#41431B]/70 hover:border-[#41431B] transition bg-[#E3DBBB]/40">
                <FiUpload size={24} className="mb-2" />
                <p className="text-sm">Click to upload event banner</p>
                <p className="text-xs mt-1">JPG, PNG, WebP - Max 5MB</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </label>
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

