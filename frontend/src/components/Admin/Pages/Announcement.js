import React, { useState, useEffect } from "react";

function Announcement() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [currentUser, setCurrentUser] = useState({
    isLoggedIn: false,
    id: null,
    role: null,
    community: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    community_id: "",
    community_type: "",
    announcement_type: "General Info",
    is_pinned: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  const announcementTypes = [
    "General Info",
    "Event",
    "Maintenance",
    "Emergency",
    "Academic",
    "Social",
  ];

  // Fetch announcements whenever search/filter changes
  useEffect(() => {
    fetchAnnouncements();
  }, [searchTerm, typeFilter]);

  // Auto-fill community info in form
  useEffect(() => {
    if (currentUser.community) {
      setFormData((prev) => ({
        ...prev,
        community_id: currentUser.community.id.toString(),
        community_type: currentUser.community.type,
      }));
    }
  }, [currentUser.community]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (typeFilter) params.append("type", typeFilter);

      const response = await fetch(`http://localhost:8000/get_announcements.php?${params}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        setCurrentUser({ isLoggedIn: false, id: null, role: null, community: null });
        return;
      }

      const result = await response.json();

      if (result.success) {
        setAnnouncements(result.announcements || []);
        if (result.user) {
          setCurrentUser({
            isLoggedIn: true,
            id: result.user.id,
            role: result.user.role,
            community: result.user.community,
          });
        } else {
          setCurrentUser({ isLoggedIn: true, id: null, role: "USER", community: null });
        }
      } else {
        setCurrentUser({ isLoggedIn: false, id: null, role: null, community: null });
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setCurrentUser({ isLoggedIn: false, id: null, role: null, community: null });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateAnnouncement = async () => {
    setFormLoading(true);
    setFormErrors([]);

    try {
      const response = await fetch("http://localhost:8000/create_announcement.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        setFormData({
          title: "",
          content: "",
          community_id: currentUser.community ? currentUser.community.id.toString() : "",
          community_type: currentUser.community ? currentUser.community.type : "",
          announcement_type: "General Info",
          is_pinned: false,
        });
        fetchAnnouncements();
      } else {
        setFormErrors(result.errors || [result.error]);
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      setFormErrors(["Failed to create announcement. Please try again."]);
    } finally {
      setFormLoading(false);
    }
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

  if (!currentUser.isLoggedIn) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Authentication Required</h2>
        <p className="text-gray-600 mb-2">You need to be logged in to view announcements.</p>
        <p className="text-sm text-gray-500">Log in with your admin or manager account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📢 Announcements</h1>
        <p className="text-gray-600">Create and manage announcements for your communities</p>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="text-blue-600">Role: {currentUser.role}</span>
          {currentUser.community && (
            <span className="text-green-600">
              {currentUser.community.type === "society" ? "🎓" : "🏠"} {currentUser.community.name}
            </span>
          )}
        </div>
      </div>

      {/* Filters and Create Button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {announcementTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        {currentUser.community && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ➕ Create Announcement
          </button>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📝 Create New Announcement</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ❌
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="text-red-800 font-medium">⚠️ Please fix the following errors:</div>
                <ul className="mt-2 text-red-700">
                  {formErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {currentUser.community && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">Posting to:</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {currentUser.community.type === "society" ? "🎓" : "🏠"}{" "}
                    {currentUser.community.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Community ID: {currentUser.community.id} • Type: {currentUser.community.type}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows="6"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  name="announcement_type"
                  value={formData.announcement_type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {announcementTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_pinned"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_pinned" className="ml-2 block text-sm text-gray-700">
                  📌 Pin this announcement
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {formLoading ? "⏳ Creating..." : "✅ Create Announcement"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-600">No announcements found</p>
          {currentUser.community && (
            <p className="text-sm text-gray-500">Create your first announcement to get started</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.announcement_id}
              className={`bg-white rounded-lg border ${
                announcement.is_pinned ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
              } p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.is_pinned && <span className="text-yellow-600">📌</span>}
                    <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {announcement.announcement_type}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">🏛️ {announcement.community_name}</p>
                  <p className="text-gray-700 mb-3">{announcement.content}</p>
                  <p className="text-sm text-gray-500">🕐 {formatDate(announcement.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Announcement;
