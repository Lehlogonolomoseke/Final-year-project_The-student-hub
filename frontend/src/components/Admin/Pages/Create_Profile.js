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

function CreateProfile() {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const categories = [
    { value: "Academic", label: "Academic" },
    { value: "Religious", label: "Religious" },
    { value: "Social", label: "Social" },
    { value: "Political", label: "Political" },
    { value: "Other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    if (!image) {
      setMsg({ type: "error", text: "Please upload a society logo." });
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      for (const key in profileInfo) {
        formData.append(key, profileInfo[key]);
      }
      formData.append("image", image);

      const res = await axios.post(
        "http://localhost/student-hub/backend/Create-Profile.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        setMsg({ type: "success", text: "Profile Created Successfully." });
        setProfileInfo({ name: "", description: "", category: "" });
        setImage(null);
      } else {
        setMsg({ type: "error", text: res.data.error || "Error: Profile not created." });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setMsg({ type: "error", text: "Network error or server issue. Profile not created." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create Society Profile</h1>
      </div>

      <Paper sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {msg && (
          <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Society Name"
            name="name"
            value={profileInfo.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Description"
            name="description"
            value={profileInfo.description}
            onChange={handleChange}
            margin="normal"
            multiline
            minRows={3}
          />

          <FormControl fullWidth required margin="normal">
            <InputLabel id="category-label">Select Category</InputLabel>
            <Select
              labelId="category-label"
              name="category"
              value={profileInfo.category}
              onChange={handleChange}
              sx={{ height: 56 }}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, mb: 3 }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="profile-image-upload"
              type="file"
              onChange={(e) => setImage(e.target.files[0])}
              required
            />
            <label htmlFor="profile-image-upload">
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
                Upload Society Logo
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
            {loading ? "Submitting..." : "Submit Profile"}
          </Button>
        </form>
      </Paper>
    </div>
  );
}

export default CreateProfile;
