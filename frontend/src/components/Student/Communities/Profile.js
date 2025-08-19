import React, { useState, useEffect } from "react";

const UserProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("societies");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ first_name: "", last_name: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "events" && !eventsData) {
      fetchEvents();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/user_profile.php?action=profile", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setProfileData(data.profile);
        setEditData({
          first_name: data.profile.user_info.first_name,
          last_name: data.profile.user_info.last_name,
        });
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch("http://localhost:8000/user-events.php", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setEventsData(data);
      } else {
        console.error("Failed to load events:", data.error);
        setEventsData({ success: true, events: [], message: data.error });
      }
    } catch (err) {
      console.error("Events fetch error:", err);
      setEventsData({ success: true, events: [], message: "Failed to load events" });
    } finally {
      setEventsLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const response = await fetch("http://localhost:8000/user_profile.php", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (data.success) {
        setEditMode(false);
        fetchProfile();
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Profile update error:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Member
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getRSVPBadge = (status) => {
    switch (status) {
      case "yes":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Going
          </span>
        );
      case "no":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Not Going
          </span>
        );
      case "maybe":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Maybe
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            No Response
          </span>
        );
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return "TBA";
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  const getEventTypeBadge = (type) => {
    const colors = {
      Meeting: "bg-blue-100 text-blue-800",
      Social: "bg-purple-100 text-purple-800",
      Sports: "bg-orange-100 text-orange-800",
      Academic: "bg-indigo-100 text-indigo-800",
      General: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[type] || colors["General"]
        }`}
      >
        {type || "General"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="h-8 w-8 text-red-600 mr-3 text-2xl">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchProfile}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const { user_info, societies, dayhouses, summary } = profileData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Student Header */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <button
              onClick={() => (window.location.href = "/student/home")}
              className="bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-3xl text-gray-700">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user_info.first_name} {user_info.last_name}
                </h1>
                <p className="text-sm opacity-90">{user_info.email}</p>
                <p className="text-xs opacity-80">
                  Member since {new Date(user_info.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Societies",
              value: summary.total_societies,
              icon: "👥",
              color: "text-blue-600",
            },
            {
              label: "Dayhouses",
              value: summary.total_dayhouses,
              icon: "🏠",
              color: "text-green-600",
            },
            {
              label: "Pending",
              value: summary.pending_requests,
              icon: "⏰",
              color: "text-yellow-600",
            },
            {
              label: "Events",
              value: eventsData ? eventsData.total_events || 0 : "-",
              icon: "📅",
              color: "text-indigo-600",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg shadow p-6 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`h-8 w-8 text-2xl ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-gray-600">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {["societies", "dayhouses", "events"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm rounded-t-md transition-all ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
                  {tab === "societies"
                    ? `(${societies.length})`
                    : tab === "dayhouses"
                    ? `(${dayhouses.length})`
                    : `(${eventsData ? eventsData.total_events || 0 : "..."})`}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6 space-y-4">
            {/* Societies Tab */}
            {activeTab === "societies" &&
              (societies.length > 0 ? (
                societies.map((society) => (
                  <div
                    key={society.society_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{society.name}</h4>
                        <p className="text-sm text-gray-600">{society.description}</p>
                        <p className="text-xs text-gray-500">
                          Joined:{" "}
                          {new Date(society.joined_at || society.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(society.user_role)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You are not a member of any societies yet.</p>
              ))}

            {/* Dayhouses Tab */}
            {activeTab === "dayhouses" &&
              (dayhouses.length > 0 ? (
                dayhouses.map((dayhouse) => (
                  <div
                    key={dayhouse.dayhouse_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{dayhouse.name}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              dayhouse.fee_paid
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {dayhouse.fee_paid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{dayhouse.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(dayhouse.joined_at).toLocaleDateString()}
                        </p>
                        {dayhouse.sports_participated.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Sports:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dayhouse.sports_participated.map((sport, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {sport}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">You are not a member of any dayhouses yet.</p>
              ))}

            {/* Events Tab */}
            {activeTab === "events" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
                  <button
                    onClick={fetchEvents}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Refresh
                  </button>
                </div>

                {eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : eventsData && eventsData.events && eventsData.events.length > 0 ? (
                  eventsData.events.map((event) => (
                    <div
                      key={event.event_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{event.name}</h4>
                            {getEventTypeBadge(event.event_type)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.is_private
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {event.is_private ? "🔒 Private" : "🌍 Public"}
                            </span>
                            {event.user_attended && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                ✓ Attended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              📅 {formatDateTime(event.start_date, event.start_time)}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">📍 {event.location}</div>
                            )}
                            <div className="flex items-center gap-1">
                              👥 Society: {event.society_name}
                            </div>
                            {event.capacity && (
                              <div className="flex items-center gap-1">
                                👤 Capacity: {event.capacity}
                              </div>
                            )}
                          </div>
                          {event.notices && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm text-yellow-800">
                                <span className="font-medium">Notice:</span> {event.notices}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                          {getRSVPBadge(event.user_rsvp_status)}
                          {event.end_date && event.end_date !== event.start_date && (
                            <div className="text-xs text-gray-500">
                              Ends: {formatDateTime(event.end_date, event.end_time)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 text-gray-400 text-4xl mx-auto mb-4">📅</div>
                    <p className="text-gray-500">
                      {eventsData && eventsData.message
                        ? eventsData.message
                        : "No upcoming events found"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
