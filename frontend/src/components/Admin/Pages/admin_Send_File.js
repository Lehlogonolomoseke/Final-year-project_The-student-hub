import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import { createViewDay, createViewWeek, createViewMonthGrid } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css";

function AdminSendFile() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    plugins: [createEventsServicePlugin()],
    events: [],
    defaultView: "week",
    locale: "en-US",
    firstDayOfWeek: 0,
  });

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await axios.get("http://localhost:8000/calender-events.php", {
          withCredentials: true,
        });

        if (res.data.success && res.data.events) {
          const formattedEvents = res.data.events.map((event) => ({
            id: event.event_id,
            title: `${event.name} (${event.society_name})`,
            start: event.start_date,
            end: event.end_date,
          }));
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    if (calendar && events.length > 0) {
      const service = calendar.eventsService;
      if (service) {
        service.set(events);
      }
    }
  }, [events, calendar]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Event Calendar</h1>
      </div>

      <Paper elevation={2} sx={{ p: 2, borderRadius: "8px" }}>
        <ScheduleXCalendar calendarApp={calendar} />
      </Paper>
    </div>
  );
}

export default AdminSendFile;
