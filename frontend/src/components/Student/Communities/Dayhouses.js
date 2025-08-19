import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dayhouses = () => {
  const [dayhouses, setDayhouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const IMAGE_BASE_URL = "http://localhost:8000/uploads/";

  useEffect(() => {
    const fetchDayhouses = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/getDayhouse.php");
        if (response.data.success) {
          setDayhouses(response.data.dayhouses);
        } else {
          setError(response.data.message || "Failed to fetch dayhouses");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch dayhouses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDayhouses();
  }, []);

  const handleCardClick = (id) => {
    navigate(`/dayhouse-page/${id}`);
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading dayhouses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg p-4 bg-red-100 rounded-md">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Back Button */}
      <div className="px-4 md:px-8 mt-6 mb-4">
        <button
          onClick={() => navigate("/student/communities")}
          className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 font-medium px-4 py-2 rounded-full shadow-sm hover:bg-orange-200 transition"
        >
          ← Back to communities
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center px-6 md:px-0 mb-12 py-12 bg-gradient-to-r from-orange-100 via-orange-50 to-white rounded-b-3xl shadow-md">
        <h1 className="text-4xl md:text-5xl font-extrabold text-orange-700 mb-4">UJ Dayhouses</h1>
        <p className="text-lg md:text-xl text-orange-900 max-w-3xl mx-auto leading-relaxed">
          Discover the unique spirit, traditions, and culture of each{" "}
          <span className="font-semibold text-orange-700">UJ Dayhouse</span>. Click a card to
          explore members, sports, and upcoming events.
        </p>
      </div>

      {/* Dayhouse Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 px-4 md:px-0 mb-20">
        {dayhouses.length > 0 ? (
          dayhouses.map((house) => (
            <div
              key={house.id}
              onClick={() => handleCardClick(house.id)}
              className="cursor-pointer bg-orange-50 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col"
            >
              <img
                src={`${IMAGE_BASE_URL}${house.image}`}
                alt={house.name}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-2xl font-bold text-orange-700 mb-2">{house.name}</h2>
                <p className="text-gray-700 mb-4 line-clamp-3">{house.description}</p>

                <div className="mt-auto">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Sports:</h3>
                  <div className="flex flex-wrap gap-2">
                    {house.sports && house.sports.length > 0 ? (
                      house.sports.map((sport, index) => (
                        <span
                          key={index}
                          className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {sport}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No sports available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-lg text-gray-500 col-span-full">No dayhouses found.</div>
        )}
      </div>
    </div>
  );
};

export default Dayhouses;
