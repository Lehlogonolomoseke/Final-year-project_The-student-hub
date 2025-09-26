import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

function CreateProfile() {
  const [profileInfo, setInfo] = useState({
    name: "",
    description: "",
    category: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setInfo((prev) => ({
      ...prev,
      image: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", profileInfo.name);
      formData.append("description", profileInfo.description);
      formData.append("category", profileInfo.category);
      if (profileInfo.image) {
        formData.append("image", profileInfo.image);
      }

      const res = await axios.post(
        `http://localhost:8000/Create-Profile.php`, // Updated to match your port
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      // Check if response indicates success
      if (res.data.success) {
        setMsg({ type: "success", text: res.data.message || "Profile Updated Successfully." });
        setInfo({ name: "", description: "", category: "", image: null });

        // Reset file input
        const fileInput = document.getElementById("image");
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        throw new Error(res.data.message || "Unknown error occurred");
      }
    } catch (err) {
      console.error("Profile creation error:", err);

      let errorMessage = "Error: Profile not updated.";

      if (err.response?.data) {
        if (err.response.data.errors) {
          // Handle validation errors
          const errors = err.response.data.errors;
          const errorMessages = Object.values(errors).join(", ");
          errorMessage = `Error: ${errorMessages}`;
        } else if (err.response.data.error) {
          errorMessage = `Error: ${err.response.data.error}`;
        } else if (err.response.data.message) {
          errorMessage = `Error: ${err.response.data.message}`;
        }
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setMsg({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Update Society Profile
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Complete your society profile by adding description, category, and logo.
      </Typography>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2 }}>
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
          helperText="This will update your society name if different"
        />

        <TextField
          fullWidth
          required
          label="Society Description"
          name="description"
          value={profileInfo.description}
          onChange={handleChange}
          margin="normal"
          multiline
          minRows={3}
          helperText="Describe what your society is about"
        />

        <FormControl fullWidth required margin="normal">
          <InputLabel id="category-label">Select Category</InputLabel>
          <Select
            labelId="category-label"
            name="category"
            value={profileInfo.category}
            onChange={handleChange}
            label="Select Category"
            sx={{ height: 56 }}
          >
            <MenuItem value="">
              <em>-- Select a category --</em>
            </MenuItem>
            <MenuItem value="Academic">Academic</MenuItem>
            <MenuItem value="Religious">Religious</MenuItem>
            <MenuItem value="Social">Social</MenuItem>
            <MenuItem value="Political">Political</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <InputLabel htmlFor="image" sx={{ mb: 1 }}>
            Society Logo *
          </InputLabel>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            required
            style={{
              display: "block",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "100%",
            }}
          />
          {profileInfo.image && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", color: "success.main" }}>
              Selected: {profileInfo.image.name}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Accepted formats: JPG, PNG, GIF, WebP (Max size: 5MB)
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          startIcon={loading && <CircularProgress color="inherit" size={20} />}
          sx={{
            mt: 3,
            py: 1.8,
            fontWeight: "bold",
            fontSize: "1.1rem",
            backgroundColor: "#1976d2",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
            "&:disabled": {
              backgroundColor: "#ccc",
            },
          }}
        >
          {loading ? "Updating..." : "Update Society Profile"}
        </Button>
      </form>
    </Box>
  );
}

export default CreateProfile;
