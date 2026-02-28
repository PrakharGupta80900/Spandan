import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { FiArrowLeft, FiSearch, FiDownload, FiUsers, FiTrash2, FiRefreshCw, FiFileText } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async ({ initial = false } = {}) => {
    if (initial) setLoading(true);
    setRefreshing(true);
    try {
      const { data } = await API.get("/admin/users", { params: { _t: Date.now() } });
      setUsers(data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load users");
    } finally {
      if (initial) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers({ initial: true });
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.pid?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (user) => {
    const confirm = window.confirm(`Delete user ${user.name} (${user.pid}) and all their registrations? This cannot be undone.`);
    if (!confirm) return;

    setDeletingId(user._id);
    try {
      await API.delete(`/admin/users/${user._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    } finally {
      setDeletingId("");
    }
  };

  const exportCSV = () => {
    const headers = ["PID", "Name", "Email", "Roll Number", "College", "Event Registrations"];
    const rows = filtered.map((u) => {
      const events = (u.registrations || [])
        .map((r) => `${r?.event?.title || "Unknown Event"} (${r?.status || "confirmed"})`)
        .join(" | ");
      return [u.pid, u.name, u.email, u.rollNumber, u.college, events];
    });
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "spandan2026-users.csv"; a.click();
  };

  const exportUserPdf = async (u) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      const serialX = margin + 8;
      const eventX = margin + 28;
      const statusX = margin + contentWidth - 95;
      let y = 44;
      const colors = {
        black: [0, 0, 0],
      };

      const regs = Array.isArray(u?.registrations) ? u.registrations : [];

      const drawFooter = (pageNo) => {
        doc.setDrawColor(...colors.black);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.black);
        doc.text("Spandan 2026", margin, pageHeight - 20);
        doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 20, { align: "right" });
      };

      const drawHeader = () => {
        doc.setDrawColor(...colors.black);
        doc.roundedRect(margin, y, contentWidth, 64, 8, 8, "S");
        doc.setTextColor(...colors.black);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.text("Participant Registration Summary", margin + 16, y + 26);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const generatedOn = new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        doc.text(`Generated on ${generatedOn}`, margin + 16, y + 46);
        y += 80;
      };

      const drawParticipantCard = () => {
        doc.setDrawColor(...colors.black);
        doc.roundedRect(margin, y, contentWidth, 116, 8, 8, "S");

        const leftX = margin + 14;
        const rightX = margin + contentWidth / 2 + 10;
        const rowTop = y + 24;

        doc.setTextColor(...colors.black);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("PID", leftX, rowTop);
        doc.text("Roll No.", leftX, rowTop + 24);
        doc.text("Name", rightX, rowTop);
        doc.text("Email", rightX, rowTop + 24);
        doc.text("College", rightX, rowTop + 48);

        doc.setFont("helvetica", "normal");
        doc.text(u?.pid || "-", leftX + 44, rowTop);
        doc.text(u?.rollNumber || "-", leftX + 44, rowTop + 24);
        doc.text(u?.name || "-", rightX + 44, rowTop);
        doc.text(u?.email || "-", rightX + 44, rowTop + 24);
        doc.text(u?.college || "-", rightX + 44, rowTop + 48);

        y += 136;
      };

      const drawEventsTitle = () => {
        doc.setTextColor(...colors.black);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`Events Registered (${regs.length})`, margin, y);
        y += 14;
      };

      const drawTableHeader = () => {
        doc.setDrawColor(...colors.black);
        doc.rect(margin, y, contentWidth, 26);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        doc.text("#", serialX, y + 17);
        doc.text("Event Name", eventX, y + 17);
        doc.text("Status", statusX, y + 17);
        y += 26;
      };

      const addPageWithHeader = (pageNo) => {
        doc.addPage();
        y = 44;
        drawHeader();
        drawParticipantCard();
        drawEventsTitle();
        drawTableHeader();
        drawFooter(pageNo);
      };

      let pageNo = 1;
      drawHeader();
      drawParticipantCard();
      drawEventsTitle();
      drawTableHeader();

      if (regs.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...colors.black);
        doc.text("No event registrations found.", margin + 10, y + 20);
      } else {
        regs.forEach((reg, index) => {
          const eventName = reg?.event?.title || "Unknown Event";
          const status = reg?.status || "confirmed";
          const detailLines = [];
          if (reg?.tid) detailLines.push(`TID: ${reg.tid}`);
          if (Array.isArray(reg?.teamMembers) && reg.teamMembers.length > 0) {
            const membersText = reg.teamMembers
              .map((m) => `${m?.name || "Member"} (${m?.pid || "-"})`)
              .join(", ");
            detailLines.push(`Members: ${membersText}`);
          }

          const wrappedName = doc.splitTextToSize(eventName, contentWidth - 140);
          const wrappedDetails = detailLines.flatMap((line) => doc.splitTextToSize(line, contentWidth - 140));
          const rowHeight = Math.max(24, [...wrappedName, ...wrappedDetails].length * 14 + 10);

          // Keep space for footer + final verify line block to avoid overlap.
          if (y + rowHeight > pageHeight - 90) {
            pageNo += 1;
            addPageWithHeader(pageNo);
          }

          doc.setDrawColor(...colors.black);
          doc.rect(margin, y, contentWidth, rowHeight);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...colors.black);
          doc.text(String(index + 1), serialX, y + 16);
          doc.text(wrappedName, eventX, y + 16);
          if (wrappedDetails.length > 0) {
            doc.setFontSize(9);
            doc.text(wrappedDetails, eventX, y + 16 + wrappedName.length * 14);
          }
          doc.setFontSize(10);
          doc.text(String(status), statusX, y + 16);
          y += rowHeight;
        });
      }

      const drawAdminSignatureSection = () => {
        const lineStartX = pageWidth - margin - 140;
        const lineEndX = pageWidth - margin;
        const lineCenterX = (lineStartX + lineEndX) / 2;
        const lineY = pageHeight - 56;
        const labelY = pageHeight - 44;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.black);
        doc.text("Verified by", lineCenterX, labelY, { align: "center" });
        doc.line(lineStartX, lineY, lineEndX, lineY);
      };

      
      drawFooter(pageNo);
      drawAdminSignatureSection();

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`spandan-registrations-${u?.pid || "user"}-${today}.pdf`);
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="text-[#41431B]/80 hover:text-[#41431B]"><FiArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-bold text-[#41431B] flex-1">All Participants</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#41431B]/70" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 max-w-xs" placeholder="Search by name, email, PID..." />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FiUsers size={40} className="mx-auto text-[#41431B]/70 mb-3" />
          <p className="text-[#41431B]/80">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#41431B]/20">
            <p className="text-sm text-[#41431B]/80">{filtered.length} participants</p>
          </div>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#41431B]/20 bg-[#E3DBBB]">
                          {["PID", "Name", "Email", "Roll Number", "College", "Event Registrations", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-[#41431B]/70 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#41431B]/15">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-[#E3DBBB]">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs !text-black bg-[#E3DBBB] border border-[#41431B]/30 px-2 py-0.5 rounded">{u.pid}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img src={u.avatar} className="w-7 h-7 rounded-full object-cover" alt={u.name} />
                        ) : (
                          <div className="w-7 h-7 bg-[#AEB784] rounded-full text-xs font-bold flex items-center justify-center !text-black">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-[#41431B] whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#41431B]/80 break-words">{u.email}</td>
                    <td className="px-4 py-3 text-[#41431B]/80">{u.rollNumber || "-"}</td>
                    <td className="px-4 py-3 text-[#41431B]/80 max-w-[160px] truncate">{u.college || "-"}</td>
                    <td className="px-4 py-3 text-[#41431B]/80">
                      {!u.registrations || u.registrations.length === 0 ? (
                        <span className="text-[#41431B]/60 text-xs">No registrations</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {u.registrations.map((reg) => (
                            <span key={reg._id} className="text-xs bg-[#E3DBBB] border border-[#41431B]/25 px-2 py-0.5 rounded">
                              {reg?.event?.title || "Unknown Event"}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => exportUserPdf(u)}
                        className="text-[#41431B]/80 hover:text-[#41431B] transition mr-3"
                        title="Export registrations PDF"
                      >
                        <FiFileText size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        disabled={!!deletingId}
                        title="Delete user"
                      >
                        <FiTrash2 size={15} />
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
