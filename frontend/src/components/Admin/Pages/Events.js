import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";

function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleEventClick = (event) => {
    navigate(`/student/events/${event.event_id}`, { state: { fromEventsPage: true } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8000/calender-events.php?public=1", {
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          withCredentials: true,
        });

        if (res.data.success && Array.isArray(res.data.events)) {
          setEvents(res.data.events);
        } else {
          console.warn("Unexpected response:", res.data);
          setError("Invalid data format received");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 5,
          mt: 8,
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading events...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="error" variant="filled">
          Error: {error}
        </Alert>
      </Container>
    );

  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <div>
        {/* Back Button */}
        <Box sx={{ px: { xs: 2, md: 4 }, mt: 6, mb: 6 }}>
          <Button
            onClick={() => navigate("/student/home")}
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
            ← Back to Home
          </Button>
        </Box>

        {/* Hero Section */}
        <Box
          sx={{
            textAlign: "center",
            px: { xs: 2, md: 0 },
            mb: 12,
            py: 10,
            background: "linear-gradient(to right, #FFEDD5, #FFF7ED, #FFFFFF)",
            borderRadius: 4,
            boxShadow: 3,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: "extrabold", color: "#FF6F00", mb: 3 }}>
            Public Events
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "#944E00", maxWidth: 900, mx: "auto", lineHeight: 1.7 }}
          >
            Discover exciting events happening across campus — connect, learn, and experience the
            vibrant student life at <span style={{ fontWeight: 600 }}>UJ</span>.
          </Typography>
        </Box>

        {/* Cards Section */}
        <Container maxWidth="lg">
          <Grid container spacing={6} justifyContent="center" alignItems="stretch">
            {events.map((event) => (
              <Grid item key={event.event_id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    },
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                  onClick={() => handleEventClick(event)}
                  elevation={3}
                >
                  {event.image ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={`http://localhost:8000/${event.image}`}
                      alt={`${event.name} image`}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 200,
                        backgroundColor: "#FFE6CC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#944E00",
                        fontSize: 14,
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      No Image Available
                    </Box>
                  )}

                  <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                    <Typography variant="h5" sx={{ color: "#FF6F00", fontWeight: "bold", mb: 1 }}>
                      {event.name}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#555", mb: 0.5 }}>
                      <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()}
                    </Typography>
                    {event.start_time && (
                      <Typography variant="body2" sx={{ color: "#555", mb: 0.5 }}>
                        <strong>Time:</strong> {event.start_time}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: "#555", mb: 1 }}>
                      <strong>Location:</strong> {event.location || "Not specified"}
                    </Typography>

                    {event.event_type && (
                      <Chip
                        label={event.event_type}
                        sx={{
                          bgcolor: "#FFEDD5",
                          color: "#FF6F00",
                          fontWeight: "bold",
                          fontSize: 12,
                          borderRadius: 1,
                          px: 1,
                          py: 0.5,
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        <Box
          sx={{
            backgroundColor: "#FFF3E0",
            py: 10,
            textAlign: "center",
            px: 4,
            borderRadius: 4,
            mt: 12,
          }}
        >
          <Typography sx={{ color: "#944E00", fontWeight: "medium", fontSize: 16 }}>
            There is a space waiting for you — go explore and find your vibe!
          </Typography>
        </Box>
      </div>
    </div>
  );
}

export default Events;
