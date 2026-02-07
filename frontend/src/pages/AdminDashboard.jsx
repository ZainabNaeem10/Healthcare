import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Fetch pending doctors
  const fetchPendingDoctors = async () => {
    try {
      const res = await api.get("/api/admin/doctors/pending");
      setPendingDoctors(res.data);
    } catch (err) {
      alert("Failed to load pending doctors");
    }
  };

  // Approve doctor
  const approveDoctor = async (doctorId) => {
    try {
      await api.put(`/api/admin/doctors/approve/${doctorId}`);
      alert("Doctor approved");
      fetchPendingDoctors();
    } catch (err) {
      alert("Approval failed");
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/api/admin/analytics");
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🛠️ Admin Dashboard</h2>

      {/* Pending Doctors */}
      <h3>⏳ Pending Doctor Approvals</h3>
      {pendingDoctors.length === 0 ? (
        <p>No pending doctors</p>
      ) : (
        <ul>
          {pendingDoctors.map((doc) => (
            <li key={doc._id}>
              Dr. {doc.userId.name} ({doc.specialization})
              <button
                style={{ marginLeft: 10 }}
                onClick={() => approveDoctor(doc._id)}
              >
                Approve
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Analytics */}
      <h3>📊 Platform Analytics</h3>
      {analytics ? (
        <ul>
          <li>Total Users: {analytics.totalUsers}</li>
          <li>Total Doctors: {analytics.totalDoctors}</li>
          <li>Total Appointments: {analytics.totalAppointments}</li>
        </ul>
      ) : (
        <p>Loading analytics...</p>
      )}
    </div>
  );
}
