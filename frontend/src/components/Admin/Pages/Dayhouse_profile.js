import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  FormControl,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";

function CreateDayhouseProfile() {
  const [dayhouseInfo, setDayhouseInfo] = useState({
    name: "",
    description: "",
    sports: [],
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const sportsList = ["Soccer", "Hockey", "Netball", "Basketball", "Theatre", "Chess", "Rugby"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDayhouseInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSportsChange = (e) => {
    const { value, checked } = e.target;
    setDayhouseInfo((prev) => {
      const updatedSports = checked
        ? [...prev.sports, value]
        : prev.sports.filter((sport) => sport !== value);
      return { ...prev, sports: updatedSports };
    });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!image) {
      setMsg({ type: "error", text: "Please upload a Dayhouse logo." });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", dayhouseInfo.name);
      formData.append("description", dayhouseInfo.description);
      formData.append("sports", JSON.stringify(dayhouseInfo.sports));
      formData.append("image", image);

      const res = await axios.post(
        "http://localhost/student-hub/backend/dayhouse_profile.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setMsg({ type: "success", text: "Dayhouse Profile Created Successfully." });
      setDayhouseInfo({ name: "", description: "", sports: [] });
      setImage(null);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Error: Dayhouse profile not created." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Dayhouse Profile
        </Typography>

        {msg && (
          <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>
            {msg.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            label="Dayhouse Name"
            name="name"
            value={dayhouseInfo.name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Description"
            name="description"
            value={dayhouseInfo.description}
            onChange={handleChange}
            margin="normal"
            multiline
            minRows={4}
          />

          <FormControl component="fieldset" sx={{ mt: 3, width: "100%" }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Sports
            </Typography>
            <FormGroup
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
              }}
            >
              {sportsList.map((sport) => (
                <FormControlLabel
                  key={sport}
                  control={
                    <Checkbox
                      value={sport}
                      checked={dayhouseInfo.sports.includes(sport)}
                      onChange={handleSportsChange}
                    />
                  }
                  label={sport}
                />
              ))}
            </FormGroup>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="dayhouse-image-upload"
              type="file"
              onChange={handleFileChange}
              required
            />
            <label htmlFor="dayhouse-image-upload">
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
                Upload Dayhouse Logo
              </Button>
            </label>
            {image && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", textAlign: "center" }}>
                Selected: {image.name}
              </Typography>
            )}
          </Box>

          <Typography sx={{ mt: 2, color: "red", fontSize: "0.9rem" }}>
            <strong>Note:</strong> R100 fee must be paid in person after submission.
          </Typography>

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
            {loading ? "Submitting..." : "Submit Dayhouse Profile"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default CreateDayhouseProfile;
