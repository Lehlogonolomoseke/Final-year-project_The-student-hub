import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material";

function CreateDayhouseProfile() {
  const [dayhouseInfo, setDayhouseInfo] = useState({
    name: "",
    description: "",
    sports: [],
    image: null,
  });

  const sportsList = [
    { id: 1, name: "Soccer" },
    { id: 2, name: "Hockey" },
    { id: 3, name: "Netball" },
    { id: 4, name: "Basketball" },
    { id: 5, name: "Theatre" },
    { id: 6, name: "Chess" },
    { id: 7, name: "Rugby" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDayhouseInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDayhouseInfo((prev) => ({
      ...prev,
      image: file,
    }));
  };

  const handleSportsChange = (e) => {
    const { value, checked } = e.target;
    const sportId = parseInt(value, 10);

    setDayhouseInfo((prev) => {
      const updatedSports = checked
        ? [...prev.sports, sportId]
        : prev.sports.filter((sport) => sport !== sportId);
      return {
        ...prev,
        sports: updatedSports,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", dayhouseInfo.name);
    formData.append("description", dayhouseInfo.description);
    formData.append("image", dayhouseInfo.image);
    formData.append("sports", JSON.stringify(dayhouseInfo.sports));

    console.log("Submitting sports:", dayhouseInfo.sports);

    try {
      const res = await axios.post(
        "http://localhost/student-hub/backend/dayhouse_profile.php",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      alert("Dayhouse Profile Created");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error: Dayhouse profile not created");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Dayhouse Profile
        </Typography>

        <TextField
          fullWidth
          label="Dayhouse Name"
          name="name"
          value={dayhouseInfo.name}
          onChange={handleChange}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Description"
          name="description"
          multiline
          rows={4}
          value={dayhouseInfo.description}
          onChange={handleChange}
          margin="normal"
          required
        />

        <FormControl component="fieldset" sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Sports
          </Typography>
          <FormGroup>
            {sportsList.map((sport) => (
              <FormControlLabel
                key={sport.id}
                control={
                  <Checkbox
                    value={sport.id}
                    checked={dayhouseInfo.sports.includes(sport.id)}
                    onChange={handleSportsChange}
                  />
                }
                label={sport.name}
              />
            ))}
          </FormGroup>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <InputLabel htmlFor="image" sx={{ mb: 1 }}>
            Upload Dayhouse Logo
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
              padding: "8px 12px",
              background: "#f5f5f5",
              borderRadius: "4px",
            }}
          />
        </Box>

        <Typography sx={{ mt: 2, color: "red" }}>
          <strong>Note:</strong> R100 fee must be paid in person after submission.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          sx={{ mt: 3, color: "#fff" }}
          fullWidth
        >
          Submit Dayhouse Profile
        </Button>
      </Box>
    </Container>
  );
}

export default CreateDayhouseProfile;
