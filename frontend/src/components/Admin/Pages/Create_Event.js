import React, { useState } from "react";
import {
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Box,
} from "@mui/material";
import axios from "axios";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function CreateEvent() {
  const [eventInfo, setEventInfo] = useState({
    name: "",
    description: "",
    location: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    is_private: "false",
    notices: "",
    capacity: "",
    event_type: "other",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const eventTypes = [
    { value: "social", label: "Social" },
    { value: "fitness", label: "Fitness" },
    { value: "masterclass", label: "Masterclass" },
    { value: "webinar", label: "Webinar" },
    { value: "conference", label: "Conference" },
    { value: "guest lecture", label: "Guest Lecture" },
    { value: "bootcamp", label: "Bootcamp" },
    { value: "hackathon", label: "Hackathon" },
    { value: "theatre night", label: "Theatre Night" },
    { value: "awareness campaign", label: "Awareness Campaign" },
    { value: "fundraisers", label: "Fundraisers" },
    { value: "protest", label: "Protest" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      for (const key in eventInfo) {
        formData.append(key, eventInfo[key]);
      }
      if (image) {
        formData.append("event_image", image);
      } else {
        setMsg({ type: "error", text: "Please select an event image." });
        setLoading(false);
        return;
      }

      const res = await axios.post("http://localhost:8000/Event-creation.php", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        setMsg({ type: "success", text: "Event Created Successfully." });
        setEventInfo({
          name: "",
          description: "",
          location: "",
          start_date: "",
          start_time: "",
          end_date: "",
          end_time: "",
          is_private: "false",
          notices: "",
          capacity: "",
          event_type: "other",
        });
        setImage(null);
      } else {
        setMsg({ type: "error", text: res.data.error || "Error: Event not created." });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setMsg({ type: "error", text: "Network error or server issue. Event not created." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create Event</h1>
      </div>

      <Paper className="card" sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {msg && (
          <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Event Name"
            name="name"
            value={eventInfo.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Description"
            name="description"
            value={eventInfo.description}
            onChange={handleChange}
            margin="normal"
            multiline
            minRows={3}
          />

          <TextField
            fullWidth
            required
            label="Location"
            name="location"
            value={eventInfo.location}
            onChange={handleChange}
            margin="normal"
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <TextField
              required
              label="Start Date"
              name="start_date"
              type="date"
              value={eventInfo.start_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              required
              label="Start Time"
              name="start_time"
              type="time"
              value={eventInfo.start_time}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <TextField
              required
              label="End Date"
              name="end_date"
              type="date"
              value={eventInfo.end_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              required
              label="End Time"
              name="end_time"
              type="time"
              value={eventInfo.end_time}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            fullWidth
            required
            type="number"
            label="Capacity"
            name="capacity"
            value={eventInfo.capacity}
            onChange={handleChange}
            inputProps={{ min: 1 }}
            margin="normal"
          />

          <FormControl fullWidth required margin="normal">
            <InputLabel id="event-type-label">Event Type</InputLabel>
            <Select
              labelId="event-type-label"
              name="event_type"
              value={eventInfo.event_type}
              onChange={handleChange}
              sx={{ height: 56 }}
            >
              {eventTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="is-private-label">Private Event</InputLabel>
            <Select
              labelId="is-private-label"
              name="is_private"
              value={eventInfo.is_private}
              onChange={handleChange}
              sx={{ height: 56 }}
            >
              <MenuItem value="false">Public</MenuItem>
              <MenuItem value="true">Private</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Notices"
            name="notices"
            value={eventInfo.notices}
            onChange={handleChange}
            margin="normal"
          />

          <Box sx={{ mt: 2, mb: 3 }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="event-image-upload"
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
            <label htmlFor="event-image-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{
                  py: 1.8,
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  backgroundColor: "#1976d2",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#1565c0" },
                }}
              >
                Upload Event Image
              </Button>
            </label>
            {image && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}>
                Selected: {image.name}
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress color="inherit" size={20} /> : null}
            sx={{
              mt: 3,
              py: 1.8,
              fontWeight: "bold",
              fontSize: "1.1rem",
              backgroundColor: "#1976d2",
              color: "#fff",
              "&:hover": { backgroundColor: "#1565c0" },
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.5)",
                backgroundColor: "#90caf9",
              },
            }}
          >
            {loading ? "Submitting..." : "Submit Event"}
          </Button>
        </form>
      </Paper>
    </div>
  );
}

export default CreateEvent;
