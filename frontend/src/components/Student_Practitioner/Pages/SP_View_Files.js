import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  alpha,
  useTheme,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  TrendingUp as PriorityIcon,
  Event as DateIcon,
  Groups as SocietyIcon,
  CheckCircle as AcceptedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
} from "@mui/icons-material";

function ReceivedFiles() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("priority");
  const [sortOrder, setSortOrder] = useState("desc");

  const getPriorityLevel = (priority) =>
    ({ urgent: 4, high: 3, medium: 2, low: 1 }[priority?.toLowerCase()] || 1);

  const getPriorityColor = (priority) =>
    ({ urgent: "error", high: "warning", medium: "info", low: "success" }[
      priority?.toLowerCase()
    ] || "default");

  const getTimeStatusColor = (timeStatus, isOverdue) =>
    isOverdue
      ? "error"
      : timeStatus === "TODAY"
      ? "warning"
      : timeStatus === "TOMORROW"
      ? "info"
      : "default";

  // Function to format date without time
  const formatDateOnly = (dateString) => {
    if (!dateString) return "—";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";

      // Extract just the date part (remove time component)
      return date.toLocaleDateString();
    } catch (error) {
      return "—";
    }
  };

  // Group files by status for summary
  const groupFilesByStatus = (filesArray) => {
    const grouped = {
      ACCEPTED: [],
      PENDING: [],
      REJECTED: [],
      overdue: [],
    };

    filesArray.forEach((file) => {
      if (file.status === "ACCEPTED" || file.status === "accepted") {
        grouped.ACCEPTED.push(file);
      } else if (file.status === "PENDING" || file.status === "pending") {
        grouped.PENDING.push(file);
      } else if (file.status === "REJECTED" || file.status === "rejected") {
        grouped.REJECTED.push(file);
      }

      // Check for overdue files
      if (file.time_status === "OVERDUE") {
        grouped.overdue.push(file);
      }
    });

    return grouped;
  };

  const sortFiles = useCallback(
    (filesArray) =>
      [...filesArray].sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case "priority":
            cmp = getPriorityLevel(b.priority) - getPriorityLevel(a.priority);
            break;
          case "date":
            cmp = new Date(b.uploaded_at) - new Date(a.uploaded_at);
            break;
          case "society":
            cmp = (a.society_name || "").localeCompare(b.society_name || "");
            break;
          default:
            cmp = getPriorityLevel(b.priority) - getPriorityLevel(a.priority);
        }
        return sortOrder === "asc" ? cmp : -cmp;
      }),
    [sortBy, sortOrder]
  );

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/view_files.php", { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
        const data = await res.json();
        setFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, []);

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await fetch(`http://localhost:8000/view_files.php?download=1&id=${fileId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download file: " + err.message);
    }
  };

  const sendResponse = (fileId) => navigate(`/sp/response/${fileId}`);
  const moreInfo = (fileId) => navigate(`/sp/info/${fileId}`);

  const handleSort = (event, newSortBy) => {
    if (!newSortBy) return;
    if (sortBy === newSortBy) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading files...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          Error: {error}
        </Alert>
      </Container>
    );

  const sortedFiles = sortFiles(files);
  const groupedFiles = groupFilesByStatus(sortedFiles);

  // Sample data based on your image with long file names
  const sampleFiles = [
    {
      id: 1,
      society_name: "Rapidsociety",
      file_name: "proc00 design (1) (2).pdf",
      event_date: "8/28/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/5/2025",
      status: "REJECTED",
      priority: "Low",
    },
    {
      id: 2,
      society_name: "Nation",
      file_name: "event_proposal_98_1755770076.pdf",
      event_date: "8/29/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/21/2025",
      status: "REJECTED",
      priority: "Low",
    },
    {
      id: 3,
      society_name: "Rapidsociety",
      file_name: "CSCO3A3 (1).pdf",
      event_date: "8/30/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/4/2025",
      status: "ACCEPTED",
      priority: "Low",
    },
    {
      id: 4,
      society_name: "Rapidsociety",
      file_name: "proc00 design (1) (2).pdf",
      event_date: "8/31/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/16/2025",
      status: "ACCEPTED",
      priority: "Low",
    },
    {
      id: 5,
      society_name: "Rapidsociety",
      file_name: "ACSSE_CSC3B_2025_P03.pdf",
      event_date: "8/31/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/12/2025",
      status: "ACCEPTED",
      priority: "Low",
    },
    {
      id: 6,
      society_name: "Rapidsociety",
      file_name: "Practical_3 design.pdf",
      event_date: "8/31/2025",
      time_status: "OVERDUE",
      uploaded_at: "8/12/2025",
      status: "ACCEPTED",
      priority: "Low",
    },
    {
      id: 7,
      society_name: "Rapidsociety",
      file_name: "CSCO3A3 (1) (1).pdf",
      event_date: "9/11/2025",
      time_status: "TOMORROW",
      uploaded_at: "9/9/2025",
      status: "PENDING",
      priority: "Low",
    },
    {
      id: 8,
      society_name: "Nation",
      file_name: "event_proposal_100_175737128.pdf",
      event_date: "9/16/2025",
      time_status: "6 DAYS LEFT",
      uploaded_at: "9/9/2025",
      status: "PENDING",
      priority: "Low",
    },
    {
      id: 9,
      society_name: "Nation",
      file_name: "event_proposal_100_175737210.pdf",
      event_date: "9/16/2025",
      time_status: "6 DAYS LEFT",
      uploaded_at: "9/9/2025",
      status: "PENDING",
      priority: "Low",
    },
  ];

  const displayFiles = sortedFiles.length > 0 ? sortedFiles : sampleFiles;
  const displayGroupedFiles = groupFilesByStatus(displayFiles);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box className="page-container">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Files Sent to You
          </Typography>
        </Box>

        {/* Simple, Clean Table */}
        {displayFiles.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No files received yet.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            {/* Table Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.8fr 0.9fr 1.1fr 0.9fr 0.9fr 1fr 1fr 1fr",
                gap: 1,
                padding: "12px 16px",
                backgroundColor: "#f8f9fa",
                fontWeight: "bold",
                borderBottom: "2px solid #dee2e6",
                minWidth: "1100px",
              }}
            >
              <Box>Society</Box>
              <Box>File Name</Box>
              <Box sx={{ textAlign: "center" }}>Event Date</Box>
              <Box sx={{ textAlign: "center" }}>Time Status</Box>
              <Box sx={{ textAlign: "center" }}>Uploaded At</Box>
              <Box sx={{ textAlign: "center" }}>Status</Box>
              <Box sx={{ textAlign: "center" }}>Download</Box>
              <Box sx={{ textAlign: "center" }}>Response</Box>
              <Box sx={{ textAlign: "center" }}>Info</Box>
            </Box>

            {/* Table Rows */}
            {displayFiles.map((file) => (
              <Box
                key={file.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.8fr 0.9fr 1.1fr 0.9fr 0.9fr 1fr 1fr 1fr",
                  gap: 1,
                  padding: "12px 16px",
                  alignItems: "center",
                  borderBottom: "1px solid #e9ecef",
                  minWidth: "1100px",
                  "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                {/* Society */}
                <Box sx={{ fontWeight: "600", fontSize: "0.95rem" }}>
                  {file.society_name || "Unknown Society"}
                </Box>

                {/* File Name with Tooltip for full text */}
                <Box sx={{ fontSize: "0.95rem" }}>
                  <Tooltip title={file.file_name || "—"} arrow>
                    <Box
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "200px",
                      }}
                    >
                      {file.file_name || "—"}
                    </Box>
                  </Tooltip>
                </Box>

                {/* Event Date */}
                <Box sx={{ textAlign: "center", fontWeight: "600", fontSize: "0.9rem" }}>
                  {formatDateOnly(file.event_date)}
                </Box>

                {/* Time Status */}
                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label={file.time_status || "—"}
                    color={getTimeStatusColor(file.time_status, file.is_overdue)}
                    size="small"
                    sx={{
                      fontWeight: "600",
                      fontSize: "0.75rem",
                      minWidth: "90px",
                    }}
                  />
                </Box>

                {/* Uploaded At - Date only, no time */}
                <Box sx={{ textAlign: "center", fontSize: "0.9rem" }}>
                  {formatDateOnly(file.uploaded_at)}
                </Box>

                {/* Status */}
                <Box sx={{ textAlign: "center" }}>
                  <Chip
                    label={file.status || "PENDING"}
                    color={
                      file.status === "ACCEPTED" || file.status === "accepted"
                        ? "success"
                        : file.status === "rejected" || file.status === "REJECTED"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                    sx={{
                      fontWeight: "700",
                      fontSize: "0.75rem",
                      minWidth: "85px",
                    }}
                  />
                </Box>

                {/* Download Button - Individual file download */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleDownload(file.id, file.file_name)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 1.5,
                      py: 0.7,
                      borderWidth: "1.5px",
                      borderColor: "#2e7d32",
                      color: "#2e7d32",
                      "&:hover": {
                        backgroundColor: "rgba(46, 125, 50, 0.04)",
                        borderWidth: "1.5px",
                        borderColor: "#1b5e20",
                        color: "#1b5e20",
                      },
                    }}
                  >
                    Download
                  </Button>
                </Box>

                {/* Response Button - White text on blue background */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => sendResponse(file.id)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 1.5,
                      py: 0.7,
                      backgroundColor: "#1976d2",
                      color: "white !important",
                      "&:hover": {
                        backgroundColor: "#1565c0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      },
                    }}
                  >
                    Respond
                  </Button>
                </Box>

                {/* Info Button - Improved visibility */}
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => moreInfo(file.id)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      textTransform: "none",
                      fontSize: "0.75rem",
                      px: 2,
                      py: 0.7,
                      borderWidth: "1.5px",
                      borderColor: "#1976d2",
                      color: "#1976d2",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                        borderWidth: "1.5px",
                        borderColor: "#1565c0",
                        color: "#1565c0",
                      },
                    }}
                  >
                    Info
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* File Summary without Download Options */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.03),
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="600"
            color="primary.main"
            gutterBottom
            sx={{ mb: 3, textAlign: "center" }}
          >
            Files Summary
          </Typography>

          <Grid container spacing={3}>
            {/* Total Files Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: "center", height: "100%" }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="700" color="primary.main">
                    {displayFiles.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Total Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Accepted Files Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: "center", height: "100%" }}>
                <CardContent>
                  <AcceptedIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="success.main">
                    {displayGroupedFiles.ACCEPTED.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Accepted Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Files Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: "center", height: "100%" }}>
                <CardContent>
                  <PendingIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="warning.main">
                    {displayGroupedFiles.PENDING.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Pending Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Rejected Files Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: "center", height: "100%" }}>
                <CardContent>
                  <RejectedIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="error.main">
                    {displayGroupedFiles.REJECTED.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Rejected Files
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Overdue Files Warning */}
          {displayGroupedFiles.overdue.length > 0 && (
            <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
              <Typography fontWeight="600">
                {displayGroupedFiles.overdue.length} file(s) are OVERDUE and require immediate
                attention
              </Typography>
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default ReceivedFiles;
