import React from "react";
import { Box, Typography, Card, CardContent, Grid, Paper, Chip } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  summaryStats,
  userRegistrationData,
  approvalRatio,
  adminReports,
  adminNotices,
  upcomingAdminEvents,
} from "./AdminDummy";

const COLORS = ["#4caf50", "#ff9800", "#f44336"]; // Approved, Pending, Rejected

const AdminDashboard = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Heading */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome, Admin
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Overview of platform-wide statistics, analytics, and administrative tasks.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        {summaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="h3" color="primary" sx={{ mt: 1, mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly User Registrations
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userRegistrationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#1976d2" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approval Status Ratio
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={approvalRatio}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {approvalRatio.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="#fff" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Reports Table */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        <Paper elevation={3} sx={{ overflowX: "auto", borderRadius: 2 }}>
          {/* Header Row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "25% 25% 25% 25%" },
              backgroundColor: "grey.100",
              fontWeight: "bold",
              p: 1.5,
              borderBottom: "2px solid #ccc",
              gap: 1,
            }}
          >
            <Box>Reporter</Box>
            <Box>Type</Box>
            <Box>Date</Box>
            <Box>Status</Box>
          </Box>

          {/* Data Rows */}
          {adminReports.map((report, idx) => (
            <Box
              key={report.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "25% 25% 25% 25%" },
                p: 1.5,
                borderBottom: "1px solid #eee",
                backgroundColor: idx % 2 === 0 ? "white" : "grey.50",
                alignItems: "center",
                gap: 1,
                "&:hover": { backgroundColor: "grey.100" },
              }}
            >
              <Box>{report.reporter}</Box>
              <Box>{report.type}</Box>
              <Box>{report.date}</Box>
              <Box>{report.status}</Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Notice Board */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Notice Board
        </Typography>
        <Grid container spacing={2}>
          {adminNotices.map((notice) => (
            <Grid item xs={12} md={6} key={notice.id}>
              <Card
                variant="outlined"
                sx={{
                  backgroundColor: "#f1f8e9",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {notice.date}
                  </Typography>
                  <Typography variant="h6">{notice.title}</Typography>
                  <Typography variant="body2">{notice.message}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Upcoming Events Table */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Admin Events
        </Typography>
        <Paper elevation={3} sx={{ overflowX: "auto", borderRadius: 2 }}>
          {/* Header Row */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "40% 30% 30%" },
              backgroundColor: "grey.100",
              fontWeight: "bold",
              p: 1.5,
              borderBottom: "2px solid #ccc",
              gap: 1,
            }}
          >
            <Box>Event</Box>
            <Box>Date</Box>
            <Box>Location</Box>
          </Box>

          {/* Data Rows */}
          {upcomingAdminEvents.map((event, idx) => (
            <Box
              key={event.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "40% 30% 30%" },
                p: 1.5,
                borderBottom: "1px solid #eee",
                backgroundColor: idx % 2 === 0 ? "white" : "grey.50",
                alignItems: "center",
                gap: 1,
                "&:hover": { backgroundColor: "grey.100" },
              }}
            >
              <Box>{event.event}</Box>
              <Box>{event.date}</Box>
              <Box>{event.location}</Box>
            </Box>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
