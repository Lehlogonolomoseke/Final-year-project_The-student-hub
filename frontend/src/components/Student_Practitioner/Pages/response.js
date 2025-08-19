import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function Response() {
  const getFileIdFromUrl = useCallback(() => {
    const path = window.location.pathname;
    const segments = path.split("/");
    return segments[segments.length - 1];
  }, []);

  const fileId = getFileIdFromUrl();

  const [formData, setFormData] = useState({
    response_type: "",
    venue_details: "",
    comments: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!fileId || isNaN(fileId)) {
      setSubmitMessage({ type: "error", text: "Invalid file ID in URL." });
    }
  }, [fileId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.response_type) {
      newErrors.response_type = "Please select either Accept or Reject.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.response_type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: "", text: "" });
    setErrors({});

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    if (!fileId || isNaN(fileId)) {
      setSubmitMessage({ type: "error", text: "Invalid file ID." });
      setIsSubmitting(false);
      return;
    }

    try {
      const dataToSend = {
        fileId: parseInt(fileId),
        response_type: formData.response_type,
        venue_details: formData.venue_details,
        comments: formData.comments,
      };

      const response = await fetch("http://localhost:8000/response.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitMessage({ type: "success", text: "Response sent successfully!" });
        setFormData({ response_type: "", venue_details: "", comments: "" });
      } else {
        setSubmitMessage({ type: "error", text: result.error || "Failed to send response." });
      }
    } catch (submitError) {
      setSubmitMessage({ type: "error", text: "Network error. Please check your connection." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper className="page-container" elevation={4}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: "#2e2e48", fontWeight: "bold", mb: 2 }}
          align="center"
        >
          Response Form
        </Typography>

        <Typography
          variant="subtitle1"
          gutterBottom
          align="center"
          sx={{ mb: 3, color: "text.secondary" }}
        >
          File ID: <strong>{fileId}</strong>
        </Typography>

        {submitMessage.text && (
          <Alert
            severity={submitMessage.type}
            sx={{ mb: 3 }}
            onClose={() => setSubmitMessage({ type: "", text: "" })}
          >
            {submitMessage.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: "bold", color: "#2e2e48" }}>
              Response Decision:
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={() => setFormData((prev) => ({ ...prev, response_type: "accepted" }))}
                startIcon={<CheckCircleOutlineIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: "8px",
                  fontWeight: "bold",
                  color: "#fff",
                  bgcolor: "#2e7d32",
                  "&:hover": {
                    bgcolor: "#1b5e20",
                  },
                }}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                onClick={() => setFormData((prev) => ({ ...prev, response_type: "rejected" }))}
                startIcon={<CancelOutlinedIcon />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: "8px",
                  fontWeight: "bold",
                  color: "#fff",
                  bgcolor: "#d32f2f",
                  "&:hover": {
                    bgcolor: "#9a0007",
                  },
                }}
              >
                Reject
              </Button>
            </Stack>
            {errors.response_type && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                {errors.response_type}
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Venue Details"
              name="venue_details"
              value={formData.venue_details}
              onChange={handleChange}
              variant="outlined"
              placeholder="Provide venue details here..."
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              variant="outlined"
              placeholder="Add any additional comments..."
            />
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />
              }
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: "8px",
                fontWeight: "bold",
                bgcolor: "#6a1b9a",
                color: "#fff",
                "&:hover": { bgcolor: "#4a148c" },
              }}
            >
              {isSubmitting ? "Sending..." : "Submit Response"}
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={() => window.history.back()}
              startIcon={<ArrowBackIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: "8px",
                fontWeight: "bold",
                borderColor: "#6a1b9a",
                color: "#6a1b9a",
                "&:hover": { bgcolor: "#f3e5f5" },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default Response;
