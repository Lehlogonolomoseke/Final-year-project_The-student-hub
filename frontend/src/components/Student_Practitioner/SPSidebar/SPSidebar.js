import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ujLogo from "../../../assets/images/logo.png";
import {
  FaTachometerAlt,
  FaFileAlt,
  FaPlusCircle,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import "../../../styles/layout.css";

const SPSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  return (
    <aside className="sp-sidebar">
      <div className="logo-section">
        <img src={ujLogo} alt="UJ Logo" className="uj-logo" />
        <h2>SDP</h2>
      </div>
      <nav className="sp-nav">
        <NavLink to="/sp" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <FaTachometerAlt /> <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/sp/view-file"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FaFileAlt /> <span>View Files</span>
        </NavLink>
        <NavLink
          to="/sp/create-society"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FaPlusCircle /> <span>Create a Society</span>
        </NavLink>
        <NavLink
          to="/sp/calendar"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FaCalendarAlt /> <span>Calendar</span>
        </NavLink>
        <NavLink
          to="/sp/venue"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FaMapMarkedAlt /> <span>Venue Availability</span>
        </NavLink>
        <NavLink
          to="/sp/view_reports"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <FaMapMarkedAlt /> <span>Reports</span>
        </NavLink>

        <div className="sp-logout">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SPSidebar;
