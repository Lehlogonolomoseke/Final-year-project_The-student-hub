import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";

function ManageDayhouseMembers() {
  const [members, setMembers] = useState([]);
  const [dayhouse, setDayhouse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayhouseId, setDayhouseId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
  });

  useEffect(() => {
    const fetchDayhouseId = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get-user-dayhouse.php", {
          withCredentials: true,
        });
        const data = response.data;
        if (!data.success) throw new Error(data.error || "Failed to get dayhouse ID");
        setDayhouseId(data.dayhouse_id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchDayhouseId();
  }, []);

  useEffect(() => {
    if (!dayhouseId) return;

    const fetchDayhouseAndMembers = async () => {
      try {
        const dayhouseRes = await axios.get(
          `http://localhost:8000/DayhouseMem.php?action=get_dayhouse&dayhouse_id=${dayhouseId}`,
          { withCredentials: true }
        );
        if (!dayhouseRes.data.success)
          throw new Error(dayhouseRes.data.error || "Failed to get dayhouse");
        setDayhouse(dayhouseRes.data.dayhouse);

        const membersRes = await axios.get(
          `http://localhost:8000/DayhouseMem.php?action=get_members&dayhouse_id=${dayhouseId}`,
          { withCredentials: true }
        );
        if (!membersRes.data.success)
          throw new Error(membersRes.data.error || "Failed to fetch members");
        setMembers(membersRes.data.members);
        calculateStats(membersRes.data.members);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDayhouseAndMembers();
  }, [dayhouseId]);

  const calculateStats = (membersList) => {
    const total = membersList.length;
    const paid = membersList.filter((m) => m.fee_paid === 1).length;
    setStats({ total, paid });
  };

  const markAsPaid = async (memberId) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/DayhouseMem.php",
        { action: "mark_paid", member_id: memberId, fee_paid: 1 },
        { withCredentials: true }
      );

      if (res.data.success) {
        fetchMembers(dayhouseId);
      } else {
        alert(res.data.message || "Failed to update payment status");
      }
    } catch (err) {
      alert("Error updating payment status");
    }
  };

  const fetchMembers = async (id) => {
    if (!id) return;
    try {
      const membersRes = await axios.get(
        `http://localhost:8000/DayhouseMem.php?action=get_members&dayhouse_id=${id}`,
        { withCredentials: true }
      );
      if (membersRes.data.success) {
        setMembers(membersRes.data.members);
        calculateStats(membersRes.data.members);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.user_id?.toString().includes(searchTerm.toLowerCase()) ||
      member.First_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.joined_at?.includes(searchTerm)
  );

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );

  if (!dayhouse)
    return (
      <Container sx={{ mt: 5 }}>
        <Typography>No dayhouse found. Contact admin.</Typography>
      </Container>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Dayhouse Member Management
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Managing: {dayhouse.name}</Typography>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ py: 3, textAlign: "center", backgroundColor: "#e3f2fd" }}>
            <Typography variant="h5" fontWeight="bold">
              {stats.total}
            </Typography>
            <Typography>Total Members</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ py: 3, textAlign: "center", backgroundColor: "#e8f5e9" }}>
            <Typography variant="h5" fontWeight="bold">
              {stats.paid}
            </Typography>
            <Typography>Paid Members</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ borderRadius: 2 }}
        />
      </Box>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <Typography align="center" sx={{ mt: 5 }}>
          No members found.
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ overflowX: "auto", borderRadius: 2 }}>
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "10% 25% 25% 15% 15% 10%" },
              backgroundColor: "grey.100",
              fontWeight: "bold",
              p: 1.5,
              borderBottom: "2px solid #ccc",
              gap: 1,
            }}
          >
            <Box>ID</Box>
            <Box>Name</Box>
            <Box>Email</Box>
            <Box>Joined</Box>
            <Box>Status</Box>
            <Box textAlign="center">Actions</Box>
          </Box>

          {/* Data Rows */}
          {filteredMembers.map((member, idx) => (
            <Box
              key={member.id || member.user_id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "10% 25% 25% 15% 15% 10%" },
                p: 1.5,
                borderBottom: "1px solid #eee",
                backgroundColor: idx % 2 === 0 ? "white" : "grey.50",
                alignItems: "center",
                gap: 1,
                "&:hover": { backgroundColor: "grey.100" },
              }}
            >
              <Box>{member.id || member.user_id}</Box>
              <Box>
                {member.First_Name} {member.last_Name}
              </Box>
              <Box>{member.Email}</Box>
              <Box>{new Date(member.joined_at).toLocaleDateString()}</Box>
              <Box>
                {member.fee_paid === 1 ? (
                  <Chip label="PAID" color="success" size="small" sx={{ fontWeight: "bold" }} />
                ) : (
                  <Chip label="PENDING" color="warning" size="small" sx={{ fontWeight: "bold" }} />
                )}
              </Box>
              <Box textAlign="center">
                {member.fee_paid === 0 && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => markAsPaid(member.id || member.user_id)}
                  >
                    Mark Paid
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
}

export default ManageDayhouseMembers;
