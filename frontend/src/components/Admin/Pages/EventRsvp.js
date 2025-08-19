import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  CardMedia,
  Chip,
} from "@mui/material";
import axios from "axios";

function EventPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromEventsPage = location.state?.fromEventsPage || false;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError("No event ID provided");
      setLoading(false);
      return;
    }
    fetchEvent();
    fetchRSVPStatus();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/get_event.php?event_id=${eventId}`, {
        withCredentials: true,
      });
      if (res.data.success) setEvent(res.data.event);
      else setError(res.data.message || "Failed to fetch event");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch event. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRSVPStatus = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/event_rsvp.php?event_id=${eventId}`, {
        withCredentials: true,
      });
      if (res.data.success) setRsvpStatus(res.data.status);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRSVP = async (status) => {
    setRsvpLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/event_rsvp.php",
        { event_id: parseInt(eventId), status },
        { withCredentials: true }
      );
      if (res.data.success) setRsvpStatus(status);
      else alert(res.data.message || "Failed to update RSVP");
    } catch (err) {
      console.error(err);
      alert("Failed to update RSVP. Check connection.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "No response yet";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          p: 5,
          mt: 8,
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading event details...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Typography variant="h5" color="error" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Box sx={{ px: { xs: 2, md: 4 }, mt: 6, mb: 6 }}>
          <Button
            onClick={() => navigate("/student/event")}
            variant="contained"
            sx={{
              backgroundColor: "#FF6F00",
              color: "#fff",
              fontWeight: "medium",
              borderRadius: "50px",
              px: 4,
              py: 1.5,
              "&:hover": { backgroundColor: "#E65C00" },
            }}
          >
            ← Back to Events
          </Button>
        </Box>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ pt: 10, pb: 5 }}>
      {/* Back Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#FF6F00",
            color: "#fff",
            borderRadius: "50px",
            px: 4,
            py: 1.5,
            "&:hover": { backgroundColor: "#E65C00" },
          }}
          onClick={() => navigate("/student/event")}
        >
          ← Back to Events
        </Button>
      </Box>

      {/* Event Hero */}
      <Paper
        elevation={3}
        sx={{
          p: 6,
          borderRadius: 4,
          mb: 6,
          backgroundColor: "#FFF3E0",
          textAlign: "center",
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: "bold", color: "#FF6F00", mb: 2 }}>
          {event.name}
        </Typography>
        <Typography sx={{ color: "#944E00", mb: 3 }}>{event.description}</Typography>
        {event.image && (
          <CardMedia
            component="img"
            height="300"
            image={`http://localhost:8000/${event.image}`}
            alt={event.name}
            sx={{ borderRadius: 2, objectFit: "cover" }}
          />
        )}
      </Paper>

      {/* Event Details & RSVP */}
      <Grid container spacing={4}>
        {/* Event Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#FF6F00" }}>
              Event Details
            </Typography>
            <Typography>
              <strong>Location:</strong> {event.location || "TBA"}
            </Typography>
            <Typography>
              <strong>Start Date:</strong> {event.start_date || "TBA"}
            </Typography>
            {event.end_date && (
              <Typography>
                <strong>End Date:</strong> {event.end_date}
              </Typography>
            )}
            {event.start_time && (
              <Typography>
                <strong>Time:</strong> {event.start_time}{" "}
                {event.end_time ? `- ${event.end_time}` : ""}
              </Typography>
            )}
            {event.event_type && (
              <Typography>
                <strong>Type:</strong>{" "}
                <Chip
                  label={event.event_type}
                  sx={{ bgcolor: "#FFEDD5", color: "#FF6F00", fontWeight: "bold", ml: 1 }}
                />
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* RSVP Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3, color: "#FF6F00" }}>
              Will you be attending?
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
              <Button
                variant={rsvpStatus === "Intrested" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: rsvpStatus === "Intrested" ? "#2E7D32" : "#fff",
                  color: rsvpStatus === "Intrested" ? "#fff" : "#2E7D32",
                  "&:hover": {
                    backgroundColor: rsvpStatus === "Intrested" ? "#1B5E20" : "#F0F0F0",
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                }}
                onClick={() => handleRSVP("Intrested")}
                disabled={rsvpLoading}
              >
                {rsvpLoading && rsvpStatus === "Intrested" ? (
                  <CircularProgress size={24} />
                ) : (
                  "Interested"
                )}
              </Button>

              <Button
                variant={rsvpStatus === "Not Intrested" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: rsvpStatus === "Not Intrested" ? "#C62828" : "#fff",
                  color: rsvpStatus === "Not Intrested" ? "#fff" : "#C62828",
                  "&:hover": {
                    backgroundColor: rsvpStatus === "Not Intrested" ? "#8E0000" : "#F0F0F0",
                  },
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                }}
                onClick={() => handleRSVP("Not Intrested")}
                disabled={rsvpLoading}
              >
                {rsvpLoading && rsvpStatus === "Not Intrested" ? (
                  <CircularProgress size={24} />
                ) : (
                  "Not Interested"
                )}
              </Button>
            </Box>
            <Typography>
              <strong>Your current status:</strong> {formatStatus(rsvpStatus)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default EventPage;
