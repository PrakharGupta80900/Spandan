import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { FiCalendar, FiMapPin, FiX, FiCopy, FiDownload } from "react-icons/fi";

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const visibleRegistrations = registrations.filter((r) => r?.event);

  useEffect(() => {
    API.get("/registrations/my/all")
      .then(({ data }) => setRegistrations(data))
      .catch(() => toast.error("Failed to load registrations"))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (eventId) => {
    if (!confirm("Cancel this registration?")) return;
    try {
      await API.delete(`/registrations/${eventId}`);
      setRegistrations((prev) =>
        prev.filter((r) => r?.event?._id !== eventId)
      );
      toast.success("Registration cancelled");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel");
    }
  };

  const copyPid = () => {
    navigator.clipboard.writeText(user.pid);
    toast.success("PID copied!");
  };

  const exportMyRegistrationsPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = 44;
      const colors = {
        oliveDark: [65, 67, 27],
        olive: [174, 183, 132],
        cream: [227, 219, 187],
        ivory: [248, 243, 225],
      };

      const drawFooter = (pageNo) => {
        doc.setDrawColor(...colors.olive);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.oliveDark);
        doc.text("Spandan 2026", margin, pageHeight - 20);
        doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 20, { align: "right" });
      };

      const drawHeader = () => {
        doc.setFillColor(...colors.oliveDark);
        doc.roundedRect(margin, y, contentWidth, 64, 8, 8, "F");
        doc.setTextColor(...colors.ivory);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.text("My Registration Summary", margin + 16, y + 26);
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
        doc.setFillColor(...colors.ivory);
        doc.setDrawColor(...colors.olive);
        doc.roundedRect(margin, y, contentWidth, 116, 8, 8, "FD");

        const leftX = margin + 14;
        const rightX = margin + contentWidth / 2 + 10;
        const rowTop = y + 24;

        doc.setTextColor(...colors.oliveDark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("PID", leftX, rowTop);
        doc.text("Roll No.", leftX, rowTop + 24);
        doc.text("Name", rightX, rowTop);
        doc.text("Email", rightX, rowTop + 24);
        doc.text("College", rightX, rowTop + 48);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.oliveDark);
        doc.text(user?.pid || "-", leftX + 44, rowTop);
        doc.text(user?.rollNumber || "-", leftX + 44, rowTop + 24);
        doc.text(user?.name || "-", rightX + 44, rowTop);
        doc.text(user?.email || "-", rightX + 44, rowTop + 24);
        doc.text(user?.college || "-", rightX + 44, rowTop + 48);

        y += 136;
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

      const drawEventsTitle = () => {
        doc.setTextColor(...colors.oliveDark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`Events Registered (${visibleRegistrations.length})`, margin, y);
        y += 14;
      };

      const drawTableHeader = () => {
        doc.setFillColor(...colors.cream);
        doc.rect(margin, y, contentWidth, 26, "F");
        doc.setDrawColor(...colors.olive);
        doc.rect(margin, y, contentWidth, 26);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.oliveDark);
        doc.text("#", margin + 8, y + 17);
        doc.text("Event Name", margin + 28, y + 17);
        doc.text("Status", pageWidth - margin - 56, y + 17);
        y += 26;
      };

      let pageNo = 1;
      drawHeader();
      drawParticipantCard();
      drawEventsTitle();
      drawTableHeader();

      if (visibleRegistrations.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...colors.oliveDark);
        doc.text("No event registrations found.", margin + 10, y + 20);
      } else {
        visibleRegistrations.forEach((reg, index) => {
          const eventName = reg?.event?.title || "Unknown Event";
          const status = "Confirmed";
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
          const contentLines = [...wrappedName, ...wrappedDetails];
          const rowHeight = Math.max(24, contentLines.length * 14 + 10);

          if (y + rowHeight > pageHeight - 48) {
            pageNo += 1;
            addPageWithHeader(pageNo);
          }

          if (index % 2 === 0) {
            doc.setFillColor(...colors.ivory);
            doc.rect(margin, y, contentWidth, rowHeight, "F");
          }

          doc.setDrawColor(...colors.olive);
          doc.rect(margin, y, contentWidth, rowHeight);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...colors.oliveDark);
          doc.text(String(index + 1), margin + 8, y + 16);
          doc.text(wrappedName, margin + 28, y + 16);
          if (wrappedDetails.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(...colors.oliveDark);
            doc.text(wrappedDetails, margin + 28, y + 16 + wrappedName.length * 14);
          }
          doc.text(status, pageWidth - margin - 56, y + 16);
          y += rowHeight;
        });
      }

      drawFooter(pageNo);

      const today = new Date().toISOString().slice(0, 10);
      doc.save(`spandan-registrations-${user?.pid || "user"}-${today}.pdf`);
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* User Card */}
      <div className="card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-primary-500" />
        ) : (
          <div className="w-16 h-16 bg-[#AEB784] rounded-full flex items-center justify-center text-2xl font-bold !text-black">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          {user?.college && <p className="text-gray-500 text-sm">{user.college}</p>}
        </div>
        <div className="text-center bg-[#AEB784] border border-[#41431B] rounded-xl px-6 py-3">
          <p className="text-xs !text-black uppercase tracking-wider mb-1">Participant ID</p>
          <div className="flex items-center gap-2">
            <p className="!text-black font-mono font-bold text-xl">{user?.pid || "-"}</p>
            {user?.pid && (
              <button onClick={copyPid} className="!text-black/70 hover:!text-black transition">
                <FiCopy size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Registrations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Registrations</h2>
          <div className="flex items-center gap-2">
            <span className="badge bg-[#E3DBBB]">{visibleRegistrations.length} events</span>
            <button
              onClick={exportMyRegistrationsPdf}
              className="btn-secondary flex items-center gap-2 text-sm"
              type="button"
            >
              <FiDownload size={14} />
              Export PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse" />
            ))}
          </div>
        ) : visibleRegistrations.length === 0 ? (
          <div className="card p-12 text-center">
            <FiCalendar size={40} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-4">You haven't registered for any events yet.</p>
            <Link to="/events" className="inline-block bg-[#AEB784] !text-black font-bold px-5 py-2.5 rounded-lg hover:bg-[#9ea876] transition">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleRegistrations.map((reg) => (
              <div key={reg._id} className="card p-4 flex gap-4 items-start hover:border-gray-700 transition">
                {reg.event.image?.url ? (
                  <img src={reg.event.image.url} alt={reg.event.title} className="w-20 h-16 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-16 bg-primary-900 rounded-lg flex items-center justify-center shrink-0">
                    <FiCalendar className="text-primary-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/events/${reg.event._id}`} className="font-semibold text-white hover:text-primary-300 transition truncate">
                      {reg.event.title}
                    </Link>
                    <span className="badge bg-green-900/60 text-green-300 shrink-0">Confirmed</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#F8F3E1]">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={11} />
                      {new Date(reg.event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMapPin size={11} />
                      {reg.event.venue}
                    </span>
                    <span className="text-primary-400 font-mono">PID {reg.pid}</span>
                    {reg.tid && <span className="text-lime-400 font-mono font-bold">TID: {reg.tid}</span>}
                    {reg.teamName && <span className="text-lime-300">{reg.teamName}</span>}
                    {reg.teamName && !reg.isLeader && <span className="badge bg-blue-900/60 text-blue-300">Team Member</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(reg.event._id)}
                  className="text-gray-600 hover:text-red-400 transition shrink-0 p-1 disabled:opacity-40 disabled:hover:text-gray-600"
                  title={reg.canCancel ? "Cancel registration" : "Only team leader can cancel"}
                  disabled={!reg.canCancel}
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

