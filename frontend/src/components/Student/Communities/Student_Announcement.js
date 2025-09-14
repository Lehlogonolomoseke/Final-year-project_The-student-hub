import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SAnnouncement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, [searchTerm, typeFilter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter) params.append("type", typeFilter);

      const response = await fetch(`http://localhost:8000/get_announcements.php?${params}`, {
        credentials: "include",
      });
      const result = await response.json();

      if (result.success) {
        setAnnouncements(result.announcements);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId) => {
    try {
      const response = await fetch("http://localhost:8000/mark_announcement_read.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_id: announcementId }),
      });

      const result = await response.json();

      if (result.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.announcement_id === announcementId ? { ...a, is_read: true } : a))
        );
      }
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const handleAnnouncementClick = (announcement) => {
    if (!announcement.is_read) {
      markAsRead(announcement.announcement_id);
    }
    setExpandedAnnouncement((prev) =>
      prev === announcement.announcement_id ? null : announcement.announcement_id
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnnouncementIcon = (type) => {
    const icons = {
      "General Info": "📢",
      Event: "🎉",
      Maintenance: "🔧",
      Emergency: "🚨",
      Academic: "📚",
      Social: "🎊",
    };
    return icons[type] || "📢";
  };

  const filteredAnnouncements = showUnreadOnly
    ? announcements.filter((a) => !a.is_read)
    : announcements;

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  const announcementTypes = [
    "General Info",
    "Event",
    "Maintenance",
    "Emergency",
    "Academic",
    "Social",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-white border-b shadow-sm">
        <button
          onClick={() => navigate("/student/home")}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      {/* Hero Header */}
      <div className="text-center py-10 px-6 bg-gradient-to-r from-orange-100 via-orange-50 to-white shadow rounded-b-3xl mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-700 mb-2 flex items-center justify-center gap-2">
          📢 Announcements
        </h1>
        <div className="w-24 h-1 bg-orange-400 rounded-full mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto">
          Stay updated with the latest news from your communities
        </p>
        {unreadCount > 0 && (
          <span className="inline-block mt-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-xl shadow">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Types</option>
          {announcementTypes.map((type) => (
            <option key={type} value={type}>
              {getAnnouncementIcon(type)} {type}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
          />
          📬 Unread only
        </label>
      </div>

      {/* Announcements */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-0">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-bounce">⏳</div>
            <p className="text-gray-600">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <div className="text-6xl mb-4">{showUnreadOnly ? "✅" : "📭"}</div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              {showUnreadOnly ? "All caught up!" : "No announcements available"}
            </h3>
            <p className="text-gray-500">
              {showUnreadOnly
                ? "No unread announcements right now."
                : "Check back later for updates."}
            </p>
            {showUnreadOnly && (
              <button
                onClick={() => setShowUnreadOnly(false)}
                className="mt-3 text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Show all announcements
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.announcement_id}
                onClick={() => handleAnnouncementClick(a)}
                className={`rounded-2xl transition-all cursor-pointer overflow-hidden shadow hover:shadow-lg ${
                  a.is_pinned
                    ? "border-l-4 border-yellow-400 bg-yellow-50"
                    : a.is_read
                    ? "border border-gray-200 bg-white"
                    : "border-l-4 border-orange-400 bg-orange-50"
                } ${expandedAnnouncement === a.announcement_id ? "ring-2 ring-orange-300" : ""}`}
              >
                <div className="p-6">
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {a.is_pinned && <span className="text-yellow-600">📌</span>}
                        {!a.is_read && (
                          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                        )}
                        <h3
                          className={`font-semibold text-lg ${
                            a.is_read ? "text-gray-700" : "text-gray-900"
                          }`}
                        >
                          {a.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            a.announcement_type === "Emergency"
                              ? "bg-red-100 text-red-700"
                              : a.announcement_type === "Event"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getAnnouncementIcon(a.announcement_type)} {a.announcement_type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                        <span>🏛️ {a.community_name}</span>
                        <span>🕐 {formatDate(a.created_at)}</span>
                      </div>
                    </div>
                    <span className="text-gray-400">
                      {expandedAnnouncement === a.announcement_id ? "🔼" : "🔽"}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`text-gray-700 mt-2 ${
                      expandedAnnouncement === a.announcement_id
                        ? "whitespace-pre-wrap"
                        : "line-clamp-3"
                    }`}
                  >
                    {a.content}
                  </div>

                  {/* Show less */}
                  {expandedAnnouncement === a.announcement_id && a.content.length > 150 && (
                    <div className="pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedAnnouncement(null);
                        }}
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                      >
                        🔼 Show less
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SAnnouncement;
