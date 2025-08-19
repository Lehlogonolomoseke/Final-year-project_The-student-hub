import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../../../assets/images/UJ-background2.jpg";

const HeroSection = () => {
  return (
    <section
      className="relative w-full min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
    >
      {/* Enhanced dark overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 text-center text-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight font-outfit mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          Welcome to the <span className="text-[#f15a22]">UJ</span> Student Hub
        </h1>

        <p className="text-lg sm:text-xl font-light mb-10 max-w-2xl mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
          Connect. Participate. Belong.
          <br className="hidden sm:block" />
          Explore societies, join exciting events, and grow your campus community with purpose.
        </p>

        <div className="flex justify-center flex-wrap gap-4">
          <Link
            to="/student/communities"
            className="bg-[#f15a22] hover:bg-[#d14e1f] text-white font-semibold py-3 px-6 rounded-full transition duration-300 shadow-lg"
          >
            Browse Communities
          </Link>
          <Link
            to="/student/event" // <-- changed from /student/events
            className="bg-transparent border-2 border-white hover:bg-white hover:text-[#f15a22] text-white font-semibold py-3 px-6 rounded-full transition duration-300 shadow-lg"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
