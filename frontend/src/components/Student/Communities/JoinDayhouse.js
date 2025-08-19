import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

function JoinDayhouse() {
  const navigate = useNavigate();
  const { id: dayhouseId } = useParams();

  const [dayhouse, setDayhouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSports, setSelectedSports] = useState([]);
  const [joinLoading, setJoinLoading] = useState(false);
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);

  const IMAGE_BASE_URL = "http://localhost:8000/uploads/";

  const handleSportSelection = (sport, isChecked) => {
    if (isChecked) {
      setSelectedSports((prev) => [...prev, sport]);
    } else {
      setSelectedSports((prev) => prev.filter((s) => s !== sport));
    }
  };

  const handleJoinDayhouse = async () => {
    if (selectedSports.length === 0) {
      alert("Please select at least one sport to participate in");
      return;
    }

    try {
      setJoinLoading(true);
      const response = await axios.post(
        "http://localhost:8000/Join-Dayhouse.php",
        {
          dayhouse_id: dayhouse.id,
          selected_sports: selectedSports,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("Successfully joined dayhouse!");
        setIsAlreadyJoined(true);
      } else {
        alert(response.data.message || "Failed to join dayhouse");
      }
    } catch (err) {
      console.error("Join error:", err);
      alert("Error joining dayhouse");
    } finally {
      setJoinLoading(false);
    }
  };

  useEffect(() => {
    const fetchDayhouseDetails = async () => {
      if (!dayhouseId) {
        setError("No dayhouse ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/Join-Dayhouse.php?id=${dayhouseId}`,
          { withCredentials: true }
        );
        if (response.data.success) {
          setDayhouse(response.data.dayhouse);
          setIsAlreadyJoined(response.data.isAlreadyJoined);
        } else {
          setError(response.data.message || "Failed to fetch dayhouse details");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch dayhouse details");
      } finally {
        setLoading(false);
      }
    };

    fetchDayhouseDetails();
  }, [dayhouseId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-xl">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg">
        Error: {error}
      </div>
    );

  if (!dayhouse)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        Dayhouse not found
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-16 flex flex-col gap-8 font-sans">
      {/* Back Button */}
      <button
        onClick={() => navigate("/student/communities/dayhouses")}
        className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 font-medium px-4 py-2 rounded-full shadow hover:bg-orange-200 transition"
      >
        ← Back to Dayhouses
      </button>

      {/* Dayhouse Info */}
      <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center">
        {dayhouse.image && (
          <img
            src={`${IMAGE_BASE_URL}${dayhouse.image}`}
            alt={dayhouse.name}
            className="w-64 h-64 object-cover rounded-xl mb-4"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}
        <h1 className="text-3xl font-bold text-orange-700 mb-2">{dayhouse.name}</h1>
        <p className="text-gray-700 text-base leading-relaxed">{dayhouse.description}</p>
      </div>

      {/* Join Form */}
      {!isAlreadyJoined ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Select Sports to Participate In:</h2>
          {dayhouse.sports && dayhouse.sports.length > 0 ? (
            <div className="flex flex-col gap-2">
              {dayhouse.sports.map((sport, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-orange-50 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedSports.includes(sport)}
                    onChange={(e) => handleSportSelection(sport, e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-700 font-medium">{sport}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No sports available for this dayhouse.</p>
          )}

          <button
            onClick={handleJoinDayhouse}
            disabled={joinLoading || selectedSports.length === 0}
            className={`mt-4 py-3 px-6 rounded-full font-semibold text-white transition ${
              selectedSports.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {joinLoading ? "Joining..." : "Join Dayhouse"}
          </button>
        </div>
      ) : (
        <div className="text-center p-6 bg-green-100 border border-green-300 rounded-xl text-green-800 font-semibold">
          ✓ Your membership is being processed
        </div>
      )}
    </div>
  );
}

export default JoinDayhouse;
