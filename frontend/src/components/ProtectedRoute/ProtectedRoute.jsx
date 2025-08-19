import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Check for the user object in local storage
  const userData = localStorage.getItem("user");

  // If no user data, redirect to login
  if (!userData) {
    console.log("No user data found in localStorage. Redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userData);
  } catch (error) {
    console.error("Error parsing user data:", error);
    console.log("Redirecting to login due to invalid user data.");
    return <Navigate to="/login" replace />;
  }

  // Get the user's role from the stored data
  const userRole = user.role?.trim().toLowerCase();

  console.log("ProtectedRoute - User role:", userRole);
  console.log("ProtectedRoute - Allowed roles:", allowedRoles);

  // If specific roles are required, check against them
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((role) => {
      const normalizedRole = role.trim().toLowerCase();
      console.log(`Checking role: ${normalizedRole} against user role: ${userRole}`);

      // Direct role match
      if (normalizedRole === userRole) {
        console.log("Direct role match found");
        return true;
      }

      return false;
    });

    if (!hasAllowedRole) {
      console.log(
        `Access denied. User role '${userRole}' is not in allowed roles: ${allowedRoles.join(
          ", "
        )}`
      );
      return <Navigate to="/login" replace />;
    }
  }

  console.log("Access granted. Rendering protected component.");
  // If checks pass, render the children
  return children;
};

ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;