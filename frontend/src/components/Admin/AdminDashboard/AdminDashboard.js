import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
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

      {/* Summary cards */}
      <Grid container spacing={3}>
        {summaryStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">{stat.title}</Typography>
                <Typography variant="h3" color="primary">
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
          <Card>
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approval Status Ratio
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={approvalRatio} dataKey="value" nameKey="name" outerRadius={80} label>
                    {approvalRatio.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reports Table */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reporter</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {adminReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.reporter}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>{report.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Notice Board */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Notice Board
        </Typography>
        <Grid container spacing={2}>
          {adminNotices.map((notice) => (
            <Grid item xs={12} md={6} key={notice.id}>
              <Card variant="outlined" sx={{ backgroundColor: "#f1f8e9" }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
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

      {/* Upcoming Events */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Admin Events
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingAdminEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.event}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
