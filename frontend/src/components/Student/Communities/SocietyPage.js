import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function SocietyPage() {
  const navigate = useNavigate();
  const { id: societyId } = useParams();

  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchSocietyData = async () => {
      try {
        setLoading(true);
        setError("");

        let currentSocietyId = societyId;

        if (!currentSocietyId) {
          const urlParams = new URLSearchParams(window.location.search);
          currentSocietyId = urlParams.get("id");
        }

        if (!currentSocietyId) {
          const storedSociety = localStorage.getItem("selectedSociety");
          if (storedSociety) {
            const societyData = JSON.parse(storedSociety);
            if (societyData && societyData.society_id) {
              setSociety(societyData);
              setLoading(false);
              localStorage.removeItem("selectedSociety");
              return;
            }
          }
          setError("No society ID found");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `http://localhost:8000/Society-Page.php?id=${currentSocietyId}`,
          { method: "GET", credentials: "include" }
        );

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        if (data.society_found) {
          setSociety(data.society_data);
          setIsMember(data.is_member || false);
          setMembershipStatus(data.membership_status);
          setUserLoggedIn(data.user_logged_in || false);
        } else {
          setError(data.message || "Society not found");
        }
      } catch (err) {
        setError(`Failed to fetch society: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSocietyData();
  }, [societyId]);

  const handleJoinSociety = async () => {
    if (!userLoggedIn) {
      alert("You must be logged in to join a society.");
      return;
    }
    if (!society?.society_id) {
      alert("Society information not available");
      return;
    }

    setJoinLoading(true);
    try {
      const response = await fetch("http://localhost:8000/Join-Society.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ society_id: society.society_id }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        alert("Membership request sent successfully!");
        setMembershipStatus("pending");
      } else {
        alert(data.message || "Failed to join society");
      }
    } catch (err) {
      alert("Failed to send membership request");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4">
        <div>Loading society information...</div>
        <div className="text-sm mt-2">Society ID: {societyId || "N/A"}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 bg-gray-400 text-white rounded-full shadow hover:bg-gray-500 transition"
        >
          ← Back to Societies
        </button>
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
          <h3 className="font-semibold mb-2">Error Loading Society</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!society) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col gap-8 font-sans">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-400 text-white rounded-full shadow hover:bg-gray-500 transition"
      >
        ← Back to Societies
      </button>

      {/* Society Info */}
      <div className="bg-white rounded-2xl shadow-md p-6 text-center">
        {society.logo_url && (
          <img
            src={`http://localhost:8000/${society.logo_url}`}
            alt={society.name}
            className="w-64 h-64 object-cover rounded-xl mb-4 mx-auto"
            onError={(e) => (e.target.style.display = "none")}
          />
        )}
        <h1 className="text-3xl font-bold text-purple-700 mb-2">{society.name}</h1>
        <p className="text-gray-700 text-base leading-relaxed mb-4">{society.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-gray-700">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <strong>Contact:</strong> {society.contact_email || "N/A"}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <strong>Founded:</strong> {formatDate(society.created_at)}
          </div>
        </div>
      </div>

      {/* Membership Section */}
      {!userLoggedIn ? (
        <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <h2 className="text-xl font-semibold">Login Required</h2>
          <p className="my-2">You must be logged in to join societies.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      ) : !isMember && membershipStatus !== "pending" ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow text-center">
          <button
            onClick={handleJoinSociety}
            disabled={joinLoading}
            className={`px-6 py-3 rounded-full font-semibold text-white transition ${
              joinLoading ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {joinLoading ? "Sending Request..." : "Join Society"}
          </button>
        </div>
      ) : membershipStatus === "pending" ? (
        <div className="text-center p-6 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800">
          <h2 className="font-semibold">Membership Pending</h2>
          <p className="mt-2">Your request is being reviewed by society administrators.</p>
        </div>
      ) : (
        <div className="text-center p-6 bg-green-50 border border-green-300 rounded-lg text-green-800">
          <h2 className="font-semibold">✓ You are a member</h2>
          <p className="mt-2">Welcome! You have full access to society activities and events.</p>
        </div>
      )}
    </div>
  );
}

export default SocietyPage;
