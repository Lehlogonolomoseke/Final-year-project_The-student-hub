import React, { useState } from "react";
import axios from "axios";
import { Box, Typography, TextField, Button, Paper, Alert, Stack, Container } from "@mui/material";

function Create_Society() {
  const [profileInfo, setInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await axios.post("http://localhost/student-hub/backend/Societies.php", profileInfo, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setSuccess("Society Created Successfully!");
      setInfo({ name: "", email: "", password: "" });
    } catch (err) {
      setError("Error: Society not Created. Please try again.");
      console.error(err);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 4, fontWeight: "bold", color: "#2b1745" }}
        >
          Create Society
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <TextField
              label="Society Name"
              name="name"
              value={profileInfo.name}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Society Email"
              name="email"
              type="email"
              value={profileInfo.email}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={profileInfo.password}
              onChange={handleChange}
              required
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "#6a1b9a",
                "&:hover": { bgcolor: "#5a1a7a" },
                color: "#fff",
                fontWeight: "bold",
                py: 1.5,
              }}
            >
              Submit
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

export default Create_Society;
