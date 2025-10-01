import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id);
    // Navigate if a link is provided
    if (notif.link) navigate(notif.link);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Notifications</h1>
      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              onClick={() => handleClick(n)}
              className={`p-4 rounded shadow cursor-pointer flex justify-between items-center ${
                n.is_read ? "bg-gray-100" : "bg-orange-50 border-l-4 border-orange-400"
              }`}
            >
              <div>
                <p>{n.message}</p>
                <small className="text-gray-500">
                  {n.type} | {new Date(n.created_at).toLocaleString()}
                </small>
              </div>
              {!n.is_read && <span className="ml-2 text-sm font-bold text-orange-600">New</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
