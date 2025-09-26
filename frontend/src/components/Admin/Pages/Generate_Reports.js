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
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/get_admin_events.php", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEvents(data.events);
      })
      .catch((err) => console.error("Error fetching events:", err));
  }, []);

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
        const initialActual = {};
        data.costs.forEach((cost) => {
          initialActual[cost.id] = cost.budget || 0;
        });
        setActualSpending(initialActual);
      } else {
        setEventCosts([]);
        setActualSpending({});
        setMessage({ type: "error", text: data.error || "Failed to fetch event costs" });
      }
    } catch (error) {
      setEventCosts([]);
      setActualSpending({});
      setMessage({ type: "error", text: "Network error while fetching event costs" });
    }
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleActualSpendingChange = (costId, value) => {
    setActualSpending((prev) => ({ ...prev, [costId]: parseFloat(value) || 0 }));
  };

  const calculateTotals = () => {
    const totalBudgeted = eventCosts.reduce((sum, cost) => sum + (parseFloat(cost.budget) || 0), 0);
    const totalActual = Object.values(actualSpending).reduce(
      (sum, amt) => sum + (parseFloat(amt) || 0),
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
      setMessage(
        data.success
          ? { type: "success", text: "Report saved successfully!" }
          : { type: "error", text: data.error || "Failed to save report." }
      );
      if (data.success) setReport(data);
    } catch (err) {
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
        savings,
      },
    };

    try {
      const response = await fetch("http://localhost:8000/generate_reports.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
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
      setMessage({ type: "success", text: "PDF generated and downloaded successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Error generating PDF: " + err.message });
    } finally {
      setPdfLoading(false);
    }
  };

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
        savings,
      },
    };

    try {
      const pdfResponse = await fetch("http://localhost:8000/generate_reports.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reportData),
      });

      if (!pdfResponse.ok) throw new Error("Failed to generate PDF for sending");

      const pdfBlob = await pdfResponse.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64PDF = reader.result.split(",")[1];
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
        setMessage(
          sendData.success
            ? { type: "success", text: "Report sent successfully!" }
            : { type: "error", text: sendData.message || "Failed to send report." }
        );
        if (sendData.success) {
          setShowSendModal(false);
          setSendMessage("");
        }
      };
      reader.readAsDataURL(pdfBlob);
    } catch (err) {
      setMessage({ type: "error", text: "Error sending report: " + err.message });
    } finally {
      setSendLoading(false);
    }
  };

  const { totalBudgeted, totalActual } = calculateTotals();
  const savings = totalBudgeted - totalActual;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Event Report</h2>

      {message && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6 bg-white shadow-lg rounded-xl p-6">
        {/* Event Selection */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">Select Event</label>
          <select
            name="event_id"
            value={formData.event_id}
            onChange={handleChange}
            className="w-full border-gray-300 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

        {/* Event Summary */}
        {selectedEvent && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Event Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 text-sm">
              <div className="space-y-1">
                <p>
                  <strong>Name:</strong> {selectedEvent.name}
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
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border">
                  <p>
                    <strong>RSVP Summary:</strong>
                  </p>
                  <p className="text-green-600">
                    Interested: {selectedEvent.rsvp_counts?.interested || 0}
                  </p>
                  <p className="text-red-600">
                    Not Interested: {selectedEvent.rsvp_counts?.not_interested || 0}
                  </p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p>
                    <strong>Attendance:</strong>
                  </p>
                  <p className="text-blue-600">Present: {selectedEvent.attendance_count || 0}</p>
                  {selectedEvent.capacity && (
                    <p className="text-gray-600">
                      Rate:{" "}
                      {((selectedEvent.attendance_count / selectedEvent.capacity) * 100).toFixed(1)}
                      %
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Details */}
        {formData.event_id && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Financial Details</h3>
            {eventCosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg text-gray-700">
                  <thead className="bg-gray-100 text-left text-sm font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b">Cost Item</th>
                      <th className="px-4 py-3 border-b text-right">Budgeted (R)</th>
                      <th className="px-4 py-3 border-b text-right">Actual Spent (R)</th>
                      <th className="px-4 py-3 border-b text-right">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventCosts.map((cost) => {
                      const budgeted = parseFloat(cost.budget) || 0;
                      const actual = parseFloat(actualSpending[cost.id]) || 0;
                      const diff = budgeted - actual;
                      return (
                        <tr key={cost.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b">
                            <div className="font-medium">{cost.name}</div>
                            {cost.comments && (
                              <div className="text-sm text-gray-500">{cost.comments}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b text-right">R{budgeted.toFixed(2)}</td>
                          <td className="px-4 py-3 border-b text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={actualSpending[cost.id] || 0}
                              onChange={(e) => handleActualSpendingChange(cost.id, e.target.value)}
                              className="w-24 px-2 py-1 border rounded text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td
                            className={`px-4 py-3 border-b text-right font-semibold ${
                              diff >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {diff >= 0 ? "+" : ""}R{diff.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-4 py-3 border-t">TOTALS</td>
                      <td className="px-4 py-3 border-t text-right">R{totalBudgeted.toFixed(2)}</td>
                      <td className="px-4 py-3 border-t text-right">R{totalActual.toFixed(2)}</td>
                      <td
                        className={`px-4 py-3 border-t text-right ${
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
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                No budget items found for this event. You can still generate a report with event
                details and feedback.
              </div>
            )}

            {eventCosts.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-indigo-600">
                    R{totalBudgeted.toFixed(2)}
                  </div>
                  <div className="text-gray-600 text-sm">Total Budgeted</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">R{totalActual.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm">Total Actual</div>
                </div>
                <div>
                  <div
                    className={`text-xl font-bold ${
                      savings >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {savings >= 0 ? "+" : ""}R{savings.toFixed(2)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {savings >= 0 ? "Savings" : "Overspent"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        <div>
          <label className="block font-semibold mb-2 text-gray-700">General Feedback</label>
          <textarea
            name="general_feedback"
            value={formData.general_feedback}
            onChange={handleChange}
            rows="4"
            className="w-full border-gray-300 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your feedback about the event, including what went well, challenges, and recommendations."
            required
          />
        </div>

        <div>
          <label className="block font-semibold mb-2 text-gray-700">Report Date</label>
          <input
            type="date"
            name="report_date"
            value={formData.report_date}
            onChange={handleChange}
            className="w-full border-gray-300 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.event_id}
            className="bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving Report..." : "Save Event Report"}
          </button>

          <button
            onClick={generatePDF}
            disabled={pdfLoading || !formData.event_id || !formData.general_feedback.trim()}
            className="bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {pdfLoading ? "Generating PDF..." : "Generate PDF Report"}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            disabled={sendLoading || !formData.event_id || !formData.general_feedback.trim()}
            className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {sendLoading ? "Sending Report..." : "Send Report to Students"}
          </button>
        </div>
      </div>

      {/* Send Report Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Send Report to Students</h3>
            <textarea
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              rows="4"
              className="w-full border-gray-300 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              placeholder="Optional message to students..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={sendReportToStudent}
                disabled={sendLoading}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {sendLoading ? "Sending..." : "Send Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
