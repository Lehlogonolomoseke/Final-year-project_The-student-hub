import "./index.css";

import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// MUI
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Core
import MDBox from "components/MDBox";

// Pages
import Login from "components/Login";
import ErrorPage from "components/error/ErrorPage";
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute";

// Themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL support
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Route Config
import routes from "routes";
import PropTypes from "prop-types";

// Context
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";

// Logos
import brandWhite from "assets/images/logo-ct.png";
import brandDark from "assets/images/logo-ct-dark.png";

// Student Pages
import BrowseCommunities from "./components/Student/Communities/BrowseCommunity";
import StudentHome from "./components/Student/StudentHome/StudentHome";
import Dayhouses from "./components/Student/Communities/Dayhouses";
import JoinDayhouse from "components/Student/Communities/JoinDayhouse";
import SocietyPage from "components/Student/Communities/SocietyPage";
import JoinSocieties from "components/Student/Communities/JoinSociety";
import Register from "components/Student/Register";
import AttendancePage from "components/Student/Communities/Attendance";
import UserProfile from "components/Student/Communities/Profile";

import AdminLayout from "components/Admin/AdminLayout/AdminLayout";
import AdminSendFile from "components/Admin/Pages/admin_Send_File";

import CreateEvent from "components/Admin/Pages/Create_Event";
import Create_profile from "components/Admin/Pages/Create_Profile";
import ManageMembersPage from "components/Admin/Pages/Members";
import CreateDayhouseProfile from "components/Admin/Pages/Dayhouse_profile";
import ManageDayhouseMembers from "components/Admin/Pages/DayhouseMembers";
import UpcomingEvents from "components/Admin/Pages/Upcoming_Events";
import AdminDashboard from "components/Admin/AdminDashboard/AdminDashboard";
import Events from "components/Admin/Pages/Events";
import Event_proposal from "components/Admin/Pages/Event_proposal";
import EventPage from "components/Admin/Pages/EventRsvp";
import AdminEvent from "components/Admin/Pages/Admin_Events";
import ChangePassword from "components/ChangePassword";

// SP Components
import SPLayout from "components/Student_Practitioner/SPLayout/SPLayout";
import SPDashboard from "components/Student_Practitioner/SPDashboard/SPDashboard";
import ReceivedFiles from "components/Student_Practitioner/Pages/SP_View_Files";
import Create_Society from "components/Student_Practitioner/Pages/Create_Society";
import CalenderP from "components/Student_Practitioner/Pages/Calender";
import Response from "components/Student_Practitioner/Pages/response";
import MoreInfo from "components/Student_Practitioner/Pages/MoreInfo";

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const { direction, layout, darkMode } = controller;

  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  useMemo(() => {
    const cache = createCache({ key: "rtl", stylisPlugins: [rtlPlugin] });
    setRtlCache(cache);
  }, []);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route) =>
      route.collapse
        ? getRoutes(route.collapse)
        : route.route && route.component
        ? [<Route path={route.route} element={route.component} key={route.key} />]
        : []
    );

  const AppWrapper = ({ children }) => {
    return direction === "rtl" ? (
      <CacheProvider value={rtlCache}>
        <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    ) : (
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  };

  AppWrapper.propTypes = {
    children: PropTypes.node.isRequired,
  };

  const showMainDashboardUI =
    layout === "dashboard" &&
    !pathname.startsWith("/student") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/sp") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register") &&
    !pathname.startsWith("/hero") &&
    !pathname.startsWith("/error") &&
    !pathname.startsWith("/society") &&
    !pathname.startsWith("/dayhouse-page");

  const Home = () => (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Welcome to UJ Student Hub</h1>
      <p>Your gateway to university life and communities.</p>
    </div>
  );

  return (
    <AppWrapper>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/register" element={<Register />} />
        {/* Student Routes */}
        <Route path="/student/home" element={<StudentHome />} />
        <Route path="/student/communities" element={<BrowseCommunities />} />
        <Route path="/student/communities/dayhouses" element={<Dayhouses />} />
        <Route path="/dayhouse-page/:id" element={<JoinDayhouse />} />
        <Route path="/attendance" element={<AttendancePage />} /> {/* Added attendance route */}
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route
          path="/society/:id"
          element={
            <ProtectedRoute allowedRoles={["student", "user", "dayhouse", "master"]}>
              <SocietyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/student/communities/joinSociety" element={<JoinSocieties />} />
        <Route path="/student/events/:eventId" element={<EventPage />} />
        {/* MD2 default dashboard routes */}
        {getRoutes(routes)}
        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "dayhouse"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="send-file" element={<AdminSendFile />} />
          <Route path="create-profile" element={<Create_profile />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="members" element={<ManageMembersPage />} />
          <Route path="create-dayhouse-profile" element={<CreateDayhouseProfile />} />
          <Route path="dayhouse-members" element={<ManageDayhouseMembers />} />
          <Route path="upcoming-events" element={<UpcomingEvents />} />
          <Route path="events" element={<Events />} />
          <Route path="event-creation" element={<Event_proposal />} />
          <Route path="admin-event" element={<AdminEvent />} />
        </Route>
        <Route
          path="/student/event"
          element={
            <ProtectedRoute allowedRoles={["admin", "user", "dayhouse", "master"]}>
              <Events />
            </ProtectedRoute>
          }
        />
        {/* Student Practitioner Protected Routes */}
        <Route
          path="/sp"
          element={
            <ProtectedRoute allowedRoles={["master"]}>
              <SPLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SPDashboard />} />
          <Route path="view-file" element={<ReceivedFiles />} />
          <Route path="create-society" element={<Create_Society />} />
          <Route path="calendar" element={<CalenderP />} />
          <Route path="response/:fileId" element={<Response />} />
          <Route path="info/:uploadId" element={<MoreInfo />} />
        </Route>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/error" />} />
      </Routes>
    </AppWrapper>
  );
}
