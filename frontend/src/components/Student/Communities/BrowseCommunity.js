import React from "react";
import { Link } from "react-router-dom";
import dayhouseImg from "../../../assets/images/hero.png";
import societyImg from "../../../assets/images/society.jpg";
import Footer from "../StudentHome/Footer";

const BrowseCommunity = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col justify-between">
      <div>
        {/* Back Button */}
        <div className="px-4 md:px-8 mt-6 mb-6">
          <Link
            to="/student/home"
            className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 font-medium px-4 py-2 rounded-full shadow-sm hover:bg-orange-200 transition"
          >
            <span className="text-lg">←</span> Back to Dashboard
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center px-6 md:px-0 mb-16 py-12 bg-gradient-to-r from-orange-100 via-orange-50 to-white rounded-2xl shadow-md">
          <h1 className="text-4xl md:text-5xl font-extrabold text-orange-700 mb-4">
            Explore UJ Communities
          </h1>
          <p className="text-lg md:text-xl text-orange-900 max-w-4xl mx-auto leading-relaxed">
            Dive into the world of <span className="font-semibold text-orange-700">Academics</span>,{" "}
            <span className="font-semibold text-orange-700">Leadership</span>, and{" "}
            <span className="font-semibold text-orange-700">Community Engagement</span>. Celebrate
            our vibrant <span className="font-semibold text-orange-700">Culture</span> and{" "}
            <span className="font-semibold text-orange-700">Sport</span> — there is something
            extraordinary waiting for every UJ student.
          </p>
        </div>

        {/* Cards Section */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 px-4 md:px-0 mb-20">
          {/* Dayhouses */}
          <div className="bg-orange-50 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <img
              src={dayhouseImg}
              alt="Dayhouses"
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-3 text-orange-700">Dayhouses</h3>
              <p className="text-gray-700 mb-5">
                Your UJ family. Make memories, represent your house with pride, and compete with
                spirit.
              </p>
              <Link
                to="/student/communities/dayhouses"
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition font-medium"
              >
                Explore Dayhouses
              </Link>
            </div>
          </div>

          {/* Societies */}
          <div className="bg-orange-50 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <img
              src={societyImg}
              alt="Societies"
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-3 text-orange-700">Societies</h3>
              <p className="text-gray-700 mb-5">
                Meet people who vibe like you. Join groups based on what you love — from books to
                business to beats.
              </p>
              <Link
                to="/student/communities/joinSociety"
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition font-medium"
              >
                Explore Societies
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-orange-100 py-10 text-center px-4 rounded-t-3xl shadow-inner">
          <p className="text-lg text-orange-800 font-medium">
            There is a space waiting for you — go explore and find your vibe!
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BrowseCommunity;
