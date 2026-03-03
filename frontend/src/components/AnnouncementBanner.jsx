import { useEffect, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";

const TYPE_STYLES = {
  info:    { text: "text-[#41431B]", label: "📢" },
  warning: { text: "text-amber-700", label: "⚠️" },
  success: { text: "text-emerald-800", label: "✅" },
  danger:  { text: "text-red-700",   label: "🚨" },
};

// Standalone fetch — does NOT use the shared auth axios instance
// so it works for every visitor, logged in or not
const fetchNotifications = async () => {
  const base =
    import.meta.env.DEV
      ? "/api"
      : import.meta.env.VITE_API_URL || "/api";
  const res = await fetch(`${base}/notifications`, { credentials: "omit" });
  if (!res.ok) return [];
  return res.json();
};

export default function AnnouncementBanner() {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (!notifications.length || dismissed) return null;

  const items = notifications.map((n) => ({
    ...n,
    style: TYPE_STYLES[n.type] || TYPE_STYLES.info,
  }));

  const barStyle = items[0].style;

  return (
    <div
      className={`relative flex items-center overflow-hidden border-b border-[#41431B]/15 text-sm font-medium select-none z-40 ${barStyle.text}`}
      style={{ minHeight: "34px", background: "transparent" }}
    >
      {/* Left label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 border-r border-[#41431B]/20 font-bold tracking-wide text-xs uppercase opacity-70">
        <FiBell size={13} />
        <span>Alert</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex whitespace-nowrap animate-marquee"
          style={{ animationDuration: `${Math.max(18, notifications.length * 12)}s` }}
        >
          {[...items, ...items].map((n, i) => (
            <span key={i} className={`inline-flex items-center gap-2 px-8 ${n.style.text}`}>
              <span>{n.style.label}</span>
              <span>{n.message}</span>
              <span className="opacity-30 mx-2">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-2 opacity-50 hover:opacity-100 transition ml-1"
        aria-label="Dismiss"
      >
        <FiX size={14} />
      </button>
    </div>
  );
}

