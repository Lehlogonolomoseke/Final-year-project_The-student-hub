import React, { useState, useEffect } from "react";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import { createViewDay, createViewWeek, createViewMonthGrid } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";
import { Container, Paper, Typography, CircularProgress, Alert } from "@mui/material";

const transformDatabaseEvents = (dbEvents) => {
  return dbEvents
    .map((event) => {
      try {
        const startDate = event.start_date.includes(" ")
          ? event.start_date.split(" ")[0]
          : event.start_date;

        return {
          id: event.event_id.toString(),
          title: `${event.name} (${event.society_name})`,
          start: startDate,
          end: startDate,
        };
      } catch (error) {
        console.error("Error transforming event:", event, error);
        return null;
      }
    })
    .filter((event) => event !== null);
};

function CalenderP() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:8000/calender-events.php", {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        const transformedEvents = transformDatabaseEvents(data.events);
        setEvents(transformedEvents);
      } else {
        throw new Error(data.error || "Failed to fetch events");
      }
    } catch (err) {
      setError("Failed to fetch events: " + err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    plugins: [createEventsServicePlugin()],
    events: [],
    defaultView: "week",
    locale: "en-US",
    firstDayOfWeek: 0,
  });

  useEffect(() => {
    if (calendar && events.length > 0) {
      const eventsService = calendar.eventsService;
      if (eventsService) eventsService.set(events);
    }
  }, [events, calendar]);

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: "12px", minHeight: "70vh" }}>
        <Typography
          variant="h4"
          align="center"
          sx={{ mb: 4, fontWeight: "bold", color: "#2b1745" }}
        >
          Events Calendar
        </Typography>

        {loading && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <CircularProgress color="secondary" />
            <Typography variant="body1" sx={{ mt: 1 }}>
              Loading events...
            </Typography>
          </div>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && <ScheduleXCalendar calendarApp={calendar} />}
      </Paper>
    </Container>
  );
}

export default CalenderP;
