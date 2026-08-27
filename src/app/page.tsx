"use client";

import React, { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:7000/api/v1";

interface Patient {
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  bloodGroup: string;
}

interface Doctor {
  doctorId: string;
  name: string;
  specialization: string;
  qualifications: string;
  contactNumber: string;
  email: string;
  availableDays: string[];
}

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  patientId: string;
  doctorId: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

const formatTimeTo12Hour = (timeString: string): string => {
  if (!timeString) return "";
  if (/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(timeString)) {
    return timeString;
  }
  const match = timeString.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/);
  if (!match) return timeString;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes} ${ampm}`;
};

const formatTimeTo24Hour = (timeString12h: string): string => {
  if (!timeString12h) return "";
  const match = timeString12h.match(/^(0[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/);
  if (!match) return "";
  const [_, hoursStr, minutes, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  if (ampm === "PM" && hours < 12) {
    hours += 12;
  }
  if (ampm === "AM" && hours === 12) {
    hours = 0;
  }
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes}`;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "patients" | "doctors" | "appointments">("dashboard");
  
  // Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Loading & UI States
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Image caching buster
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  // Search filter
  const [searchPatientId, setSearchPatientId] = useState("");

  // Modals state
  const [patientModal, setPatientModal] = useState<{ open: boolean; editMode: boolean; data?: Patient | null }>({
    open: false,
    editMode: false,
    data: null,
  });
  
  const [doctorModal, setDoctorModal] = useState<{ open: boolean; editMode: boolean; data?: Doctor | null }>({
    open: false,
    editMode: false,
    data: null,
  });

  const [appointmentModal, setAppointmentModal] = useState<{ open: boolean; editMode: boolean; data?: Appointment | null }>({
    open: false,
    editMode: false,
    data: null,
  });

  // Form Ref / Inputs State
  // Patients Form Refs
  const pIdRef = useRef<HTMLInputElement>(null);
  const pNameRef = useRef<HTMLInputElement>(null);
  const pDobRef = useRef<HTMLInputElement>(null);
  const pGenderRef = useRef<HTMLSelectElement>(null);
  const pContactRef = useRef<HTMLInputElement>(null);
  const pEmailRef = useRef<HTMLInputElement>(null);
  const pAddressRef = useRef<HTMLInputElement>(null);
  const pBloodRef = useRef<HTMLSelectElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Doctors Form Refs
  const dNameRef = useRef<HTMLInputElement>(null);
  const dSpecRef = useRef<HTMLInputElement>(null);
  const dQualRef = useRef<HTMLInputElement>(null);
  const dContactRef = useRef<HTMLInputElement>(null);
  const dEmailRef = useRef<HTMLInputElement>(null);
  const [dAvailableDays, setDAvailableDays] = useState<string[]>([]);

  // Appointments Form Refs
  const aDateRef = useRef<HTMLInputElement>(null);
  const aTimeRef = useRef<HTMLInputElement>(null);
  const aPatientIdRef = useRef<HTMLSelectElement>(null);
  const aDoctorIdRef = useRef<HTMLSelectElement>(null);
  const aStatusRef = useRef<HTMLSelectElement>(null);
  const aNotesRef = useRef<HTMLTextAreaElement>(null);

  // Helper for notification toasts
  const triggerNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch data
  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE}/patients`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      }
    } catch (e) {
      console.error("Error fetching patients", e);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (e) {
      console.error("Error fetching doctors", e);
    }
  };

  const fetchAppointments = async (patientIdFilter = "") => {
    try {
      let url = `${API_BASE}/appointments`;
      if (patientIdFilter.trim() !== "") {
        url += `?patientId=${encodeURIComponent(patientIdFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (e) {
      console.error("Error fetching appointments", e);
    }
  };

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPatients(), fetchDoctors(), fetchAppointments()]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Update appointment search triggers
  useEffect(() => {
    fetchAppointments(searchPatientId);
  }, [searchPatientId]);

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit Patient
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      const pId = patientModal.editMode ? patientModal.data?.patientId : pIdRef.current?.value;
      const name = pNameRef.current?.value || "";
      const dob = pDobRef.current?.value || "";
      const gender = pGenderRef.current?.value || "";
      const contact = pContactRef.current?.value || "";
      const email = pEmailRef.current?.value || "";
      const address = pAddressRef.current?.value || "";
      const blood = pBloodRef.current?.value || "";

      if (!patientModal.editMode && !pId) {
        triggerNotification("error", "Patient ID (NIC) is required.");
        setLoading(false);
        return;
      }

      if (!patientModal.editMode && !photoFile) {
        triggerNotification("error", "Photo is required for registration.");
        setLoading(false);
        return;
      }

      // Fields
      if (!patientModal.editMode && pId) {
        formData.append("patientId", pId);
      }
      formData.append("name", name);
      formData.append("dateOfBirth", dob);
      formData.append("gender", gender);
      formData.append("contactNumber", contact);
      formData.append("email", email);
      formData.append("address", address);
      formData.append("bloodGroup", blood);
      
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const url = patientModal.editMode 
        ? `${API_BASE}/patients/${pId}` 
        : `${API_BASE}/patients`;
        
      const method = patientModal.editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      if (res.ok) {
        triggerNotification("success", `Patient successfully ${patientModal.editMode ? "updated" : "registered"}!`);
        setPatientModal({ open: false, editMode: false, data: null });
        setPhotoFile(null);
        setPhotoPreview(null);
        setCacheBuster(Date.now()); // Bust patient image caches
        fetchPatients();
      } else {
        const err = await res.json();
        triggerNotification("error", err.message || `Failed to ${patientModal.editMode ? "update" : "register"} patient.`);
      }
    } catch (e) {
      triggerNotification("error", "Network connection failed. Make sure Patient-Service is running.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Patient
  const handlePatientDelete = async (patientId: string) => {
    if (!confirm(`Are you sure you want to delete patient ${patientId}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/${patientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        triggerNotification("success", "Patient deleted successfully.");
        fetchPatients();
      } else {
        triggerNotification("error", "Failed to delete patient. Ensure no active appointments depend on this record.");
      }
    } catch (e) {
      triggerNotification("error", "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Doctor
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const name = dNameRef.current?.value || "";
    const specialization = dSpecRef.current?.value || "";
    const qualifications = dQualRef.current?.value || "";
    const contact = dContactRef.current?.value || "";
    const email = dEmailRef.current?.value || "";

    if (dAvailableDays.length === 0) {
      triggerNotification("error", "Please select at least one available day.");
      setLoading(false);
      return;
    }

    const payload = {
      name,
      specialization,
      qualifications,
      contactNumber: contact,
      email,
      availableDays: dAvailableDays,
    };

    try {
      const url = doctorModal.editMode 
        ? `${API_BASE}/doctors/${doctorModal.data?.doctorId}` 
        : `${API_BASE}/doctors`;
      const method = doctorModal.editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerNotification("success", `Doctor successfully ${doctorModal.editMode ? "updated" : "added"}!`);
        setDoctorModal({ open: false, editMode: false, data: null });
        setDAvailableDays([]);
        fetchDoctors();
      } else {
        const err = await res.json();
        triggerNotification("error", err.message || "Failed to submit doctor data.");
      }
    } catch (e) {
      triggerNotification("error", "Network connection failed. Make sure Doctor-Service is running.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Doctor
  const handleDoctorDelete = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/doctors/${doctorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        triggerNotification("success", "Doctor deleted successfully.");
        fetchDoctors();
      } else {
        triggerNotification("error", "Failed to delete doctor.");
      }
    } catch (e) {
      triggerNotification("error", "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Appointment
  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const date = aDateRef.current?.value || "";
    const rawTime = aTimeRef.current?.value || "";
    const time = formatTimeTo12Hour(rawTime);
    const patientId = aPatientIdRef.current?.value || "";
    const doctorId = aDoctorIdRef.current?.value || "";
    const status = aStatusRef.current?.value || "SCHEDULED";
    const notes = aNotesRef.current?.value || "";

    const payload = {
      appointmentDate: date,
      appointmentTime: time,
      patientId,
      doctorId,
      status,
      notes,
    };

    try {
      const url = appointmentModal.editMode 
        ? `${API_BASE}/appointments/${appointmentModal.data?.id}` 
        : `${API_BASE}/appointments`;
      const method = appointmentModal.editMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerNotification("success", `Appointment successfully ${appointmentModal.editMode ? "rescheduled" : "booked"}!`);
        setAppointmentModal({ open: false, editMode: false, data: null });
        fetchAppointments();
      } else {
        const err = await res.json();
        triggerNotification("error", err.message || "Failed to book appointment.");
      }
    } catch (e) {
      triggerNotification("error", "Network connection failed. Make sure Appointment-Service is running.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Appointment
  const handleAppointmentDelete = async (id: number) => {
    if (!confirm("Are you sure you want to cancel and delete this appointment?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        triggerNotification("success", "Appointment cancelled and deleted.");
        fetchAppointments();
      } else {
        triggerNotification("error", "Failed to cancel appointment.");
      }
    } catch (e) {
      triggerNotification("error", "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  // Available days selection toggler
  const handleDayCheckboxChange = (day: string) => {
    if (dAvailableDays.includes(day)) {
      setDAvailableDays(dAvailableDays.filter((d) => d !== day));
    } else {
      setDAvailableDays([...dAvailableDays, day]);
    }
  };

  const getDoctorName = (id: string) => {
    const doc = doctors.find((d) => d.doctorId === id);
    return doc ? doc.name : id;
  };

  const getPatientName = (id: string) => {
    const pat = patients.find((p) => p.patientId === id);
    return pat ? pat.name : id;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar navigation */}
      <div className="sidebar">
        <div className="logo-section">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 10.5V14c0 2.2-1.8 4-4 4h-2v2c0 1.1-.9 2-2 2s-2-.9-2-2v-2H7c-2.2 0-4-1.8-4-4v-3.5c0-1.4 1.1-2.5 2.5-2.5H16.5c1.4 0 2.5 1.1 2.5 2.5z" fill="#10b981" />
            <path d="M12 2C9.8 2 8 3.8 8 6v2h8V6c0-2.2-1.8-4-4-4z" fill="#06b6d4" />
          </svg>
          <span className="logo-text">MEDIX PORTAL</span>
        </div>
        
        <div className="sidebar-nav">
          <button 
            className={`sidebar-link ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => setActiveTab("patients")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Patients
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => setActiveTab("doctors")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.8 2.2c0-.7.6-1.2 1.2-1.2h12c.7 0 1.2.5 1.2 1.2v3.6c0 .7-.5 1.2-1.2 1.2H6c-.7 0-1.2-.5-1.2-1.2V2.2zM2 14c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v8H2v-8z" />
            </svg>
            Doctors
          </button>
          
          <button 
            className={`sidebar-link ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Appointments
          </button>
        </div>

        <div style={{ marginTop: "auto", padding: "10px", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <p>Logged in as: Lahiru Mudith</p>
          <p>Project: CMS Dashboard</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {loading && (
          <div style={{
            position: "fixed", top: 20, right: 20, background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)", color: "#a7f3d0", padding: "10px 20px", 
            borderRadius: "8px", zIndex: 2000, fontSize: "0.85rem", display: "flex", gap: "8px", alignItems: "center"
          }}>
            <svg style={{ animation: "spinAround 1s linear infinite" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10"/>
            </svg>
            Synchronizing Cloud Microservices...
          </div>
        )}

        {/* Notification Toasts */}
        {notification && (
          <div className={`notification-toast ${notification.type === "success" ? "notification-success" : "notification-error"}`}>
            {notification.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Active Tab Contents */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in">
            <div className="tab-header-row">
              <div>
                <h1 className="tab-title">Executive Dashboard</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>System Overview & Quick Stats</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="glass-panel stat-card">
                <div>
                  <p className="stat-title">Total Patients</p>
                  <p className="stat-value">{patients.length}</p>
                </div>
                <div className="stat-icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <p className="stat-title">Active Doctors</p>
                  <p className="stat-value">{doctors.length}</p>
                </div>
                <div className="stat-icon-box" style={{ background: "rgba(6, 182, 212, 0.1)", color: "var(--secondary)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
                  </svg>
                </div>
              </div>

              <div className="glass-panel stat-card">
                <div>
                  <p className="stat-title">Scheduled Sessions</p>
                  <p className="stat-value">{appointments.filter(a => a.status === "SCHEDULED").length}</p>
                </div>
                <div className="stat-icon-box" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "30px", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "20px" }}>Quick Clinical Actions</h2>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={() => setPatientModal({ open: true, editMode: false, data: null })}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Register New Patient
                </button>
                <button className="btn btn-secondary" onClick={() => setDoctorModal({ open: true, editMode: false, data: null })}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Medical Officer
                </button>
                <button className="btn btn-secondary" onClick={() => setAppointmentModal({ open: true, editMode: false, data: null })}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                  Book New Appointment
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "30px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "20px" }}>Upcoming Consultations</h2>
              {appointments.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No consultations scheduled at the moment.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Patient</th>
                        <th>Assigned Doctor</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 5).map((app) => (
                        <tr key={app.id}>
                          <td>{app.appointmentDate} at {app.appointmentTime}</td>
                          <td style={{ fontWeight: 500 }}>{getPatientName(app.patientId)}</td>
                          <td>{getDoctorName(app.doctorId)}</td>
                          <td>
                            <span className={`badge badge-${app.status.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>{app.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "patients" && (
          <div className="animate-fade-in">
            <div className="tab-header-row">
              <div>
                <h1 className="tab-title">Patient Registries</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>Manage patient details and medical records</p>
              </div>
              <button className="btn btn-primary" onClick={() => setPatientModal({ open: true, editMode: false, data: null })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Register Patient
              </button>
            </div>

            {patients.length === 0 ? (
              <div className="glass-panel" style={{ padding: "60px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No patients registered yet. Add your first patient to begin.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {patients.map((p) => (
                  <div key={p.patientId} className="glass-panel data-card">
                    <div className="card-header">
                      {p.patientId ? (
                        <img 
                          src={`${API_BASE}/patients/${p.patientId}/photo?t=${cacheBuster}`} 
                          alt={p.name}
                          className="card-avatar"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            const placeholder = (e.target as HTMLElement).nextElementSibling;
                            if (placeholder) (placeholder as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div className="card-avatar-placeholder" style={{ display: "none" }}>
                        {p.name.charAt(0)}
                      </div>
                      
                      <div>
                        <h3 className="card-title">{p.name}</h3>
                        <p className="card-subtitle">ID: {p.patientId}</p>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                        </svg>
                        <span>Born: {p.dateOfBirth} ({p.gender})</span>
                      </div>
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{p.contactNumber}</span>
                      </div>
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{p.email}</span>
                      </div>
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{p.address}</span>
                      </div>
                      <div className="card-row" style={{ marginTop: "6px" }}>
                        <span className="badge" style={{ background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", fontSize: "0.7rem" }}>
                          Blood Group: {p.bloodGroup}
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        onClick={() => setPatientModal({ open: true, editMode: true, data: p })}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        onClick={() => handlePatientDelete(p.patientId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "doctors" && (
          <div className="animate-fade-in">
            <div className="tab-header-row">
              <div>
                <h1 className="tab-title">Medical Officers</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>Add, edit, and organize clinic doctors schedules</p>
              </div>
              <button className="btn btn-primary" onClick={() => setDoctorModal({ open: true, editMode: false, data: null })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Doctor
              </button>
            </div>

            {doctors.length === 0 ? (
              <div className="glass-panel" style={{ padding: "60px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No doctors registered yet. Add your first medical officer.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {doctors.map((d) => (
                  <div key={d.doctorId} className="glass-panel data-card">
                    <div className="card-header">
                      <div className="card-avatar-placeholder" style={{ display: "flex", background: "rgba(6, 182, 212, 0.1)", color: "var(--secondary)" }}>
                        MD
                      </div>
                      <div>
                        <h3 className="card-title">{d.name}</h3>
                        <p className="card-subtitle" style={{ color: "var(--secondary)" }}>{d.specialization}</p>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Qualifications: {d.qualifications}</span>
                      </div>
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>{d.contactNumber}</span>
                      </div>
                      <div className="card-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span>{d.email}</span>
                      </div>
                      
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Available Days:</p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {d.availableDays.map((day) => (
                            <span key={day} className="badge" style={{ background: "rgba(6, 182, 212, 0.08)", color: "var(--secondary)", fontSize: "0.65rem" }}>
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        onClick={() => {
                          setDoctorModal({ open: true, editMode: true, data: d });
                          setDAvailableDays(d.availableDays);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        onClick={() => handleDoctorDelete(d.doctorId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="animate-fade-in">
            <div className="tab-header-row">
              <div>
                <h1 className="tab-title">Consultation Schedules</h1>
                <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>Schedule, update, and track patient appointments</p>
              </div>
              <button className="btn btn-primary" onClick={() => setAppointmentModal({ open: true, editMode: false, data: null })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                </svg>
                Book Appointment
              </button>
            </div>

            <div className="glass-panel" style={{ padding: "24px", marginBottom: "30px", display: "flex", gap: "16px", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                type="text" 
                className="form-input" 
                style={{ background: "transparent", border: "none", padding: 0 }}
                placeholder="Search appointments by Patient NIC..."
                value={searchPatientId}
                onChange={(e) => setSearchPatientId(e.target.value)}
              />
              {searchPatientId && (
                <button 
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  onClick={() => setSearchPatientId("")}
                >
                  Clear
                </button>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="glass-panel" style={{ padding: "60px", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No appointments found. Book your first appointment to see it here.</p>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: "20px" }}>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((app) => (
                        <tr key={app.id}>
                          <td>{app.appointmentDate} at {app.appointmentTime}</td>
                          <td style={{ fontWeight: 500 }}>
                            <div>{getPatientName(app.patientId)}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NIC: {app.patientId}</div>
                          </td>
                          <td>
                            <div>{getDoctorName(app.doctorId)}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${app.status.toLowerCase()}`}>
                              {app.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {app.notes || "—"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                onClick={() => setAppointmentModal({ open: true, editMode: true, data: app })}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                onClick={() => handleAppointmentDelete(app.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Patient Form Modal */}
      {patientModal.open && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h2 className="modal-title">{patientModal.editMode ? "Modify Patient Profile" : "Register New Patient"}</h2>
              <button 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                onClick={() => {
                  setPatientModal({ open: false, editMode: false, data: null });
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePatientSubmit}>
              <div className="form-group">
                <label className="form-label">Profile Image</label>
                <div className="image-preview-box" onClick={() => document.getElementById("photo-upload-input")?.click()}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="preview-image" />
                  ) : patientModal.editMode && patientModal.data?.patientId ? (
                    <img src={`${API_BASE}/patients/${patientModal.data.patientId}/photo?t=${cacheBuster}`} alt="Current" className="preview-image" />
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: "8px" }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click to upload image</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  id="photo-upload-input" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={handlePhotoChange} 
                />
              </div>

              {!patientModal.editMode && (
                <div className="form-group">
                  <label className="form-label">Patient ID (National Identity Card NIC)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 716500500V or 200614502538" 
                    ref={pIdRef}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. John Doe" 
                  ref={pNameRef}
                  defaultValue={patientModal.data?.name || ""}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    ref={pDobRef}
                    defaultValue={patientModal.data?.dateOfBirth || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select" 
                    ref={pGenderRef}
                    defaultValue={patientModal.data?.gender || "Male"}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 0771234567" 
                    ref={pContactRef}
                    defaultValue={patientModal.data?.contactNumber || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select 
                    className="form-select" 
                    ref={pBloodRef}
                    defaultValue={patientModal.data?.bloodGroup || "O+"}
                    required
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. john@example.com" 
                  ref={pEmailRef}
                  defaultValue={patientModal.data?.email || ""}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 45 Galle Road, Colombo" 
                  ref={pAddressRef}
                  defaultValue={patientModal.data?.address || ""}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setPatientModal({ open: false, editMode: false, data: null });
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {patientModal.editMode ? "Update Details" : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Form Modal */}
      {doctorModal.open && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h2 className="modal-title">{doctorModal.editMode ? "Modify Doctor Record" : "Add New Medical Officer"}</h2>
              <button 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                onClick={() => {
                  setDoctorModal({ open: false, editMode: false, data: null });
                  setDAvailableDays([]);
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit}>
              <div className="form-group">
                <label className="form-label">Doctor Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Dr. Jane Watson" 
                  ref={dNameRef}
                  defaultValue={doctorModal.data?.name || ""}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Pediatrician, Cardiologist" 
                  ref={dSpecRef}
                  defaultValue={doctorModal.data?.specialization || ""}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Academic Qualifications</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MBBS, MD, FRCP" 
                  ref={dQualRef}
                  defaultValue={doctorModal.data?.qualifications || ""}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 0777123456" 
                    ref={dContactRef}
                    defaultValue={doctorModal.data?.contactNumber || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. doctor@medix.com" 
                    ref={dEmailRef}
                    defaultValue={doctorModal.data?.email || ""}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Schedule Availability</label>
                <div className="days-checkbox-grid">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <label key={day} className="day-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={dAvailableDays.includes(day)} 
                        onChange={() => handleDayCheckboxChange(day)} 
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setDoctorModal({ open: false, editMode: false, data: null });
                    setDAvailableDays([]);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {doctorModal.editMode ? "Update Doctor" : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Form Modal */}
      {appointmentModal.open && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-content animate-fade-in">
            <div className="modal-header">
              <h2 className="modal-title">{appointmentModal.editMode ? "Reschedule Consultation" : "Schedule New Consultation"}</h2>
              <button 
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                onClick={() => setAppointmentModal({ open: false, editMode: false, data: null })}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAppointmentSubmit}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select 
                  className="form-select" 
                  ref={aPatientIdRef}
                  defaultValue={appointmentModal.data?.patientId || ""}
                  required
                >
                  <option value="" disabled>Choose a patient...</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} (NIC: {p.patientId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Medical Specialist</label>
                <select 
                  className="form-select" 
                  ref={aDoctorIdRef}
                  defaultValue={appointmentModal.data?.doctorId || ""}
                  required
                >
                  <option value="" disabled>Choose a doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    ref={aDateRef}
                    defaultValue={appointmentModal.data?.appointmentDate || ""}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Session Time Slot</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    ref={aTimeRef}
                    defaultValue={formatTimeTo24Hour(appointmentModal.data?.appointmentTime || "")}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Schedules Status</label>
                  <select 
                    className="form-select" 
                    ref={aStatusRef}
                    defaultValue={appointmentModal.data?.status || "SCHEDULED"}
                    required
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Medical Case Notes (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  placeholder="Describe patient concerns, symptoms, or instructions..."
                  ref={aNotesRef}
                  defaultValue={appointmentModal.data?.notes || ""}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "30px" }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setAppointmentModal({ open: false, editMode: false, data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {appointmentModal.editMode ? "Reschedule Appointment" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
