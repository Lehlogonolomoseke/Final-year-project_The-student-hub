import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const SPAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data from API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/spAnalytics.php", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch analytics");
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
        // Set fallback data for development if an error occurs
        setAnalyticsData({
          uploads: {
            total: 45,
            accepted: 32,
            rejected: 8,
            pending: 5,
            byStatus: [
              { name: "Accepted", value: 32, color: "#4caf50" },
              { name: "Pending", value: 5, color: "#ff9800" },
              { name: "Rejected", value: 8, color: "#f44336" },
            ],
          },
          societies: {
            total: 12,
            totalMembers: 177,
            topSocieties: [
              { name: "Computer Science Society", members: 45, society_id: 1 },
              { name: "Drama Club", members: 38, society_id: 2 },
              { name: "Environmental Society", members: 29, society_id: 3 },
              { name: "Photography Club", members: 25, society_id: 4 },
              { name: "Debate Society", members: 22, society_id: 5 },
              { name: "Music Club", members: 18, society_id: 6 },
            ],
          },
          events: {
            total: 28,
            public: 18,
            private: 10,
            byType: [
              { name: "Public Events", value: 18, color: "#1976d2" },
              { name: "Private Events", value: 10, color: "#9c27b0" },
            ],
            monthlyEvents: [
              { month: "Apr", events: 8 },
              { month: "May", events: 12 },
              { month: "Jun", events: 15 },
              { month: "Jul", events: 10 },
              { month: "Aug", events: 6 },
            ],
          },
          budgets: {
            totalBudget: 45750.5,
            totalBudgetEntries: 23,
            uploadsWithBudget: 18,
            averageBudget: 2540.58,
            topBudgets: [
              {
                budgetName: "Annual Tech Conference",
                amount: 8500.0,
                fileName: "tech-conf-proposal.pdf",
                eventDate: "2025-09-15",
                comments: "Major event requiring substantial funding",
              },
              {
                budgetName: "Drama Production",
                amount: 6200.0,
                fileName: "drama-budget.xlsx",
                eventDate: "2025-08-30",
                comments: "Costume and set design costs",
              },
              {
                budgetName: "Photography Exhibition",
                amount: 3400.0,
                fileName: "photo-exhibit.pdf",
                eventDate: "2025-09-10",
                comments: "Gallery rental and printing",
              },
            ],
            monthlyBudgets: [
              { month: "Apr 2025", totalBudget: 12500.0, budgetCount: 4 },
              { month: "May 2025", totalBudget: 15200.5, budgetCount: 6 },
              { month: "Jun 2025", totalBudget: 8750.0, budgetCount: 3 },
              { month: "Jul 2025", totalBudget: 9300.0, budgetCount: 5 },
              { month: "Aug 2025", totalBudget: 0.0, budgetCount: 5 },
            ],
          },
          recentUploads: [
            {
              id: 1,
              fileName: "event-poster.pdf",
              uploadedBy: "John Doe",
              eventDate: "2025-08-20",
              status: "pending",
              daysUntil: 9,
              totalBudget: 1500.0,
            },
            {
              id: 2,
              fileName: "budget-proposal.xlsx",
              uploadedBy: "Jane Smith",
              eventDate: "2025-08-25",
              status: "approved",
              daysUntil: 14,
              totalBudget: 2750.0,
            },
            {
              id: 3,
              fileName: "marketing-flyer.png",
              uploadedBy: "Mike Johnson",
              eventDate: "2025-08-18",
              status: "rejected",
              daysUntil: 7,
              totalBudget: 0.0,
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Helper to get MUI styled badge for status
  const getStatusBadge = (status) => {
    const config = {
      accepted: {
        bgcolor: "#e8f5e9",
        color: "#2e7d32",
        label: "Accepted",
      },
      approved: {
        bgcolor: "#e8f5e9",
        color: "#2e7d32",
        label: "Approved",
      },
      rejected: {
        bgcolor: "#ffebee",
        color: "#d32f2f",
        label: "Rejected",
      },
      pending: {
        bgcolor: "#fff3e0",
        color: "#ed6c02",
        label: "Pending",
      },
    };

    const statusConfig = config[status] || {
      bgcolor: "#e0e0e0",
      color: "#616161",
      label: status,
    };

    return (
      <Chip
        label={statusConfig.label}
        size="small"
        sx={{
          bgcolor: statusConfig.bgcolor,
          color: statusConfig.color,
          fontWeight: "medium",
        }}
      />
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ ml: 2, color: "text.secondary" }}>
          Loading analytics...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: "background.default" }}>
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          <Typography variant="h6">Error Loading Analytics</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, color: "error.dark" }}>
            Showing fallback data for demonstration
          </Typography>
        </Alert>
        {analyticsData && renderDashboardContent(analyticsData, getStatusBadge, formatCurrency)}
      </Box>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          minHeight: "100vh",
          bgcolor: "background.default",
          textAlign: "center",
          py: 6,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No analytics data available
        </Typography>
      </Box>
    );
  }

  return renderDashboardContent(analyticsData, getStatusBadge, formatCurrency);
};

// Extracted function to render the actual dashboard content
const renderDashboardContent = (analyticsData, getStatusBadge, formatCurrency) => (
  <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "background.default", minHeight: "100vh" }}>
    {/* Heading */}
    <Typography variant="h4" fontWeight="bold" gutterBottom>
      Welcome, SP Coordinator
    </Typography>

    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      Overview of platform-wide statistics, analytics, and administrative tasks.
    </Typography>

    {/* Summary cards */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Total Uploads</Typography>
            <Typography variant="h3" color="primary">
              {analyticsData.uploads.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files submitted for review
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Total Societies</Typography>
            <Typography variant="h3" color="secondary">
              {analyticsData.societies.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analyticsData.societies.totalMembers} total members
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Total Events</Typography>
            <Typography variant="h3" sx={{ color: "success.main" }}>
              {analyticsData.events.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scheduled events
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Total Budget</Typography>
            <Typography variant="h3" sx={{ color: "warning.main" }}>
              {formatCurrency(analyticsData.budgets.totalBudget)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {analyticsData.budgets.totalBudgetEntries} budget entries
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Pending Reviews</Typography>
            <Typography variant="h3" sx={{ color: "error.main" }}>
              {analyticsData.uploads.pending}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Awaiting your approval
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6">Average Budget</Typography>
            <Typography variant="h3" sx={{ color: "info.main" }}>
              {formatCurrency(analyticsData.budgets.averageBudget)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per approved event
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Charts Section */}
    <Grid container spacing={3} sx={{ mt: 4 }}>
      {/* Upload Status Distribution */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.uploads.byStatus}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analyticsData.uploads.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Public vs Private Events */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Public vs Private Events
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.events.byType}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analyticsData.events.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Budget Trends */}
      <Grid item xs={12} md={8}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Budget Trends
            </Typography>
            {analyticsData.budgets.monthlyBudgets.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.budgets.monthlyBudgets}>
                  <defs>
                    <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ff9800" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />

                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="totalBudget"
                    stroke="#ff9800"
                    fillOpacity={1}
                    fill="url(#budgetGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography>No budget trend data available</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Budget Statistics */}
      <Grid item xs={12} md={4}>
        <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Budget Statistics
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Budget Allocated
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {formatCurrency(analyticsData.budgets.totalBudget)}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Budget Entries
                </Typography>
                <Typography variant="h5" color="primary.main">
                  {analyticsData.budgets.totalBudgetEntries}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Approved budget entries
                </Typography>
                <Typography variant="h5" color="secondary.main">
                  {analyticsData.budgets.uploadsWithBudget}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Average per Event
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(analyticsData.budgets.averageBudget)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Society Membership Ranking */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Society Membership Ranking
            </Typography>
            {analyticsData.societies.topSocieties.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData.societies.topSocieties}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="members" fill="#9c27b0" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 250,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography>No society data available</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Event Trends */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Event Trends
            </Typography>
            {analyticsData.events.monthlyEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.events.monthlyEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="events" stroke="#1976d2" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box
                sx={{
                  height: 250,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                <Typography>No event trend data available</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Top Budget Allocations */}
    <Box sx={{ mt: 5 }}>
      <Typography variant="h6" gutterBottom fontWeight="600">
        Top Budget Allocations
      </Typography>

      {analyticsData.budgets.topBudgets.length > 0 ? (
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr",
              gap: 1,
              padding: "12px 16px",
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: "bold",
              borderBottom: "2px solid #dee2e6",
            }}
          >
            <Box>Budget Name</Box>
            <Box sx={{ textAlign: "right" }}>Amount</Box>
            <Box sx={{ textAlign: "center" }}>Event Date</Box>
            <Box>Comments</Box>
          </Box>

          {/* Table Rows */}
          {analyticsData.budgets.topBudgets.map((budget, index) => (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr",
                gap: 1,
                padding: "12px 16px",
                alignItems: "center",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: index % 2 === 0 ? "white" : "grey.50",
                "&:hover": { backgroundColor: "action.hover" },
                "&:last-child": { borderBottom: "none" },
              }}
            >
              {/* Budget Name */}
              <Box sx={{ fontWeight: "500", fontSize: "0.95rem" }}>
                {budget.budgetName || "Unnamed Budget"}
              </Box>

              {/* Amount - Right aligned */}
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" color="warning.main" fontWeight="600">
                  {formatCurrency(budget.amount)}
                </Typography>
              </Box>

              {/* Event Date - Center aligned */}
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2">
                  {budget.eventDate ? new Date(budget.eventDate).toLocaleDateString() : "N/A"}
                </Typography>
              </Box>

              {/* Comments */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: budget.comments ? "normal" : "italic",
                    color: budget.comments ? "text.primary" : "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {budget.comments || "No comments"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: "center",
            color: "text.secondary",
            backgroundColor: "grey.50",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2">No budget data found</Typography>
        </Paper>
      )}
    </Box>

    {/* Recent Uploads Table */}
    {/*  <Box sx={{ mt: 5 }}>
      <Typography variant="h6" gutterBottom>
        Recent Upload Submissions
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        {analyticsData.recentUploads.length > 0 ? (
          <Table size="small">
            <TableHead sx={{ bgcolor: "grey.100" }}>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Uploaded By</TableCell>
                <TableCell>Event Date</TableCell>
                <TableCell>Days Until Event</TableCell>
                <TableCell>Total Budget</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analyticsData.recentUploads.map((upload) => (
                <TableRow key={upload.id} hover>
                  <TableCell>{upload.fileName}</TableCell>
                  <TableCell>{upload.uploadedBy}</TableCell>
                  <TableCell>{upload.eventDate || "N/A"}</TableCell>
                  <TableCell>{upload.daysUntil} days</TableCell>
                  <TableCell>
                    <Typography variant="body2" color={upload.totalBudget > 0 ? "success.main" : "text.secondary"}>
                      {upload.totalBudget > 0 ? formatCurrency(upload.totalBudget) : "No budget"}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusBadge(upload.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            <Typography>No recent uploads found</Typography>
          </Box>
        )}
      </TableContainer>
    </Box>*/}

    {/* Society Rankings */}
    <Box sx={{ mt: 5 }}>
      <Typography variant="h6" gutterBottom>
        Society Membership Rankings
      </Typography>
      {analyticsData.societies.topSocieties.length > 0 ? (
        <Grid container spacing={2}>
          {analyticsData.societies.topSocieties.slice(0, 6).map((society, index) => (
            <Grid item xs={12} md={6} key={society.society_id}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 2,
                  bgcolor: index === 0 ? "#fff3e0" : "#ede7f6",
                  border: `1px solid ${index === 0 ? "#ffb74d" : "#ce93d8"}`,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="h6">{society.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rank #{index + 1}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h4" sx={{ color: "secondary.main" }}>
                        {society.members}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        members
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card
          elevation={3}
          sx={{ p: 3, textAlign: "center", color: "text.secondary", borderRadius: 2 }}
        >
          <Typography>No society data available</Typography>
        </Card>
      )}
    </Box>
  </Box>
);

export default SPAnalyticsDashboard;
