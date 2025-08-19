import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import logo from "../../assets/images/logo.png";

function Register() {
  const navigate = useNavigate();
  const [registerInfo, setRegisterInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRegisterInfo((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!registerInfo.first_name.trim()) newErrors.first_name = "First name is required";
    if (!registerInfo.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!registerInfo.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(registerInfo.email))
      newErrors.email = "Please enter a valid email";
    if (!registerInfo.password) newErrors.password = "Password is required";
    else if (registerInfo.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!registerInfo.confirm_password) newErrors.confirm_password = "Please confirm your password";
    else if (registerInfo.password !== registerInfo.confirm_password)
      newErrors.confirm_password = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage("");

    try {
      const response = await fetch("http://localhost:8000/register.php", {
        method: "POST",
        body: JSON.stringify(registerInfo),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Registration successful! Redirecting...");
        setRegisterInfo({
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirm_password: "",
          role: "user",
        });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setErrors(result.errors || { general: result.error || "Registration failed" });
      }
    } catch (error) {
      console.error(error);
      setErrors({ general: "Server error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const formFields = [
    { name: "first_name", type: "text", placeholder: "Enter your first name" },
    { name: "last_name", type: "text", placeholder: "Enter your last name" },
    { name: "email", type: "email", placeholder: "Enter your email address" },
    { name: "password", type: "password", placeholder: "Create a password" },
    { name: "confirm_password", type: "password", placeholder: "Confirm your password" },
  ];

  return (
    <div className="login-page">
      {" "}
      <div className="login-card">
        {" "}
        <div className="logo-container">
          <img src={logo} alt="UJ Logo" className="uj-logo" />
        </div>
        <h2 className="login-title">Register for Student Hub</h2>
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errors.general && <div className="error-message">{errors.general}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          {formFields.map(({ name, type, placeholder }) => (
            <div key={name}>
              <input
                name={name}
                type={type}
                value={registerInfo[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`login-form-input ${errors[name] ? "input-error" : ""}`}
                disabled={isLoading}
              />
              {errors[name] && <p className="text-error">{errors[name]}</p>}
            </div>
          ))}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className="login-text">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="login-link">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
