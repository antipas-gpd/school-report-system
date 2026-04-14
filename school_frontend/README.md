# 🎓 School Report Frontend

React frontend for the School Report Management System.

---

## 📁 Folder Structure

```
school_frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + JWT interceptors
│   │   └── services.js       # All API service functions
│   ├── components/
│   │   ├── Sidebar.js        # Navigation sidebar
│   │   └── ProtectedRoute.js # Role-based route guard
│   ├── context/
│   │   ├── AuthContext.js    # JWT auth state
│   │   └── ThemeContext.js   # Dark/light mode
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js  # Role-aware dashboard
│   │   ├── StudentsPage.js
│   │   ├── MarksPage.js
│   │   ├── AttendancePage.js
│   │   ├── FeesPage.js
│   │   ├── ReportsPage.js
│   │   └── UsersPage.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── .env
└── package.json
```

---

## 🚀 Setup & Run

### 1. Make sure the backend is running

```cmd
cd C:\Users\kuniwa\Downloads\backend\school_report_api
venv\Scripts\activate
python manage.py runserver
```

### 2. Install frontend dependencies

Open a **new terminal**, then:

```cmd
cd C:\Users\kuniwa\Downloads\frontend\school_frontend
npm install
```

### 3. Start the frontend

```cmd
npm start
```

Opens at **http://localhost:3000**

---

## 🔐 Demo Logins

| Role    | Username      | Password     |
|---------|---------------|--------------|
| Admin   | headmaster    | Admin123!    |
| Teacher | ms_johnson    | Teacher123!  |
| Bursar  | bursar_kate   | Bursar123!   |
| Parent  | parent_alice  | Parent123!   |

---

## 🖥️ Pages by Role

| Role    | Pages Available                                    |
|---------|----------------------------------------------------|
| Admin   | Dashboard, Students, Reports, Users                |
| Teacher | Dashboard, Students, Marks, Attendance, Reports    |
| Bursar  | Dashboard, Fees                                    |
| Parent  | Dashboard (report card, fee-gated)                 |

---

## ⚙️ Backend Connection

The frontend connects to `http://127.0.0.1:8000/api` by default.
Change this in `.env` if your backend runs on a different port.
