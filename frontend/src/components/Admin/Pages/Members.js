import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
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
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ maxHeight: 600, overflowX: "auto" }}
          >
            <Table
              stickyHeader
              sx={{
                tableLayout: "fixed",
                width: "100%",
                borderCollapse: "collapse",
                "& th, & td": { padding: "8px", border: "1px solid #ddd" }, // unify padding & border
              }}
            >
              <TableHead>
                <TableRow>
                  {["Name", "Email", "Status", "Joined At", "Actions"].map((title, index) => (
                    <TableCell
                      key={index}
                      align={index > 1 ? "center" : "left"}
                      sx={{
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                        minWidth:
                          index === 0
                            ? 200
                            : index === 1
                            ? 250
                            : index === 2
                            ? 120
                            : index === 3
                            ? 180
                            : 200,
                        backgroundColor: "action.hover",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.member_id} hover>
                    <TableCell>
                      <Tooltip title={`${member.first_name} ${member.last_name}`} arrow>
                        <span>
                          {member.first_name} {member.last_name}
                        </span>
                      </Tooltip>
                    </TableCell>

                    <TableCell>
                      <Tooltip title={member.email} arrow>
                        <span>{member.email}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center">
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
                        sx={{
                          textTransform: "capitalize",
                          fontWeight: "bold",
                          minWidth: 90,
                          fontSize: "0.8rem",
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      {new Date(member.joined_at).toLocaleString()}
                    </TableCell>

                    <TableCell align="center">
                      {member.status === "pending" ? (
                        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => updateMemberStatus(member.member_id, "approve")}
                            sx={{
                              fontWeight: "bold",
                              textTransform: "capitalize",
                              fontSize: "0.8rem",
                              py: 0.5,
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => updateMemberStatus(member.member_id, "reject")}
                            sx={{
                              fontWeight: "bold",
                              textTransform: "capitalize",
                              fontSize: "0.8rem",
                              py: 0.5,
                              color: "#d32f2f",
                              borderColor: "#d32f2f",
                              "&:hover": { backgroundColor: "#ffebee", borderColor: "#d32f2f" },
                            }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      ) : (
                        <Typography
                          color={member.status === "approved" ? "success.main" : "error.main"}
                          fontWeight="bold"
                          fontSize="0.85rem"
                        >
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
