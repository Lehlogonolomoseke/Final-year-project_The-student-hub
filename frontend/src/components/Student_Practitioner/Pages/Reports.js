import React, { useState, useEffect } from "react";

export default function View_reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("http://localhost:8000/get_reports.php", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch reports",
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      setMessage({ type: "error", text: "Network error while fetching reports" });
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (reportId) => {
    try {
      await fetch("http://localhost:8000/mark_report_viewed.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ report_id: reportId }),
      });

      setReports((prev) =>
        prev.map((report) =>
          report.report_id === reportId
            ? { ...report, status: "viewed", viewed_at: new Date().toISOString() }
            : report
        )
      );
    } catch (error) {
      console.error("Error marking report as viewed:", error);
    }
  };

  const handleViewPDF = (report) => {
    if (report.status === "sent") markAsViewed(report.report_id);
    window.open(report.pdf_url, "_blank");
  };

  const handleDownloadPDF = (report) => {
    if (report.status === "sent") markAsViewed(report.report_id);
    const link = document.createElement("a");
    link.href = report.pdf_url;
    link.download = `${report.event_name.replace(/[^a-z0-9]/gi, "_")}_Report_${
      report.event_date
    }.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg animate-pulse">⏳ Loading your reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-orange-600">📊 Event Reports</h1>
        <div className="w-24 h-1 bg-orange-500 mx-auto mt-2 rounded-full"></div>
        <p className="mt-3 text-gray-600">Review and download reports shared by administrators</p>
      </div>

      {/* System Messages */}
      {message && (
        <div
          className={`p-3 mb-6 rounded-lg text-sm font-medium ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-7xl mb-4">📭</div>
          <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
          <p className="text-gray-500">
            You haven’t received any event reports from the administrator yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {reports.map((report) => (
            <div
              key={report.report_id}
              className={`bg-white rounded-xl shadow-md p-6 border-l-4 hover:shadow-lg transition ${
                report.status === "sent" ? "border-l-orange-500" : "border-l-green-500"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Report Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold">{report.event_name}</h3>

                    {/* 🔔 Status Badge */}
                    {report.status === "sent" ? (
                      <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full font-medium">
                        🔔 Unread
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                        ✅ Viewed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                    <div>
                      <p>
                        <strong>📅 Event Date:</strong>{" "}
                        {new Date(report.event_date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>👨‍💼 From:</strong> {report.admin_first_name} {report.admin_last_name}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>📨 Sent:</strong> {new Date(report.sent_at).toLocaleDateString()}
                      </p>
                      {report.viewed_at && (
                        <p>
                          <strong>👁️ Viewed:</strong>{" "}
                          {new Date(report.viewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {report.admin_message && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>💬 Message from Admin:</strong>
                      <p className="mt-1 text-gray-700 text-sm">{report.admin_message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleViewPDF(report)}
                      className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
                    >
                      👁️ View PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(report)}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                    >
                      📥 Download PDF
                    </button>
                  </div>
                </div>

                {/* Icon */}
                <div className="text-center md:text-right">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-xs text-gray-500">PDF Report</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Summary */}
      {reports.length > 0 && (
        <div className="mt-12 bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-5">📈 Report Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{reports.length}</div>
              <div className="text-sm text-gray-600">📊 Total Reports</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reports.filter((r) => r.status === "viewed").length}
              </div>
              <div className="text-sm text-gray-600">✅ Viewed</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {reports.filter((r) => r.status === "sent").length}
              </div>
              <div className="text-sm text-gray-600">🔔 Unread</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
