import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Paper,
  IconButton,
  Collapse,
  Button,
  Fab,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Event,
  LocationOn,
  Visibility,
  Refresh,
} from "@mui/icons-material";

function AdminEvent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchAdminEvents();
  }, []);

  const fetchAdminEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8000/get_admin_events.php", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`
        );
      }

      if (data.success) {
        setEvents(data.events || []);
        setRetryCount(0);
      } else {
        throw new Error(data.message || "Failed to fetch events");
      }
    } catch (err) {
      let errorMessage = "Failed to load events.";
      if (err.message.includes("Failed to fetch")) {
        errorMessage =
          "Cannot connect to the backend server. Please ensure the backend is running on localhost:8000.";
      } else if (err.message.includes("invalid JSON")) {
        errorMessage = "Server returned invalid response (likely PHP error). Check logs.";
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchAdminEvents();
  };

  const toggleEventExpansion = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time) => {
    try {
      return new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Events...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert
          severity="error"
          action={
            <Button
              size="small"
              onClick={handleRetry}
              startIcon={<Refresh />}
              variant="contained"
              sx={{
                bgcolor: "#f15a22",
                color: "white !important",
                "&:hover": { bgcolor: "#d94e1d" },
              }}
            >
              Retry ({retryCount})
            </Button>
          }
        >
          <Typography variant="h6" gutterBottom>
            Connection Error
          </Typography>
          <Typography component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
            {error}
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (events.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ textAlign: "center", fontWeight: "bold" }}
        >
          Society Event Dashboard
        </Typography>
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Event sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Button
            variant="contained"
            onClick={handleRetry}
            sx={{
              mt: 2,
              bgcolor: "#f15a22",
              color: "white !important",
              "&:hover": { bgcolor: "#d94e1d" },
            }}
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5, position: "relative" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Admin Event Dashboard
        </Typography>
        <Button
          variant="contained"
          onClick={handleRetry}
          startIcon={<Refresh />}
          sx={{
            fontWeight: "bold",
            bgcolor: "#f15a22",
            color: "white !important",
            "&:hover": { bgcolor: "#d94e1d" },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Floating Refresh Button */}
      <Tooltip title="Refresh Events" placement="left">
        <Fab
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1200,
            bgcolor: "#f15a22",
            color: "white",
            "&:hover": { bgcolor: "#d94e1d" },
          }}
          onClick={handleRetry}
        >
          <Refresh />
        </Fab>
      </Tooltip>

      <Grid container spacing={3}>
        {events.map((event) => {
          const isExpanded = expandedEvents[event.event_id];
          const rsvpCounts = event.rsvp_counts || { interested: 0, not_interested: 0 };

          return (
            <Grid item xs={12} key={event.event_id}>
              <Card
                elevation={4}
                sx={{
                  borderRadius: 3,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": { transform: "scale(1.01)" },
                  bgcolor: "#fff", // Keep card light for readability
                }}
              >
                <CardContent>
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1, color: "#000" }}>
                        {event.name || "Unnamed Event"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                        <Event fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(event.start_date)} at {formatTime(event.start_time)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 2 }}>
                        <LocationOn fontSize="small" sx={{ color: "#000" }} />
                        <Typography variant="body2" sx={{ color: "#000" }}>
                          {event.location || "Location TBD"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        icon={<Visibility />}
                        label={event.is_private === 1 ? "Private" : "Public"}
                        color={event.is_private === 1 ? "error" : "success"}
                        size="small"
                      />
                      <IconButton onClick={() => toggleEventExpansion(event.event_id)} size="small">
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Quick Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          bgcolor: "success.main",
                          color: "#fff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          {rsvpCounts.interested}
                        </Typography>
                        <Typography variant="caption">Interested</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          bgcolor: "error.main",
                          color: "#fff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          {rsvpCounts.not_interested}
                        </Typography>
                        <Typography variant="caption">Not Interested</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          bgcolor: "info.main",
                          color: "#fff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          {event.attendance_count || 0}
                        </Typography>
                        <Typography variant="caption">Attended</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          bgcolor: "warning.main",
                          color: "#fff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          {event.capacity || "Unlimited"}
                        </Typography>
                        <Typography variant="caption">Capacity</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Expandable Details */}
                  <Collapse in={isExpanded}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "#000" }}>
                      Event Details
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: "#000" }}>
                      {event.description || "No description provided."}
                    </Typography>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}

export default AdminEvent;
