import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 text-center md:text-left">
        {/* Left Section: Logo + Tagline */}
        <div className="flex flex-col items-center md:items-start space-y-3">
          {/* Replace this div with your UJ logo img */}
          <div className="text-3xl font-extrabold text-[#f15a22] font-outfit select-none cursor-default">
            UJ Student Hub
          </div>
          <div className="text-xs text-gray-500 select-none">© 2025 University of Johannesburg</div>
        </div>

        {/* Center Section: Navigation Links */}
        <nav className="space-x-8 text-sm font-semibold flex justify-center">
          <a href="#" className="hover:text-orange-400 transition">
            Terms
          </a>
          <a href="#" className="hover:text-orange-400 transition">
            Privacy
          </a>
        </nav>

        {/* Right Section: Social Media */}
        <div className="flex space-x-6 justify-center">
          <a
            href="https://facebook.com/UJ.StudentHub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="hover:text-orange-400 transition"
          >
            <FaFacebookF size={20} />
          </a>
          <a
            href="https://twitter.com/UJStudentHub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-orange-400 transition"
          >
            <FaTwitter size={20} />
          </a>
          <a
            href="https://instagram.com/UJ.StudentHub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-orange-400 transition"
          >
            <FaInstagram size={20} />
          </a>
          <a
            href="https://linkedin.com/company/uj-student-hub"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-orange-400 transition"
          >
            <FaLinkedinIn size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
