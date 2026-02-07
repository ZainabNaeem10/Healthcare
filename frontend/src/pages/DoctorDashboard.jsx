import { useEffect, useState } from "react";
import api from "../services/api";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [prescription, setPrescription] = useState({
    appointmentId: "",
    patientId: "",
    medicines: [{ name: "", dosage: "", duration: "" }],
    notes: ""
  });

  // 🔹 Fetch active appointments
  const fetchAppointments = async () => {
    try {
      setError("");
      const res = await api.get("/api/doctor/appointments");
      // Only show CONFIRMED appointments
      const activeAppointments = res.data.filter(a => a.status === "CONFIRMED");
      setAppointments(activeAppointments);
    } catch (err) {
      console.error("Fetch appointments error:", err.message);
      setError("Failed to load appointments");
    }
  };

  // 🔹 Create prescription
  const createPrescription = async () => {
    try {
      setError("");
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        setError("Please login again");
        return;
      }

      const res = await api.post(
        "/api/doctor/prescriptions",
        {
          appointmentId: prescription.appointmentId,
          patientId: prescription.patientId,
          medicines: prescription.medicines,
          notes: prescription.notes
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      alert(res.data.message);

      // Remove the completed appointment
      setAppointments(prev =>
        prev.filter(a => a._id !== prescription.appointmentId)
      );

      setPrescription({
        appointmentId: "",
        patientId: "",
        medicines: [{ name: "", dosage: "", duration: "" }],
        notes: ""
      });
    } catch (err) {
      console.error("Create prescription error:", err.message);
      setError("Failed to create prescription");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🩺 Doctor Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Appointments */}
      <h3>📋 Appointments</h3>
      <ul>
        {appointments.map((a) => (
          <li key={a._id}>
            {a.patientId.name} – {a.date.slice(0, 10)} – {a.startTime} to {a.endTime}
            <button
              style={{ marginLeft: 10 }}
              onClick={() =>
                setPrescription({
                  appointmentId: a._id,
                  patientId: a.patientId._id,
                  medicines: [{ name: "", dosage: "", duration: "" }],
                  notes: ""
                })
              }
            >
              Prescribe
            </button>
          </li>
        ))}
      </ul>

      {/* Prescription Form */}
      {prescription.patientId && (
        <>
          <h3>📝 Create Prescription</h3>

          <input
            placeholder="Medicine Name"
            value={prescription.medicines[0].name}
            onChange={(e) =>
              setPrescription({
                ...prescription,
                medicines: [{ ...prescription.medicines[0], name: e.target.value }]
              })
            }
          />

          <input
            placeholder="Dosage"
            value={prescription.medicines[0].dosage}
            onChange={(e) =>
              setPrescription({
                ...prescription,
                medicines: [{ ...prescription.medicines[0], dosage: e.target.value }]
              })
            }
          />

          <input
            placeholder="Duration"
            value={prescription.medicines[0].duration}
            onChange={(e) =>
              setPrescription({
                ...prescription,
                medicines: [{ ...prescription.medicines[0], duration: e.target.value }]
              })
            }
          />

          <textarea
            placeholder="Notes"
            value={prescription.notes}
            onChange={(e) =>
              setPrescription({ ...prescription, notes: e.target.value })
            }
          />

          <button onClick={createPrescription}>Create Prescription</button>
        </>
      )}
    </div>
  );
}
