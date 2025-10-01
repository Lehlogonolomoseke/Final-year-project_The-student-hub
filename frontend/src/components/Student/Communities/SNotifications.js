import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function SNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/get_notifications.php", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        // Sort newest first
        const sorted = data.notifications.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setNotifications(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      await fetch("http://localhost:8000/mark_notification_read.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch("http://localhost:8000/mark_all_notifications_read.php", {
        method: "POST",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  // Handle click on a notification
  const handleClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  // Group notifications by date
  const groupByDate = (notifications) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const groups = { Today: [], Yesterday: [], Older: [] };

    notifications.forEach((n) => {
      const notifDate = new Date(n.created_at).toDateString();
      if (notifDate === today) groups.Today.push(n);
      else if (notifDate === yesterday) groups.Yesterday.push(n);
      else groups.Older.push(n);
    });
    return groups;
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const grouped = groupByDate(notifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Back Button and Mark All as Read */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3 bg-white border-b shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            <div className="text-5xl mb-4 animate-bounce">⏳</div>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No notifications yet</h3>
            <p className="text-gray-500">You will see new updates here when available.</p>
          </div>
        ) : (
          Object.entries(grouped).map(
            ([group, items]) =>
              items.length > 0 && (
                <div key={group} className="mb-6">
                  <h2 className="text-gray-500 font-semibold mb-2">{group}</h2>
                  <ul className="space-y-3">
                    {items.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`p-4 rounded shadow cursor-pointer flex justify-between items-center transition hover:scale-[1.01] ${
                          n.is_read ? "bg-gray-100" : "bg-orange-50 border-l-4 border-orange-400"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{n.message}</p>
                          <small className="text-gray-500">
                            {n.type} | {new Date(n.created_at).toLocaleString()}
                          </small>
                        </div>
                        {!n.is_read && (
                          <span className="ml-2 text-sm font-bold text-orange-600">New</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
          )
        )}
      </div>
    </div>
  );
}
