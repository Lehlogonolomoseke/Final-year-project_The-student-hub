import React, { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentFeed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastNotifications, setToastNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/get_combined_feed.php", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const newUnread =
          data.feed.filter((item) => !item.is_read).length > feed.filter((f) => !f.is_read).length;
        if (newUnread) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          const newItems = data.feed.filter(
            (item) =>
              !item.is_read && !feed.some((f) => f.id === item.id && f.source === item.source)
          );
          newItems.forEach((item) => addToast(item));
        }
        setFeed(data.feed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (item) => {
    if (item.is_read) return;

    if (item.source === "notification") {
      await fetch("http://localhost:8000/mark_notification_read.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: item.id }),
      });
    } else if (item.source === "announcement") {
      await fetch("http://localhost:8000/mark_announcement_read.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_id: item.id }),
      });
    }

    setFeed((prev) =>
      prev.map((f) => (f.id === item.id && f.source === item.source ? { ...f, is_read: true } : f))
    );
  };

  const handleItemClick = (item) => {
    if (!item.is_read) markAsRead(item);
    if (item.source === "announcement")
      setExpandedItem((prev) => (prev === item.id ? null : item.id));
    else if (item.source === "notification" && item.link) navigate(item.link);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getIcon = (item) => {
    if (item.source === "notification") return "🔔";
    const icons = {
      "General Info": "📢",
      Event: "🎉",
      Maintenance: "🔧",
      Emergency: "🚨",
      Academic: "📚",
      Social: "🎊",
      "Automated Event Reminder": "🔔",
    };
    return icons[item.announcement_type] || "📢";
  };

  const getBadgeColor = (type) => {
    const colors = {
      "General Info": "bg-blue-100 text-blue-800",
      Event: "bg-green-100 text-green-800",
      Maintenance: "bg-yellow-100 text-yellow-800",
      Emergency: "bg-red-100 text-red-800",
      Academic: "bg-purple-100 text-purple-800",
      Social: "bg-pink-100 text-pink-800",
      "Automated Event Reminder": "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const unreadCount = feed.filter((f) => !f.is_read).length;

  // Toast notification for new unread items
  const addToast = (item) => {
    setToastNotifications((prev) => [...prev, { ...item, id: `${item.source}-${item.id}` }]);
    setTimeout(() => {
      setToastNotifications((prev) => prev.filter((t) => t.id !== `${item.source}-${item.id}`));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col relative">
      {/* Confetti */}
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} gravity={0.3} />}

      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toastNotifications.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="bg-white shadow-lg border-l-4 border-orange-400 p-3 rounded-lg flex justify-between items-center w-80"
            >
              <div>
                <strong>{item.title || item.message}</strong>
                <p className="text-sm text-gray-600">{item.source}</p>
              </div>
              <button
                onClick={() =>
                  setToastNotifications((prev) => prev.filter((t) => t.id !== item.id))
                }
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-white border-b shadow-md">
        <button
          onClick={() => navigate("/student/home")}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <span className="ml-auto text-sm text-gray-600 font-semibold">{unreadCount} unread 🎉</span>
      </div>

      {/* Hero Section */}
      <div className="text-center py-10 px-6 bg-gradient-to-r from-orange-100 via-orange-50 to-white shadow-lg rounded-b-3xl mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-700 mb-2 flex items-center justify-center gap-2">
          🎓 Student Feed
        </h1>
        <p className="text-gray-700 text-lg max-w-2xl mx-auto">
          Keep up with your communities! New announcements and notifications await.
        </p>
      </div>

      {/* Feed */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-0 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <p className="text-gray-600 font-semibold text-lg">Loading your feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-lg">
            <div className="text-7xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No notifications or announcements
            </h3>
            <p className="text-gray-500 text-md">You are all caught up! </p>
          </div>
        ) : (
          <AnimatePresence>
            {feed.map((item) => (
              <motion.div
                key={`${item.source}-${item.id}`}
                initial={{ opacity: 0, x: item.is_read ? 0 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                onClick={() => handleItemClick(item)}
                className={`rounded-3xl transition-all cursor-pointer overflow-hidden shadow-lg hover:scale-105 transform p-5 ${
                  item.is_read
                    ? "bg-gray-100"
                    : "bg-orange-50 border-l-4 border-orange-400 animate-pulse"
                } ${expandedItem === item.id ? "ring-4 ring-orange-300" : ""}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {!item.is_read && (
                        <span className="w-3 h-3 bg-orange-500 rounded-full animate-ping"></span>
                      )}
                      <h3 className="font-bold text-lg text-gray-900">
                        {item.title || item.message}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                          item.announcement_type
                        )}`}
                      >
                        {getIcon(item)} {item.announcement_type || item.type}
                      </span>
                    </div>

                    {item.source === "announcement" && (
                      <div
                        className={`text-gray-700 mt-2 ${
                          expandedItem === item.id ? "whitespace-pre-wrap" : "line-clamp-3"
                        }`}
                      >
                        {item.content}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      {item.community_name && <span>🏛️ {item.community_name}</span>}
                      <span>🕐 {formatDate(item.created_at)}</span>
                      <span className="capitalize">{item.source}</span>
                    </div>
                  </div>
                  {item.source === "announcement" && (
                    <span className="text-gray-400 text-xl">
                      {expandedItem === item.id ? "🔼" : "🔽"}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
