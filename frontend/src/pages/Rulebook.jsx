import { useState, useEffect } from "react";
import API from "../api/axios";
import rulebookPdf from "../SPANDAN RULEBOOK.pdf";
import { FiBookOpen, FiTag, FiDownload } from "react-icons/fi";

export default function Rulebook() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | category

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/rules");
      setSections(data);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all" ? sections : sections.filter((s) => s.type === filter);

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-black text-[#41431B] flex items-center gap-2">
            <FiBookOpen size={28} /> Rulebook
          </h2>
          <a
            href={rulebookPdf}
            download="SPANDAN-RULEBOOK.pdf"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#41431B]/20 bg-[#E3DBBB] text-[#41431B] text-sm font-semibold hover:bg-[#D9CFAB] transition-colors"
          >
            <FiDownload size={14} />
            Download PDF
          </a>
        </div>
        <p className="text-[#41431B]/70 mt-2 text-sm">
          Official rules and guidelines for Spandan 2026
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "general", label: "General" },
          { value: "dance", label: "Dance" },
          { value: "music", label: "Music" },
          { value: "literary", label: "Literary" },
          { value: "fine-arts", label: "Fine Arts" },
          { value: "dramatics", label: "Dramatics" },
          { value: "informal", label: "Informal" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === tab.value
                ? "bg-[#41431B] text-[#F8F3E1] border-[#41431B]"
                : "bg-[#F8F3E1] text-[#41431B] border-[#41431B]/20 hover:bg-[#E3DBBB]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#41431B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FiBookOpen size={40} className="mx-auto text-[#41431B]/30 mb-3" />
          <p className="text-[#41431B]/60 font-medium">No rules published yet.</p>
          <p className="text-[#41431B]/40 text-sm mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((section) => (
            <div
              key={section._id}
              className="card p-6 border border-[#41431B]/15"
            >
              {/* Section Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-black text-[#41431B]">
                    {section.title}
                  </h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                    section.type === "general"
                      ? "bg-[#AEB784]/50 text-[#41431B]"
                      : "bg-[#E3DBBB] text-[#41431B]"
                  }`}
                >
                  <FiTag size={10} />
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
              </div>

              {/* Rules List */}
              {section.rules.length === 0 ? (
                <p className="text-[#41431B]/50 text-sm italic">
                  No rules specified.
                </p>
              ) : (
                <ol className="list-none space-y-3">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#41431B]/90 text-sm">
                      <span className="min-w-[1.5rem] h-6 w-6 flex items-center justify-center rounded-full bg-[#E3DBBB] text-[#41431B] text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{rule}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
