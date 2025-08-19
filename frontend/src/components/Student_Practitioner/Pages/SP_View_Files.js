import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  CircularProgress,
  Alert,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

function ReceivedFiles() {
  const navigate = useNavigate();
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 8 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading files...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" variant="filled">
          Error: {error}
        </Alert>
      </Container>
    );

  const sortedFiles = sortFiles(files);

  return (
    <Container maxWidth="lg" sx={{ mt: 10, pb: 8 }}>
      <Box className="page-container">
        {/* Header and Sorting */}
        <Box
          className="page-header"
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}
        >
          <Typography variant="h4" fontWeight="bold">
            Files Sent to You
          </Typography>

          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={handleSort}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                fontWeight: "bold",
                fontSize: 14,
                color: "primary.main",
                textTransform: "capitalize",
                borderRadius: 2,
                px: 2,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "#fff",
                  "&:hover": { backgroundColor: "primary.dark" },
                },
              },
            }}
          >
            {["priority", "date", "society"].map((f) => (
              <ToggleButton key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {sortBy === f && (sortOrder === "asc" ? " ↑" : " ↓")}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Table */}
        {sortedFiles.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
            No files received yet.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{
              overflowX: "auto",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                right: 0,
                width: 20,
                height: "100%",
                pointerEvents: "none",
                background: "linear-gradient(to left, rgba(255,255,255,0.6), rgba(255,255,255,0))",
              },
            }}
          >
            <Table stickyHeader sx={{ tableLayout: "fixed", minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  {[
                    "Priority",
                    "Society",
                    "File Name",
                    "Event Date",
                    "Time Status",
                    "Uploaded At",
                    "Download",
                    "Status",
                    "Send Response",
                    "More Info",
                  ].map((h) => (
                    <TableCell key={h} align="center">
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFiles.map((file) => (
                  <TableRow key={file.id} sx={{ "&:hover": { bgcolor: "action.selected" } }}>
                    <TableCell align="center">
                      <Tooltip title={file.priority || "Low"}>
                        <Chip
                          label={file.priority || "Low"}
                          color={getPriorityColor(file.priority)}
                          size="small"
                          sx={{
                            fontWeight: "bold",
                            textTransform: "capitalize",
                            maxWidth: 120,
                            whiteSpace: "normal",
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title={file.society_name || "Unknown Society"}>
                        <Typography fontWeight="bold" noWrap sx={{ maxWidth: 150 }}>
                          {file.society_name || "Unknown Society"}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title={file.file_name || "—"}>
                        <Typography noWrap sx={{ maxWidth: 200 }}>
                          {file.file_name}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip
                        title={
                          file.event_date ? new Date(file.event_date).toLocaleDateString() : "—"
                        }
                      >
                        <Typography fontWeight="bold" noWrap sx={{ maxWidth: 120 }}>
                          {file.event_date ? new Date(file.event_date).toLocaleDateString() : "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title={file.time_status || "—"}>
                        <Chip
                          label={file.time_status || "—"}
                          color={getTimeStatusColor(file.time_status, file.is_overdue)}
                          size="small"
                          sx={{
                            fontWeight: "bold",
                            textTransform: "capitalize",
                            maxWidth: 120,
                            whiteSpace: "normal",
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip
                        title={file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "—"}
                      >
                        <Typography noWrap sx={{ maxWidth: 180 }}>
                          {file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => handleDownload(file.id, file.file_name)}
                      >
                        Download
                      </Button>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title={file.status || "Pending"}>
                        <Chip
                          label={file.status || "Pending"}
                          color={
                            file.status === "accepted"
                              ? "success"
                              : file.status === "rejected"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: "bold",
                            maxWidth: 120,
                            whiteSpace: "normal",
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 140 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => sendResponse(file.id)}
                        fullWidth
                        sx={{
                          whiteSpace: "normal",
                          py: 1,
                          textTransform: "capitalize",
                          fontWeight: "bold",
                          color: "#fff",
                        }}
                      >
                        Respond
                      </Button>
                    </TableCell>

                    <TableCell align="center" sx={{ minWidth: 140 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => moreInfo(file.id)}
                        fullWidth
                        sx={{
                          whiteSpace: "normal",
                          py: 1,
                          textTransform: "capitalize",
                          fontWeight: "bold",
                          color: "#1976d2",
                          borderColor: "#1976d2",
                          "&:hover": {
                            backgroundColor: "#1976d2",
                            color: "#fff",
                          },
                        }}
                      >
                        Info
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Summary */}
        <Paper elevation={1} sx={{ mt: 4, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
          <Typography variant="h6" mb={1}>
            Files Summary
          </Typography>
          <Typography>
            <strong>Total Files:</strong> {files.length}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default ReceivedFiles;
