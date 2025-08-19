import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Button, CircularProgress, Box } from "@mui/material";

const MoreInfo = () => {
  const { uploadId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uploadId || isNaN(uploadId)) {
      setError("Invalid upload ID in URL");
      setLoading(false);
      return;
    }
    fetchEventData();
  }, [uploadId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`http://localhost:8000/more_info.php?upload_id=${uploadId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setEventData(result);
      } else {
        setError(result.error || "Failed to fetch event data");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

  const formatTime = (timeString) =>
    timeString
      ? new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const formatCurrency = (amount) =>
    amount
      ? `R ${parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      : "N/A";

  if (loading)
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading event information...
        </Typography>
      </Container>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, bgcolor: "#ffe6e6", border: "1px solid #ffcccc", borderRadius: 2 }}>
          <Typography variant="h6" color="error" align="center">
            {error}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              sx={{ bgcolor: "#6a1b9a", "&:hover": { bgcolor: "#5a1a7a" }, color: "#fff" }}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    );

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 4, fontWeight: "bold", color: "#2b1745" }}
        >
          Event Information
        </Typography>

        {/* Event Costs */}
        <Paper sx={{ mb: 4, borderRadius: 2, overflow: "hidden" }} elevation={2}>
          <Box sx={{ bgcolor: "#6a1b9a", p: 2 }}>
            <Typography sx={{ color: "#fff", fontWeight: "bold" }}>Event Costs & Budget</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography>
              <strong>Total Budget:</strong>{" "}
              <span style={{ color: "#2e7d32", fontWeight: "600" }}>
                {formatCurrency(eventData.event_costs.total_budget)}
              </span>
            </Typography>
            <Typography>
              <strong>Cost Items:</strong> {eventData.event_costs.items_count} item(s)
            </Typography>

            {eventData.event_costs.cost_items?.length > 0 &&
              eventData.event_costs.cost_items.map((item, index) => (
                <Paper key={item.id || index} sx={{ mt: 2, p: 2, borderLeft: "4px solid #6a1b9a" }}>
                  <Typography>
                    <strong>Item Name:</strong> {item.name || "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Budget:</strong>{" "}
                    <span style={{ color: "#2e7d32", fontWeight: "600" }}>
                      {formatCurrency(item.budget)}
                    </span>
                  </Typography>
                  <Typography>
                    <strong>Created:</strong> {formatDate(item.created_at)}
                  </Typography>
                  {item.comments && (
                    <Typography>
                      <strong>Comments:</strong> <em>{item.comments}</em>
                    </Typography>
                  )}
                </Paper>
              ))}
          </Box>
        </Paper>

        {/* Venue Booking */}
        {eventData.venue_booking ? (
          <Paper sx={{ mb: 4, borderRadius: 2, overflow: "hidden" }} elevation={2}>
            <Box sx={{ bgcolor: "#2e7d32", p: 2 }}>
              <Typography sx={{ color: "#fff", fontWeight: "bold" }}>
                Venue Booking Request
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#2e7d32", mb: 2 }}>
                Venue Preferences
              </Typography>
              <Typography>
                <strong>Preferred Venue:</strong> {eventData.venue_booking.prefered_venue || "N/A"}
              </Typography>
              <Typography>
                <strong>Alternative 1:</strong>{" "}
                {eventData.venue_booking.alternative_venue_1 || "N/A"}
              </Typography>
              <Typography>
                <strong>Alternative 2:</strong>{" "}
                {eventData.venue_booking.alternative_venue_2 || "N/A"}
              </Typography>

              <Typography variant="h6" sx={{ color: "#2e7d32", mt: 3, mb: 2 }}>
                Date & Time
              </Typography>
              <Typography>
                <strong>Booking Date:</strong> {formatDate(eventData.venue_booking.booking_date)}
              </Typography>
              <Typography>
                <strong>Start Time:</strong> {formatTime(eventData.venue_booking.start_time)}
              </Typography>
              <Typography>
                <strong>End Time:</strong> {formatTime(eventData.venue_booking.end_time)}
              </Typography>

              <Typography variant="h6" sx={{ color: "#2e7d32", mt: 3, mb: 2 }}>
                Furniture Requirements
              </Typography>
              <Typography>
                <strong>Furniture Required:</strong>{" "}
                <span
                  style={{
                    color: eventData.venue_booking.furniture_required ? "#2e7d32" : "#d32f2f",
                    fontWeight: "600",
                  }}
                >
                  {eventData.venue_booking.furniture_required ? "Yes" : "No"}
                </span>
              </Typography>

              {eventData.venue_booking.furniture_required && (
                <>
                  <Typography>
                    <strong>Furniture Types:</strong>{" "}
                    {eventData.venue_booking.furniture_types?.length
                      ? eventData.venue_booking.furniture_types.join(", ")
                      : "N/A"}
                  </Typography>
                  <Typography>
                    <strong>Other Furniture Details:</strong>{" "}
                    {eventData.venue_booking.other_furniture_details || "N/A"}
                  </Typography>
                </>
              )}

              {eventData.venue_booking.special_requirements && (
                <>
                  <Typography variant="h6" sx={{ color: "#2e7d32", mt: 3, mb: 2 }}>
                    Special Requirements
                  </Typography>
                  <Box
                    sx={{
                      bgcolor: "#f1f8e9",
                      p: 2,
                      borderRadius: 1,
                      borderLeft: "4px solid #2e7d32",
                    }}
                  >
                    {eventData.venue_booking.special_requirements}
                  </Box>
                </>
              )}

              <Typography sx={{ mt: 3 }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    fontSize: "14px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    backgroundColor:
                      eventData.venue_booking.status === "approved" ? "#e8f5e8" : "#fff3e0",
                    color: eventData.venue_booking.status === "approved" ? "#2e7d32" : "#f57c00",
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {eventData.venue_booking.status || "Pending"}
                </span>
              </Typography>

              <Typography>
                <strong>Rules Acknowledged:</strong>{" "}
                <span
                  style={{
                    color: eventData.venue_booking.acknowledge_rules ? "#2e7d32" : "#d32f2f",
                    fontWeight: "600",
                  }}
                >
                  {eventData.venue_booking.acknowledge_rules ? "Yes" : "No"}
                </span>
              </Typography>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: "center", mb: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No Venue Booking Request
            </Typography>
            <Typography color="text.secondary">
              No venue booking information is associated with this event.
            </Typography>
          </Paper>
        )}

        {/* Action Button */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="contained"
            sx={{ bgcolor: "#6a1b9a", "&:hover": { bgcolor: "#5a1a7a" }, color: "#fff" }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default MoreInfo;
