import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate } from "react-router-dom";

const statusColors = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
};

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const goToCreateEvent = () => navigate("/admin/create-event");

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:8000/Upcoming-Events.php", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
        setFilteredEvents(data.events);
      } else {
        console.error("Failed to fetch events:", data.error);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (event) => {
    const status = event.target.value;
    setStatusFilter(status);

    if (status === "all") {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((eventItem) => eventItem.status === status);
      setFilteredEvents(filtered);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 8, px: 2, mt: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ overflow: "hidden", borderRadius: 2 }}>
          {/* Header section */}
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              p: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              My Society Events
            </Typography>
          </Box>

          {/* Content section */}
          <Box sx={{ p: 4 }}>
            {/* Status filter dropdown */}
            <FormControl sx={{ mb: 4, minWidth: 180 }} size="small">
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="statusFilter"
                value={statusFilter}
                label="Filter by Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            {/* Events list or "No events found" message */}
            {filteredEvents.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 12,
                  color: "text.secondary",
                }}
              >
                <Typography variant="h6" mb={1}>
                  No events found
                </Typography>
                <Typography>No events match the current filter criteria.</Typography>
              </Box>
            ) : (
              filteredEvents.map((event) => (
                <Paper
                  key={event.upload_id}
                  variant="outlined"
                  sx={{ p: 3, mb: 4, bgcolor: "background.paper", borderRadius: 2 }}
                >
                  {/* Event Title */}
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {event.event_name || "Untitled Event"}
                  </Typography>

                  {/* Event information */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.event_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {event.days_until_event} days until event
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Uploaded: {formatDate(event.uploaded_at)}
                    </Typography>
                    <Chip
                      label={event.status.toUpperCase()}
                      color={statusColors[event.status]}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  {/* Venue Information */}
                  {event.status === "accepted" && event.venue_details && (
                    <Box
                      sx={{
                        bgcolor: "grey.100",
                        p: 2,
                        borderRadius: 1,
                        mb: 3,
                      }}
                    >
                      <Typography fontWeight="medium" gutterBottom>
                        Venue Information
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        <strong>Location:</strong> {event.venue_details}
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={goToCreateEvent}
                        startIcon={<SendIcon />}
                        size="small"
                        sx={{
                          bgcolor: "#007bff",
                          color: "#fff",
                          "&:hover": { bgcolor: "#0056b3" },
                        }}
                      >
                        Create Event
                      </Button>
                    </Box>
                  )}

                  {/* Comments Section */}
                  {event.comments && (
                    <Box
                      sx={{
                        bgcolor: "grey.100",
                        p: 2,
                        borderRadius: 1,
                      }}
                    >
                      <Typography fontWeight="medium" gutterBottom>
                        Comments & Feedback
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          p: 2,
                          borderLeft: 4,
                          borderColor: "primary.main",
                          borderRadius: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" mb={1}>
                          <strong>Admin</strong> • {formatDate(event.uploaded_at)}
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {event.comments}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default UpcomingEvents;
