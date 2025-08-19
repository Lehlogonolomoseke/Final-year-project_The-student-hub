import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import ujLogo from "../assets/images/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = "http://localhost:8000/login.php";

      const response = await axios.post(
        url.trim(),
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.redirect) {
          navigate(data.redirect);
        } else {
          const role = data.user.role.toLowerCase();
          if (role === "master") navigate("/sp/view-file");
          else if (role === "admin") navigate("/admin/send-file");
          else navigate("/student/home");
        }
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-container">
          <img src={ujLogo} alt="UJ Logo" className="uj-logo" />
        </div>
        <h2 className="login-title">Student Hub Login</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            className="login-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="login-form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <a href="/register" className="register-link">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
