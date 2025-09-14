import React, { useState, useEffect } from "react";

export default function Reports() {
  const [formData, setFormData] = useState({
    event_id: "",
    general_feedback: "",
    total_budgeted: 0,
    total_actual: 0,
    report_date: new Date().toISOString().split("T")[0],
  });

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [eventCosts, setEventCosts] = useState([]);
  const [actualSpending, setActualSpending] = useState({});

  // Send functionality
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  // Fetch events (for dropdown)
  useEffect(() => {
    fetch("http://localhost:8000/get_admin_events.php", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents(data.events);
        } else {
          console.error("Failed to fetch events:", data.error);
        }
      })
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

  // Fetch event costs and details when an event is selected
  useEffect(() => {
    if (formData.event_id) {
      fetchEventCosts(formData.event_id);
      const event = events.find((e) => String(e.event_id) === String(formData.event_id));
      setSelectedEvent(event);
    } else {
      setEventCosts([]);
      setActualSpending({});
      setSelectedEvent(null);
    }
  }, [formData.event_id, events]);

  const fetchEventCosts = async (eventId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/get_event_costs.php?event_id=${eventId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (data.success) {
        setEventCosts(data.costs || []);
        const initialActualSpending = {};
        data.costs.forEach((cost) => {
          initialActualSpending[cost.id] = cost.budget || 0;
        });
        setActualSpending(initialActualSpending);
      } else {
        console.error("Failed to fetch event costs:", data.error);
        setEventCosts([]);
        setActualSpending({});
        setMessage({ type: "error", text: data.error || "Failed to fetch event costs" });
      }
    } catch (error) {
      console.error("Error fetching event costs:", error);
      setEventCosts([]);
      setActualSpending({});
      setMessage({ type: "error", text: "Network error while fetching event costs" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActualSpendingChange = (costId, value) => {
    setActualSpending((prev) => ({
      ...prev,
      [costId]: parseFloat(value) || 0,
    }));
  };

  const calculateTotals = () => {
    const totalBudgeted = eventCosts.reduce((sum, cost) => sum + (parseFloat(cost.budget) || 0), 0);
    const totalActual = Object.values(actualSpending).reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0),
      0
    );
    return { totalBudgeted, totalActual };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { totalBudgeted, totalActual } = calculateTotals();

    const reportData = {
      ...formData,
      total_budgeted: totalBudgeted,
      total_actual: totalActual,
      actual_spending: actualSpending,
    };

    try {
      const res = await fetch("http://localhost:8000/save_event_report.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      const data = await res.json();
      if (data.success) {
        setReport(data);
        setMessage({ type: "success", text: "Report saved successfully!" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save report." });
      }
    } catch (err) {
      console.error("Network error:", err);
      setMessage({ type: "error", text: "Network error while saving report." });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!formData.event_id || !selectedEvent) {
      setMessage({ type: "error", text: "Please select an event first." });
      return;
    }

    setPdfLoading(true);
    setMessage(null);

    const { totalBudgeted, totalActual } = calculateTotals();
    const savings = totalBudgeted - totalActual;

    const reportData = {
      event_id: formData.event_id,
      event_details: selectedEvent,
      general_feedback: formData.general_feedback,
      report_date: formData.report_date,
      financial_data: {
        event_costs: eventCosts,
        actual_spending: actualSpending,
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        savings: savings,
      },
    };

    try {
      const response = await fetch("http://localhost:8000/generate_reports.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          setMessage({ type: "error", text: errorJson.error || "Failed to generate PDF." });
        } catch {
          setMessage({ type: "error", text: `Server error: ${errorText}` });
        }
        return;
      }

      if (!contentType || !contentType.includes("application/pdf")) {
        const responseText = await response.text();
        try {
          const jsonResponse = JSON.parse(responseText);
          setMessage({
            type: "error",
            text: jsonResponse.error || "Server returned unexpected response format.",
          });
        } catch {
          setMessage({
            type: "error",
            text: "Server returned non-PDF response: " + responseText.substring(0, 200),
          });
        }
        return;
      }

      const blob = await response.blob();

      if (blob.size < 1000) {
        const blobText = await blob.text();
        try {
          const jsonResponse = JSON.parse(blobText);
          setMessage({ type: "error", text: jsonResponse.error || "PDF generation failed." });
        } catch {
          setMessage({
            type: "error",
            text: "Generated PDF is too small. Possible server error: " + blobText,
          });
        }
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Event_Report_${selectedEvent.name.replace(/[^a-z0-9]/gi, "_")}_${
        formData.report_date
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "PDF report generated and downloaded successfully!" });
    } catch (err) {
      console.error("Network error:", err);
      setMessage({ type: "error", text: "Network error while generating PDF: " + err.message });
    } finally {
      setPdfLoading(false);
    }
  };

  // Generate and Send PDF to Student Practitioner
  const sendReportToStudent = async () => {
    if (!formData.event_id || !selectedEvent) {
      setMessage({ type: "error", text: "Please select an event first." });
      return;
    }

    setSendLoading(true);
    setMessage(null);

    const { totalBudgeted, totalActual } = calculateTotals();
    const savings = totalBudgeted - totalActual;

    const reportData = {
      event_id: formData.event_id,
      event_details: selectedEvent,
      general_feedback: formData.general_feedback,
      report_date: formData.report_date,
      financial_data: {
        event_costs: eventCosts,
        actual_spending: actualSpending,
        total_budgeted: totalBudgeted,
        total_actual: totalActual,
        savings: savings,
      },
    };

    try {
      // First generate the PDF
      const pdfResponse = await fetch("http://localhost:8000/generate_reports.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      if (!pdfResponse.ok) {
        throw new Error("Failed to generate PDF for sending");
      }

      const pdfBlob = await pdfResponse.blob();
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64PDF = reader.result.split(",")[1]; // Remove data:application/pdf;base64, prefix

          // Send the PDF to student practitioner
          const sendResponse = await fetch("http://localhost:8000/send_report.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              event_name: selectedEvent.name,
              event_date: selectedEvent.start_date,
              pdf_data: base64PDF,
              message: sendMessage,
            }),
          });

          const sendData = await sendResponse.json();
          if (sendData.success) {
            setMessage({
              type: "success",
              text: "Report sent successfully to student practitioner!",
            });
            setShowSendModal(false);
            setSendMessage("");
          } else {
            setMessage({ type: "error", text: sendData.message || "Failed to send report." });
          }
        } catch (err) {
          console.error("Error sending report:", err);
          setMessage({ type: "error", text: "Network error while sending report." });
        } finally {
          setSendLoading(false);
        }
      };

      reader.readAsDataURL(pdfBlob);
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: "Failed to generate or send report: " + err.message });
      setSendLoading(false);
    }
  };

  const { totalBudgeted, totalActual } = calculateTotals();
  const savings = totalBudgeted - totalActual;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📊 Event Report</h2>

      {message && (
        <div
          className={`p-3 mb-4 rounded ${
            message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4 bg-white shadow rounded-xl p-6">
        <div>
          <label className="block font-semibold mb-1">📅 Select Event</label>
          <select
            name="event_id"
            value={formData.event_id}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Select an event --</option>
            {events.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.name} ({new Date(ev.start_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Event Summary Section */}
        {selectedEvent && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">📋 Event Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p>
                  <strong>Event Name:</strong> {selectedEvent.name}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {selectedEvent.start_time} - {selectedEvent.end_time}
                </p>
                <p>
                  <strong>Location:</strong> {selectedEvent.location}
                </p>
                <p>
                  <strong>Type:</strong> {selectedEvent.event_type}
                </p>
                {selectedEvent.capacity && (
                  <p>
                    <strong>Capacity:</strong> {selectedEvent.capacity}
                  </p>
                )}
              </div>
              <div>
                <div className="space-y-2">
                  <div className="bg-white p-2 rounded border">
                    <p>
                      <strong>👥 RSVP Summary:</strong>
                    </p>
                    <p className="text-green-600">
                      ✓ Interested: {selectedEvent.rsvp_counts?.interested || 0}
                    </p>
                    <p className="text-red-600">
                      ✗ Not Interested: {selectedEvent.rsvp_counts?.not_interested || 0}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <p>
                      <strong>📊 Attendance:</strong>
                    </p>
                    <p className="text-blue-600">Present: {selectedEvent.attendance_count || 0}</p>
                    {selectedEvent.capacity && (
                      <p className="text-gray-600">
                        Attendance Rate:{" "}
                        {((selectedEvent.attendance_count / selectedEvent.capacity) * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.event_id && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">💸 Financial Details</h3>
            {eventCosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 border-b text-left font-semibold">Cost Item</th>
                      <th className="py-3 px-4 border-b text-right font-semibold">Budgeted (R)</th>
                      <th className="py-3 px-4 border-b text-right font-semibold">
                        Actual Spent (R)
                      </th>
                      <th className="py-3 px-4 border-b text-right font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventCosts.map((cost) => {
                      const budgeted = parseFloat(cost.budget) || 0;
                      const actual = parseFloat(actualSpending[cost.id]) || 0;
                      const difference = budgeted - actual;

                      return (
                        <tr key={cost.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 border-b">
                            <div>
                              <div className="font-medium">{cost.name}</div>
                              {cost.comments && (
                                <div className="text-sm text-gray-500">{cost.comments}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 border-b text-right">R{budgeted.toFixed(2)}</td>
                          <td className="py-3 px-4 border-b text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={actualSpending[cost.id] || 0}
                              onChange={(e) => handleActualSpendingChange(cost.id, e.target.value)}
                              className="w-28 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td
                            className={`py-3 px-4 border-b text-right font-medium ${
                              difference >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {difference >= 0 ? "+" : ""}R{difference.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="font-semibold">
                      <td className="py-3 px-4 border-t">TOTALS</td>
                      <td className="py-3 px-4 border-t text-right">R{totalBudgeted.toFixed(2)}</td>
                      <td className="py-3 px-4 border-t text-right">R{totalActual.toFixed(2)}</td>
                      <td
                        className={`py-3 px-4 border-t text-right ${
                          savings >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {savings >= 0 ? "+" : ""}R{savings.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  ⚠️ No budget items found for this event. You can still generate a report with
                  event details and feedback.
                </p>
              </div>
            )}

            {eventCosts.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      R{totalBudgeted.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">💰 Total Budgeted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      R{totalActual.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">💵 Total Actual</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${
                        savings >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {savings >= 0 ? "+" : ""}R{savings.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      📊 {savings >= 0 ? "Savings" : "Overspent"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">📝 General Feedback</label>
          <textarea
            name="general_feedback"
            value={formData.general_feedback}
            onChange={handleChange}
            rows="4"
            className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your feedback about the event, including what went well, challenges faced, and recommendations for future events..."
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">📆 Report Date</label>
          <input
            type="date"
            name="report_date"
            value={formData.report_date}
            onChange={handleChange}
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.event_id}
            className="bg-blue-600 text-white px-4 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "💾 Saving Report..." : "💾 Save Event Report"}
          </button>

          <button
            onClick={generatePDF}
            disabled={pdfLoading || !formData.event_id || !formData.general_feedback.trim()}
            className="bg-red-600 text-white px-4 py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pdfLoading ? "📄 Generating PDF..." : "📄 Generate PDF Report"}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            disabled={!formData.event_id || !selectedEvent || !formData.general_feedback.trim()}
            className="bg-green-600 text-white px-4 py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📧 Send to Student Practitioner
          </button>
        </div>

        {!formData.general_feedback.trim() && formData.event_id && (
          <p className="text-sm text-gray-500 text-center">
            💡 Please add general feedback before generating PDF or sending report
          </p>
        )}
      </div>

      {/* Send Report Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">📧 Send Report to Student Practitioner</h3>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p>
                  <strong>Event:</strong> {selectedEvent?.name}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedEvent && new Date(selectedEvent.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Financial Summary:</strong> R{totalBudgeted.toFixed(2)} budgeted, R
                  {totalActual.toFixed(2)} actual
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">💬 Message (Optional)</label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows="3"
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes or instructions..."
                />
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800">
                ℹ️ This will generate a PDF report and send it to the student practitioner for
                review.
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={sendReportToStudent}
                disabled={sendLoading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {sendLoading ? "📧 Sending..." : "📧 Send Report"}
              </button>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSendMessage("");
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="mt-6 p-6 bg-gray-100 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">📑 Report Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Report ID:</strong> {report.report_id}
              </p>
              <p>
                <strong>Event ID:</strong> {formData.event_id}
              </p>
              <p>
                <strong>Report Date:</strong> {formData.report_date}
              </p>
            </div>
            <div>
              <p>
                <strong>💰 Total Budgeted:</strong> R{report.financial_summary.total_budgeted}
              </p>
              <p>
                <strong>💵 Total Actual:</strong> R{report.financial_summary.total_actual}
              </p>
              <p
                className={`font-semibold ${
                  report.financial_summary.savings >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <strong>
                  📊 {report.financial_summary.savings >= 0 ? "Savings" : "Overspent"}:
                </strong>{" "}
                R{report.financial_summary.savings}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p>
              <strong>Feedback:</strong>
            </p>
            <p className="bg-white p-3 rounded border italic">{formData.general_feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
