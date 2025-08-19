import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AttendancePage = () => {
  const [eventCode, setEventCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventCode.trim()) {
      setStatusMessage("Please enter an attendance code.");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8000/attendance.php",
        { code: eventCode },
        { withCredentials: true } // send session cookies
      );

      if (response.data.success) {
        setStatusMessage("✅ Attendance recorded successfully!");
      } else {
        setStatusMessage(`❌ ${response.data.message || "Failed to record attendance"}`);
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setStatusMessage("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Back Home Button */}
      <button
        onClick={() => navigate("/student/home")}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow hover:shadow-md transition"
      >
        ⬅️ <span className="text-sm font-medium text-gray-700">Back Home</span>
      </button>

      {/* Card */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md text-center animate-fadeIn">
        <h1 className="text-3xl font-extrabold text-orange-600 mb-4">Event Attendance</h1>
        <p className="text-gray-600 mb-8">Enter your attendance code to confirm participation.</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="Enter Attendance Code"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Attendance"}
          </button>
        </form>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-6 p-4 rounded-lg text-sm font-medium ${
              statusMessage.startsWith("✅")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
