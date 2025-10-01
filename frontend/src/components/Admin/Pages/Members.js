import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Grid,
  Tooltip,
} from "@mui/material";

function ManageMembersPage() {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [societyId, setSocietyId] = useState(null);

  useEffect(() => {
    const fetchSocietyId = async () => {
      try {
        const res = await fetch("http://localhost:8000/get-user-society.php", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to get society ID");
        setSocietyId(data.society_id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchSocietyId();
  }, []);

  useEffect(() => {
    if (!societyId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/Member-Management.php?society_id=${societyId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "Failed to fetch members");
        setMembers(data.members);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [societyId]);

  const updateMemberStatus = async (memberId, action) => {
    try {
      const res = await fetch("http://localhost:8000/Member-Management.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ member_id: memberId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) =>
          prev.map((m) =>
            m.member_id === memberId
              ? { ...m, status: action === "approve" ? "approved" : "rejected" }
              : m
          )
        );
      } else {
        setError(data.message || `Failed to ${action} member`);
      }
    } catch (err) {
      setError(`Error ${action}ing member`);
    }
  };

  const summary = useMemo(() => {
    const approved = members.filter((m) => m.status === "approved").length;
    const pending = members.filter((m) => m.status === "pending").length;
    const rejected = members.filter((m) => m.status === "rejected").length;
    return { approved, pending, rejected };
  }, [members]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 6, mt: 8 }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Society Member Management
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        As an admin, you can approve or reject membership requests, monitor member status, and
        ensure all members are properly managed within your society.
      </Typography>

      {societyId && (
        <Typography variant="subtitle1" mb={3}>
          Managing members for society ID: <strong>{societyId}</strong>
        </Typography>
      )}

      {members.length === 0 ? (
        <Typography variant="body1">No members or requests found.</Typography>
      ) : (
        <>
          <Paper elevation={3} sx={{ overflowX: "auto" }}>
            {/* Header Row */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "25% 30% 15% 15% 15%" },
                backgroundColor: "grey.100",
                fontWeight: "bold",
                p: 1.5,
                gap: 1,
                alignItems: "center",
                borderBottom: "2px solid #ccc",
              }}
            >
              <Box>Name</Box>
              <Box>Email</Box>
              <Box>Status</Box>
              <Box>Joined At</Box>
              <Box textAlign="center">Actions</Box>
            </Box>

            {/* Data Rows */}
            {members.map((member, idx) => (
              <Box
                key={member.member_id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "25% 30% 15% 15% 15%" },
                  p: 1.5,
                  borderBottom: "1px solid #eee",
                  backgroundColor: idx % 2 === 0 ? "white" : "grey.50",
                  alignItems: "center",
                  gap: 1,
                  transition: "background 0.2s",
                  "&:hover": {
                    backgroundColor: "grey.100",
                  },
                }}
              >
                {/* Name */}
                <Box
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {member.first_name} {member.last_name}
                </Box>

                {/* Email */}
                <Tooltip title={member.email} arrow>
                  <Box
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {member.email}
                  </Box>
                </Tooltip>

                {/* Status */}
                <Box>
                  <Chip
                    label={member.status || "Pending"}
                    color={
                      member.status === "approved"
                        ? "success"
                        : member.status === "rejected"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                    sx={{ fontWeight: "bold", textTransform: "capitalize" }}
                  />
                </Box>

                {/* Joined At */}
                <Box>{new Date(member.joined_at).toLocaleDateString()}</Box>

                {/* Actions */}
                <Box textAlign="center">
                  {member.status === "pending" ? (
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        sx={{ minWidth: 90 }}
                        onClick={() => updateMemberStatus(member.member_id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ minWidth: 90 }}
                        onClick={() => updateMemberStatus(member.member_id, "reject")}
                      >
                        Reject
                      </Button>
                    </Stack>
                  ) : (
                    <Typography
                      color={member.status === "approved" ? "success.main" : "error.main"}
                      fontWeight="bold"
                    >
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Summary */}
          <Paper elevation={1} sx={{ mt: 4, p: 2, borderRadius: 1 }}>
            <Typography variant="h6" mb={1}>
              Members Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Chip label={`Approved: ${summary.approved}`} color="success" />
              </Grid>
              <Grid item>
                <Chip label={`Pending: ${summary.pending}`} color="warning" />
              </Grid>
              <Grid item>
                <Chip label={`Rejected: ${summary.rejected}`} color="error" />
              </Grid>
              <Grid item>
                <Chip label={`Total: ${members.length}`} />
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}

export default ManageMembersPage;
