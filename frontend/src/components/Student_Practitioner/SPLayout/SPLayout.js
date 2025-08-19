import React from "react";
import { Outlet } from "react-router-dom";
import SPSidebar from "../SPSidebar/SPSidebar";
import "../../../styles/layout.css";

const SPLayout = () => (
  <div className="sp-layout">
    <SPSidebar />
    <main className="sp-content">
      <Outlet />
    </main>
  </div>
);

export default SPLayout;
