import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ujLogo from "../../../assets/images/logo.png";
import AssignmentIcon from "@mui/icons-material/Assignment";
import {
  FaTachometerAlt,
  FaIdCard,
  FaHouseUser,
  FaUsers,
  FaMapMarkedAlt,
  FaUserFriends,
  FaClipboardList,
  FaSignOutAlt,
} from "react-icons/fa";
import "../../../styles/layout.css";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  const links = [
    { to: "/admin", icon: FaTachometerAlt, label: "Dashboard" },
    { to: "/admin/create-profile", icon: FaIdCard, label: "Create Society Profile" },
    { to: "/admin/create-dayhouse-profile", icon: FaHouseUser, label: "Create Dayhouse Profile" },
    { to: "/admin/dayhouse-members", icon: FaUsers, label: "Dayhouse Members" },
    { to: "/admin/events-hub", icon: FaClipboardList, label: "Events Hub" }, // New grouped page
    { to: "/admin/members", icon: FaUserFriends, label: "Members Management" },
    { to: "/admin/qrcode", icon: AssignmentIcon, label: "Generate qrCode" },
    { to: "/admin/reports", icon: FaMapMarkedAlt, label: "Reports" },
    { to: "/admin/announcement", icon: FaMapMarkedAlt, label: "Create an Announcement" },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="logo-section">
        <img src={ujLogo} alt="UJ Logo" className="uj-logo" />
        <h2>Admin</h2>
      </div>

      <nav className="admin-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            title={label}
          >
            <Icon className="nav-icon" />
            <span className="nav-text">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <FaSignOutAlt className="nav-icon" /> Logout
      </button>
    </aside>
  );
};

export default AdminSidebar;
