import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const JoinSocieties = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:8000/Search_Student.php";
  const IMAGE_BASE_URL = "http://localhost:8000/";

  const fetchSocieties = async (searchQuery = "") => {
    const cleanQuery = searchQuery.trim();

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_BASE_URL, {
        params: { search: cleanQuery },
      });

      if (res.data.success && Array.isArray(res.data.results)) {
        setSocieties(res.data.results);
      } else {
        setError(res.data.error || "Invalid data format received from server.");
        setSocieties([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.response) {
        setError(
          `Server responded with error: ${err.response.status} - ${
            err.response.data.error || "Unknown error"
          }`
        );
      } else if (err.request) {
        setError("No response received from server. Is it running?");
      } else {
        setError("Request setup error: " + err.message);
      }
      setSocieties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

  const handleSearchInputChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = () => fetchSocieties(searchTerm);
  const handleKeyPress = (event) => {
    if (event.key === "Enter") handleSearchSubmit();
  };

  const handleCardClick = (id) => {
    navigate(`/society/${id}`);
  };

  if (loading)
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading societies...</div>
      </div>
    );

  if (error)
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg p-4 bg-red-100 rounded-md">Error: {error}</div>
      </div>
    );

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      {/* Back Button */}
      <div className="px-4 md:px-8 mt-6 mb-4">
        <button
          onClick={() => navigate("/student/communities")}
          className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 font-medium px-4 py-2 rounded-full shadow-sm hover:bg-purple-200 transition"
        >
          ← Back
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center px-6 md:px-0 mb-12 py-12 bg-gradient-to-r from-purple-100 via-purple-50 to-white rounded-b-3xl shadow-md">
        <h1 className="text-4xl md:text-5xl font-extrabold text-purple-700 mb-4">
          Student Societies
        </h1>
        <p className="text-lg md:text-xl text-purple-900 max-w-3xl mx-auto leading-relaxed">
          Discover vibrant student societies at UJ — where passion, community, and shared interests
          create lasting connections.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center gap-4 flex-wrap px-4 md:px-0 mb-10">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Search by name, category, or description"
          className="px-4 py-3 w-full max-w-md rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          onClick={handleSearchSubmit}
          className="px-6 py-3 bg-purple-700 text-white font-semibold rounded-lg shadow-md hover:bg-purple-800 transition"
        >
          Search
        </button>
      </div>

      {/* Society Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-4 md:px-0 mb-20">
        {societies.length === 0 ? (
          <div className="text-center text-lg text-gray-500 col-span-full">No societies found.</div>
        ) : (
          societies.map((society) => (
            <div
              key={society.society_id}
              onClick={() => handleCardClick(society.society_id)}
              className="cursor-pointer bg-purple-50 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col"
            >
              {/* Image */}
              <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-gray-500 text-sm border-b border-gray-200">
                {society.logo_url ? (
                  <img
                    src={`${IMAGE_BASE_URL}${society.logo_url}`}
                    alt={society.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `
                        <div class="flex items-center justify-center h-full text-gray-400 text-sm">
                          Image not available
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div>Image not available</div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-extrabold text-purple-700 mb-2 tracking-wide">
                  {society.name}
                </h3>
                <p className="text-gray-700 mb-4 text-sm md:text-base line-clamp-3 leading-relaxed">
                  {society.description}
                </p>
                <div className="mt-auto text-sm md:text-base">
                  <div className="mb-1">
                    <strong className="text-purple-700 font-semibold">Category:</strong>{" "}
                    <span className="text-gray-700">{society.category || "N/A"}</span>
                  </div>
                  <div>
                    <strong className="text-purple-700 font-semibold">Founded:</strong>{" "}
                    <span className="text-gray-700">
                      {society.created_at
                        ? new Date(society.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JoinSocieties;
