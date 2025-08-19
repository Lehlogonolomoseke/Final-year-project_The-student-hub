import React from "react";
import HeroSection from "./HeroSection";
import FeatureCards from "./FeatureCards";
import CTASection from "./CTASection";
import Footer from "./Footer";
import Navbar from "../StudentNavbar/Navbar";
const StudentHome = () => {
  return (
    <div className="bg-white">
      <Navbar />
      <HeroSection />
      <FeatureCards />
      <CTASection />
      <Footer />
    </div>
  );
};

export default StudentHome;
