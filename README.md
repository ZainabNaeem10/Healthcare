# Healthcare Appointment System

A full-stack web application for managing healthcare appointments across three user roles — Patient, Doctor, and Admin. Built with React, Node.js, MongoDB, and FullCalendar integration.

---

## Features

### Patient Portal
- Search doctors by specialization and availability
- Book, reschedule, and cancel appointments via calendar UI
- View prescription history and upcoming appointments
- Automated reminder simulation (email/SMS)

### Doctor Dashboard
- Manage weekly/monthly schedule with calendar integration
- View and manage patient queue
- Generate e-prescriptions (PDF export)
- View patient appointment history

### Admin Panel
- Approve or reject doctor registrations
- Manage clinic information and operational settings
- View analytics dashboard (appointments, doctors, patients)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, FullCalendar / React Big Calendar |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (Role-based: Patient, Doctor, Admin) |
| PDF Generation | (e.g. jsPDF / pdfkit) |
| State Management | Context API / Redux |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ZainabNaeem10/Healthcare.git
cd Healthcare

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Running the App

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in a new terminal)
cd frontend
npm start
```

The app will be available at `http://localhost:3000`.

---

## API Overview

All protected routes require a JWT token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/doctors | Get all doctors | Patient |
| POST | /api/appointments | Book appointment | Patient |
| GET | /api/appointments/:id | Get appointment details | Patient/Doctor |
| PUT | /api/appointments/:id | Update/reschedule | Patient/Doctor |
| DELETE | /api/appointments/:id | Cancel appointment | Patient |
| GET | /api/doctor/schedule | View doctor's schedule | Doctor |
| POST | /api/prescriptions | Create e-prescription | Doctor |
| GET | /api/admin/doctors | Manage doctor registrations | Admin |
| GET | /api/admin/analytics | View analytics dashboard | Admin |

---

## Role-Based Access

```
Patient  → Book appointments, view prescriptions, manage profile
Doctor   → Manage schedule, generate prescriptions, view patient queue
Admin    → Approve doctors, manage clinic, view analytics
```

---

## Key Implementation Details

- **Overlap Prevention**: Appointment booking checks for existing slots before confirming, preventing double-bookings at the database level.
- **JWT Auth**: Tokens issued on login, verified via middleware on all protected routes. Role extracted from token payload to enforce access control.
- **PDF Prescriptions**: Doctors can generate downloadable prescription PDFs per patient visit.
- **Calendar Integration**: FullCalendar or React Big Calendar renders doctor availability and patient bookings in weekly/monthly views.

---

## Project Structure

```
Healthcare/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
└── README.md
```

---

## Author

**Zainab Naeem**  
[GitHub](https://github.com/ZainabNaeem10) · [LinkedIn](https://linkedin.com/in/zainab-naeem-699a38309)
