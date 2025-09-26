import React from "react";
import { NavLink } from "react-router-dom";
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import UpdateIcon from "@mui/icons-material/Update";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SchoolIcon from "@mui/icons-material/School";

const sections = [
  {
    path: "/admin/send-file",
    label: "Events Calendar",
    icon: <EventIcon fontSize="large" color="primary" />,
  },
  {
    path: "/admin/create-event",
    label: "Create Event",
    icon: <AddCircleOutlineIcon fontSize="large" color="secondary" />,
  },
  {
    path: "/admin/upcoming-events",
    label: "Upcoming Events",
    icon: <UpdateIcon fontSize="large" color="success" />,
  },
  {
    path: "/admin/event-creation",
    label: "Event Proposals",
    icon: <AssignmentIcon fontSize="large" color="warning" />,
  },
  {
    path: "/admin/admin-event",
    label: "Admin Events",
    icon: <AdminPanelSettingsIcon fontSize="large" color="error" />,
  },
  {
    path: "/admin/events",
    label: "Student Events",
    icon: <SchoolIcon fontSize="large" color="info" />,
  },
];

const EventsHub = () => {
  return (
    <Box sx={{ padding: 4, backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      {/* Page Heading */}
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Events Hub
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage and track all events in one place.
      </Typography>

      {/* Cards Grid */}
      <Grid container spacing={3} sx={{ marginTop: 2 }}>
        {sections.map((section) => (
          <Grid item xs={12} sm={6} md={4} key={section.path}>
            <NavLink to={section.path} style={{ textDecoration: "none" }}>
              <Card
                sx={{
                  borderRadius: 3,
                  minHeight: 160,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 3,
                  backgroundColor: "white",
                  color: "text.primary",
                  boxShadow: 2,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ marginBottom: 2 }}>{section.icon}</Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {section.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click to view {section.label.toLowerCase()}.
                  </Typography>
                </CardContent>
              </Card>
            </NavLink>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EventsHub;
