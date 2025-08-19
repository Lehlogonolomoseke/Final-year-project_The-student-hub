import React from "react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="bg-gradient-to-r from-[#f15a22] to-[#c84e1a] text-white py-20 px-6 rounded-t-3xl shadow-lg max-w-7xl mx-auto -mt-16 relative z-20">
      <h2 className="text-4xl font-extrabold mb-10 tracking-tight font-outfit drop-shadow-lg text-center">
        Step Into Student Life
      </h2>
      <p className="mb-12 text-lg max-w-3xl mx-auto font-light drop-shadow-md text-center">
        Discover your place at UJ by joining a Dayhouse or Society. Connect, participate, and
        belong.
      </p>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        <Link
          to="/student/communities/dayhouses"
          className="bg-white text-[#f15a22] rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 flex flex-col items-center justify-center"
        >
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-2xl font-semibold mb-2">Explore Dayhouses</h3>
          <p className="text-sm font-light text-gray-800 text-center">
            Find your home away from home and build lasting friendships.
          </p>
        </Link>

        <Link
          to="/student/communities/joinSociety"
          className="bg-white text-[#f15a22] rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 flex flex-col items-center justify-center"
        >
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-2xl font-semibold mb-2">Discover Societies</h3>
          <p className="text-sm font-light text-gray-800 text-center">
            Join a society that matches your passions and expand your skills.
          </p>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
