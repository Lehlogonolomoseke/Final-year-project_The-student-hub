import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import ujLogo from "../../../assets/images/logo.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Close mobile menu on route change
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    // Check if user is logged in by checking localStorage
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);

    if (user) {
      fetchUnreadCount();

      // 🔄 auto-refresh unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("http://localhost:8000/get_notifications.php?unread=true", {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const goToEvents = () => navigate("/student/event");

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/logout.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      // Clear local storage regardless of server response
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      navigate("/login");
    }
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      navigate("/login");
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-colors duration-500 ${
        isScrolled ? "bg-gray-900 shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center h-20 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={ujLogo} alt="UJ Student Hub Logo" className="h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex space-x-8 font-semibold transition-colors duration-500 text-white">
          <li>
            <Link to="/student/home" className="hover:text-[#f15a22] transition">
              Home
            </Link>
          </li>
          <li>
            <Link to="/student/communities" className="hover:text-[#f15a22] transition">
              Communities
            </Link>
          </li>
          <li>
            <button
              onClick={goToEvents}
              className="hover:text-[#f15a22] transition cursor-pointer bg-transparent border-none text-inherit font-inherit"
            >
              Events
            </button>
          </li>
          {isLoggedIn && (
            <li>
              <Link to="/UserProfile" className="hover:text-[#f15a22] transition">
                My Profile
              </Link>
            </li>
          )}
        </ul>

        {/* Right side: Bell + Login/Logout */}
        <div className="flex items-center space-x-6">
          {/* 🔔 Announcement Bell */}
          {isLoggedIn && (
            <Link to="/SNotifications" className="relative">
              <Bell className="w-7 h-7 text-white hover:text-[#f15a22] transition" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Login / Logout button */}
          {isLoggedIn ? (
            <button
              onClick={handleLoginClick}
              className={`py-2 px-6 rounded-full font-semibold transition duration-300 shadow-md ${
                isScrolled
                  ? "bg-[#f15a22] text-white hover:bg-[#d14e1f]"
                  : "bg-white text-[#f15a22] hover:bg-[#f15a22] hover:text-white"
              }`}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleLoginClick}
              className={`border-2 py-2 px-6 rounded-full font-semibold transition duration-300 shadow-md ${
                isScrolled
                  ? "border-[#f15a22] text-[#f15a22] hover:bg-[#f15a22] hover:text-white"
                  : "border-white text-white hover:bg-white hover:text-[#f15a22]"
              }`}
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden focus:outline-none ${isScrolled ? "text-gray-700" : "text-white"}`}
          aria-label="Toggle menu"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu links */}
      {menuOpen && (
        <ul
          className={`md:hidden px-4 py-4 space-y-3 font-semibold transition-colors duration-500 ${
            isScrolled ? "bg-white text-gray-700 shadow-lg" : "bg-black bg-opacity-80 text-white"
          }`}
        >
          <li>
            <Link
              to="/student/home"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-[#f15a22]"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/student/communities"
              onClick={() => setMenuOpen(false)}
              className="block hover:text-[#f15a22]"
            >
              Communities
            </Link>
          </li>
          <li>
            <button
              onClick={() => {
                goToEvents();
                setMenuOpen(false);
              }}
              className="block hover:text-[#f15a22] text-left w-full bg-transparent border-none text-inherit font-inherit cursor-pointer"
            >
              Events
            </button>
          </li>
          {isLoggedIn && (
            <li>
              <Link
                to="/UserProfile"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-[#f15a22]"
              >
                My Profile
              </Link>
            </li>
          )}
          {isLoggedIn && (
            <li>
              <Link
                to="/student/announcements"
                onClick={() => setMenuOpen(false)}
                className="block hover:text-[#f15a22]"
              >
                Announcements
              </Link>
            </li>
          )}

          <li>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLoginClick();
                  setMenuOpen(false);
                }}
                className="w-full bg-[#f15a22] text-white py-2 rounded-full font-semibold hover:bg-[#d14e1f] transition"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  handleLoginClick();
                  setMenuOpen(false);
                }}
                className="w-full border-2 border-[#f15a22] text-[#f15a22] py-2 rounded-full font-semibold hover:bg-[#f15a22] hover:text-white transition"
              >
                Login
              </button>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
