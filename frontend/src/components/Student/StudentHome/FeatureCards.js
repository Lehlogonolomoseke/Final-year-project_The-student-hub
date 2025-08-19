import React from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "👥",
    title: "Meet New People",
    description:
      "Connect with fellow students across faculties and share your university journey together.",
  },
  {
    icon: "📅",
    title: "Track Participation",
    description: "Easily keep track of your engagement in events and student communities.",
  },
  {
    icon: "🏡",
    title: "Join a Community",
    description: "Belong to a close-knit group that feels like home, right here at UJ.",
  },
  {
    icon: "📝",
    title: "Send Requests",
    description: "Request to join societies or propose new ideas — your voice matters.",
  },
  {
    icon: "✅",
    title: "Attendance Tracking",
    description: "",
  },
];

const FeatureCards = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-16 font-outfit tracking-tight">
          Why Use the Student Hub?
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-3xl shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out cursor-default"
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center text-3xl bg-[#f15a22]/20 text-[#f15a22] rounded-full drop-shadow-lg">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>

              {/* Description OR Attendance Button */}
              {feature.title === "Attendance Tracking" ? (
                <button
                  onClick={() => navigate("/attendance")}
                  className="mt-4 px-6 py-2 bg-[#f15a22] text-white rounded-lg hover:bg-[#d14b1e] transition"
                >
                  Go to Attendance
                </button>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{feature.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
