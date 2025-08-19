import React, { useState } from "react";

const Step1Form = ({
  formData,
  handleInputChange,
  handleFileUpload,
  uploadStatus,
  uploadedFile,
  errors,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <label className="block mb-2 font-semibold text-gray-700" htmlFor="preferred_venue">
          Preferred Venue <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          id="preferred_venue"
          name="preferred_venue"
          value={formData.preferred_venue || ""}
          onChange={handleInputChange}
          className={`w-full p-3 rounded-lg border ${
            errors.preferred_venue ? "border-red-500" : "border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-purple-400`}
          placeholder="Enter your preferred venue"
        />
        {errors.preferred_venue && (
          <p className="text-red-500 text-sm mt-1">{errors.preferred_venue}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="alternative_venue_1">
            Alternative Venue 1
          </label>
          <input
            type="text"
            id="alternative_venue_1"
            name="alternative_venue_1"
            value={formData.alternative_venue_1 || ""}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="alternative_venue_2">
            Alternative Venue 2
          </label>
          <input
            type="text"
            id="alternative_venue_2"
            name="alternative_venue_2"
            value={formData.alternative_venue_2 || ""}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="booking_date">
            Booking Date <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            id="booking_date"
            name="booking_date"
            value={formData.booking_date || ""}
            onChange={handleInputChange}
            className={`w-full p-3 rounded-lg border ${
              errors.booking_date ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-purple-400`}
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="start_time">
            Start Time <span className="text-red-600">*</span>
          </label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={formData.start_time || ""}
            onChange={handleInputChange}
            className={`w-full p-3 rounded-lg border ${
              errors.start_time ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-purple-400`}
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold text-gray-700" htmlFor="end_time">
            End Time <span className="text-red-600">*</span>
          </label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={formData.end_time || ""}
            onChange={handleInputChange}
            className={`w-full p-3 rounded-lg border ${
              errors.end_time ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-purple-400`}
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 font-semibold text-gray-700" htmlFor="special_requirements">
          Special Requirements
        </label>
        <textarea
          id="special_requirements"
          name="special_requirements"
          value={formData.special_requirements || ""}
          onChange={handleInputChange}
          rows={4}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Enter any special requirements..."
        />
      </div>

      <div>
        <label className="block mb-2 font-semibold text-gray-700" htmlFor="event_document">
          Upload Event Document <span className="text-red-600">*</span>
        </label>
        <input
          type="file"
          id="event_document"
          name="event_document"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        {uploadStatus.uploading && <p className="text-blue-500 mt-1">Uploading...</p>}
        {uploadStatus.success && uploadedFile?.file_name && (
          <p className="text-green-600 mt-1">Uploaded: {uploadedFile.file_name}</p>
        )}
        {uploadStatus.error && <p className="text-red-500 mt-1">{uploadStatus.error}</p>}
        {errors.event_document && (
          <p className="text-red-500 text-sm mt-1">{errors.event_document}</p>
        )}
      </div>

      <div>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            name="furniture_required"
            checked={formData.furniture_required || false}
            onChange={handleInputChange}
            className="form-checkbox h-5 w-5 text-purple-600"
          />
          <span className="ml-2 font-semibold text-gray-700">Require Furniture?</span>
        </label>
        {formData.furniture_required && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-4">
              {["Chairs", "Tables", "Podium", "Projector"].map((type) => (
                <label key={type} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="furniture_types"
                    value={type}
                    checked={formData.furniture_types?.includes(type) || false}
                    onChange={handleInputChange}
                    className="form-checkbox h-4 w-4 text-purple-600"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
            <textarea
              name="other_furniture_details"
              placeholder="Other furniture details..."
              value={formData.other_furniture_details || ""}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        )}
      </div>

      <div>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            name="acknowledge_rules"
            checked={formData.acknowledge_rules || false}
            onChange={handleInputChange}
            className={`form-checkbox h-5 w-5 text-purple-600 ${
              errors.acknowledge_rules ? "border-red-500" : ""
            }`}
          />
          <span className="ml-2 text-gray-700 font-semibold">
            I acknowledge the event rules and regulations <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.acknowledge_rules && (
          <p className="text-red-500 text-sm mt-1">{errors.acknowledge_rules}</p>
        )}
      </div>
    </div>
  );
};

const ProgressIndicator = ({ currentStep }) => {
  const steps = ["Event Details", "Cost Details", "Review & Submit"];
  return (
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-white ${
              currentStep === index + 1
                ? "bg-purple-600"
                : currentStep > index + 1
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
          >
            {index + 1}
          </div>
          <span className="mt-2 text-sm text-gray-700 text-center">{step}</span>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-full mt-2 ${
                currentStep > index + 1 ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const EventProposalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    preferred_venue: "",
    alternative_venue_1: "",
    alternative_venue_2: "",
    booking_date: "",
    start_time: "",
    end_time: "",
    special_requirements: "",
    furniture_required: false,
    furniture_types: [],
    other_furniture_details: "",
    acknowledge_rules: false,
    cost_items: [{ name: "", budget: 0, comments: "" }],
  });

  const [errors, setErrors] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "furniture_types") {
      let updatedTypes = formData.furniture_types || [];
      if (checked) updatedTypes.push(value);
      else updatedTypes = updatedTypes.filter((v) => v !== value);
      setFormData({ ...formData, furniture_types: updatedTypes });
      return;
    }

    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileUpload = (file) => {
    setUploadStatus({ uploading: true });
    setTimeout(() => {
      setUploadedFile({ file_name: file.name });
      setUploadStatus({ uploading: false, success: true });
    }, 1000);
  };

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrevious = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const handleSubmit = () => alert("Form submitted!");

  const totalBudget = formData.cost_items.reduce((acc, item) => acc + Number(item.budget || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6 font-sans text-gray-800">
      <h2 className="text-2xl font-bold text-center text-purple-700">Event Proposal Form</h2>

      <ProgressIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <Step1Form
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileUpload={handleFileUpload}
          uploadStatus={uploadStatus}
          uploadedFile={uploadedFile}
          errors={errors}
        />
      )}

      <div className="flex justify-between mt-6">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Previous
          </button>
        )}
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ml-auto"
          >
            Next
          </button>
        )}
        {currentStep === 3 && (
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 ml-auto"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default EventProposalForm;
