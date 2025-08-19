import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar/AdminSidebar";
import "../../../styles/layout.css";

const AdminLayout = () => (
  <div className="admin-layout">
    <AdminSidebar />
    <main className="admin-content">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
