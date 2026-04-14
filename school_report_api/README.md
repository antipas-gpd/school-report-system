# 🏫 School Report Management System — REST API

A production-ready Django REST API for managing school reports with role-based access control, JWT authentication, and AI-powered comments.

---

## 📁 Project Structure

```
school_report_api/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
│
├── school_report/              # Django project (settings, urls, wsgi)
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── core/                       # Models, Admin, Migrations
│   ├── models.py               #   User, Student, Subject, Mark, Attendance, Fee, Report
│   ├── admin.py
│   ├── apps.py
│   ├── migrations/
│   │   └── 0001_initial.py
│   └── management/
│       └── commands/
│           └── seed_demo_data.py
│
└── api/                        # REST API layer
    ├── urls.py                 #   All routes
    ├── views.py                #   ViewSets + APIViews
    ├── serializers.py          #   All serializers
    ├── permissions.py          #   Role-based permissions
    └── ai_comments.py          #   AI comment generator
```

---

## ⚙️ Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | Django 4.2 + Django REST Framework |
| Auth         | JWT via SimpleJWT                 |
| Database     | PostgreSQL                        |
| CORS         | django-cors-headers               |
| Config       | python-decouple                   |

---

## 👥 User Roles

| Role    | Access                                                           |
|---------|------------------------------------------------------------------|
| Admin   | Full access, approve reports, track report generation            |
| Teacher | Record marks, attendance, generate reports, add comments         |
| Bursar  | Manage fees (total, paid, balance)                               |
| Parent  | View reports **only if fees are fully paid**                     |

---

## 🚀 Quick Start

### 1. Clone & set up environment

```bash
git clone <repo-url>
cd school_report_api

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials and secret key
```

### 3. Create PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE school_report_db;
\q
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Seed demo data

```bash
python manage.py seed_demo_data
```

This creates:
- 6 users (1 admin, 2 teachers, 1 bursar, 2 parents)
- 5 students with marks, attendance, and fee records
- Student S002 has **unpaid fees** → parent locked out of report

### 6. Start the server

```bash
python manage.py runserver
```

API available at: **http://127.0.0.1:8000/api/**

---

## 🔐 Authentication

All endpoints require a **Bearer JWT token**.

### Login

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "headmaster",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use the access token in all subsequent requests:

```http
Authorization: Bearer <access_token>
```

### Refresh Token

```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

---

## 📡 API Endpoints

### Auth

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/login/`    | Obtain JWT tokens    |
| POST   | `/api/auth/refresh/`  | Refresh access token |

---

### Users `[Admin only]`

| Method | Endpoint          | Description       |
|--------|-------------------|-------------------|
| GET    | `/api/users/`     | List all users    |
| POST   | `/api/users/`     | Create user       |
| GET    | `/api/users/{id}/`| Get user detail   |
| PUT    | `/api/users/{id}/`| Update user       |
| DELETE | `/api/users/{id}/`| Delete user       |
| GET    | `/api/users/me/`  | Current user info |

**Create User Example:**
```json
POST /api/users/
{
  "username": "mr_kamara",
  "email": "kamara@school.edu",
  "password": "Secure123!",
  "role": "teacher",
  "first_name": "Seku",
  "last_name": "Kamara"
}
```

**Response:**
```json
{
  "id": 7,
  "username": "mr_kamara",
  "email": "kamara@school.edu",
  "first_name": "Seku",
  "last_name": "Kamara",
  "role": "teacher"
}
```

---

### Students `[Admin & Teacher: CRUD | Parent: own children only]`

| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | `/api/students/`      | List students       |
| POST   | `/api/students/`      | Create student      |
| GET    | `/api/students/{id}/` | Get student detail  |
| PUT    | `/api/students/{id}/` | Update student      |
| DELETE | `/api/students/{id}/` | Delete student      |

**Query Params:** `?search=kwame`

**Create Student Example:**
```json
POST /api/students/
{
  "student_id": "S006",
  "first_name": "Ama",
  "last_name": "Owusu",
  "class_name": "Grade 9A",
  "date_of_birth": "2011-04-15",
  "parent": 5
}
```

**Response:**
```json
{
  "id": 6,
  "student_id": "S006",
  "first_name": "Ama",
  "last_name": "Owusu",
  "full_name": "Ama Owusu",
  "date_of_birth": "2011-04-15",
  "class_name": "Grade 9A",
  "parent": 5,
  "parent_detail": {
    "id": 5,
    "username": "parent_alice",
    "email": "alice@gmail.com",
    "role": "parent"
  },
  "created_at": "2026-04-12T09:00:00Z"
}
```

---

### Subjects `[Admin & Teacher: CRUD | Others: read]`

| Method | Endpoint               | Description      |
|--------|------------------------|------------------|
| GET    | `/api/subjects/`       | List subjects    |
| POST   | `/api/subjects/`       | Create subject   |
| GET    | `/api/subjects/{id}/`  | Subject detail   |
| PUT    | `/api/subjects/{id}/`  | Update subject   |
| DELETE | `/api/subjects/{id}/`  | Delete subject   |

---

### Marks `[Admin & Teacher only]`

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/marks/`      | List marks               |
| POST   | `/api/marks/`      | Record mark              |
| GET    | `/api/marks/{id}/` | Mark detail              |
| PUT    | `/api/marks/{id}/` | Update mark              |
| DELETE | `/api/marks/{id}/` | Delete mark              |

**Query Params:** `?student=1&term=Term+1`

**Record Mark Example:**
```json
POST /api/marks/
{
  "student": 1,
  "subject": 2,
  "score": 87,
  "term": "Term 1"
}
```

**Response (grade auto-calculated):**
```json
{
  "id": 10,
  "student": 1,
  "student_name": "Kwame Mensah",
  "subject": 2,
  "subject_detail": {
    "id": 2,
    "code": "ENG",
    "name": "English Language"
  },
  "score": 87.0,
  "grade": "A",
  "term": "Term 1",
  "recorded_by": 2,
  "recorded_by_name": "ms_johnson",
  "created_at": "2026-04-12T09:15:00Z",
  "updated_at": "2026-04-12T09:15:00Z"
}
```

**Grading Scale:**
| Score   | Grade |
|---------|-------|
| 80–100  | A     |
| 65–79   | B     |
| 50–64   | C     |
| 0–49    | D     |

---

### Attendance `[Admin & Teacher only]`

| Method | Endpoint                  | Description           |
|--------|---------------------------|-----------------------|
| GET    | `/api/attendance/`        | List attendance       |
| POST   | `/api/attendance/`        | Record attendance     |
| GET    | `/api/attendance/{id}/`   | Attendance detail     |
| PUT    | `/api/attendance/{id}/`   | Update record         |
| DELETE | `/api/attendance/{id}/`   | Delete record         |

**Query Params:** `?student=1&date=2026-04-12`

**Record Attendance Example:**
```json
POST /api/attendance/
{
  "student": 1,
  "date": "2026-04-12",
  "is_present": false,
  "note": "Sick leave"
}
```

**Response:**
```json
{
  "id": 31,
  "student": 1,
  "student_name": "Kwame Mensah",
  "date": "2026-04-12",
  "is_present": false,
  "recorded_by": 2,
  "recorded_by_name": "ms_johnson",
  "note": "Sick leave"
}
```

---

### Fees `[Admin & Bursar only]`

| Method | Endpoint          | Description     |
|--------|-------------------|-----------------|
| GET    | `/api/fees/`      | List fees       |
| POST   | `/api/fees/`      | Create fee      |
| GET    | `/api/fees/{id}/` | Fee detail      |
| PUT    | `/api/fees/{id}/` | Update fee      |
| PATCH  | `/api/fees/{id}/` | Partial update  |

**Create Fee Example:**
```json
POST /api/fees/
{
  "student": 1,
  "total": 1500.00,
  "paid": 900.00,
  "term": "Term 1"
}
```

**Response:**
```json
{
  "id": 1,
  "student": 1,
  "student_name": "Kwame Mensah",
  "total": "1500.00",
  "paid": "900.00",
  "balance": "600.00",
  "is_fully_paid": false,
  "term": "Term 1",
  "updated_at": "2026-04-12T10:00:00Z"
}
```

---

### Generate Report `[Admin & Teacher generate | Parent views if fees paid]`

```http
GET /api/generate-report/{student_id}/
GET /api/generate-report/{student_id}/?term=Term+1
```

**Success Response (200):**
```json
{
  "report_id": 1,
  "student_id": "S001",
  "student_name": "Kwame Mensah",
  "class_name": "Grade 8A",
  "term": "Term 1",
  "generated_by": "ms_johnson",
  "approved": false,
  "marks": [
    { "subject_code": "ENG",  "subject_name": "English Language", "score": 78.0, "grade": "B" },
    { "subject_code": "GEO",  "subject_name": "Geography",        "score": 88.0, "grade": "A" },
    { "subject_code": "HIST", "subject_name": "History",          "score": 70.0, "grade": "B" },
    { "subject_code": "MATH", "subject_name": "Mathematics",      "score": 85.0, "grade": "A" },
    { "subject_code": "PHY",  "subject_name": "Physical Education","score": 95.0, "grade": "A" },
    { "subject_code": "SCI",  "subject_name": "General Science",  "score": 92.0, "grade": "A" }
  ],
  "total_score": 508.0,
  "average_score": 84.67,
  "attendance_total": 22,
  "attendance_present": 20,
  "attendance_pct": 90.91,
  "fees_total": "1500.00",
  "fees_paid": "1500.00",
  "fees_balance": "0.00",
  "fees_fully_paid": true,
  "ai_comment": "Excellent academic performance with an average of 84.7%. The student demonstrates outstanding understanding of all subjects and is encouraged to maintain this high standard. Attendance is acceptable at 90.9% but there is room for improvement.",
  "teacher_comment": "",
  "created_at": "2026-04-12T10:30:00Z"
}
```

**Parent blocked (fees unpaid) — 402:**
```json
{
  "error": "Access denied.",
  "detail": "Report is locked until school fees are fully paid.",
  "fees_status": {
    "total":   "1500.00",
    "paid":    "600.00",
    "balance": "900.00"
  }
}
```

---

### Approve Report `[Admin only]`

```http
POST /api/approve-report/{report_id}/
```

**Response:**
```json
{
  "message": "Report approved successfully.",
  "report_id": 1,
  "student": "Kwame Mensah",
  "term": "Term 1",
  "approved_by": "headmaster",
  "approved_at": "2026-04-12T11:00:00Z"
}
```

**Already approved:**
```json
{
  "message": "Report is already approved.",
  "approved_by": "headmaster",
  "approved_at": "2026-04-12T11:00:00Z"
}
```

---

### Teacher Comment `[Admin & Teacher]`

```http
PATCH /api/reports/{report_id}/comment/
Content-Type: application/json

{
  "teacher_comment": "Kwame has shown remarkable improvement this term. Keep it up!"
}
```

**Response:**
```json
{
  "message": "Comment updated.",
  "report_id": 1,
  "teacher_comment": "Kwame has shown remarkable improvement this term. Keep it up!"
}
```

---

### Reports List `[Role-filtered]`

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/api/reports/`      | List reports (filtered by role)      |
| GET    | `/api/reports/{id}/` | Report metadata detail               |

---

## 🔒 Security Summary

| Endpoint                          | Admin | Teacher | Bursar | Parent |
|-----------------------------------|-------|---------|--------|--------|
| `POST /api/users/`                | ✅    | ❌      | ❌     | ❌     |
| `GET /api/students/`              | ✅    | ✅      | ✅     | Own only |
| `POST /api/marks/`                | ✅    | ✅      | ❌     | ❌     |
| `POST /api/attendance/`           | ✅    | ✅      | ❌     | ❌     |
| `POST /api/fees/`                 | ✅    | ❌      | ✅     | ❌     |
| `GET /api/generate-report/{id}/`  | ✅    | ✅      | ❌     | If fees paid |
| `POST /api/approve-report/{id}/`  | ✅    | ❌      | ❌     | ❌     |
| `PATCH /api/reports/{id}/comment/`| ✅    | ✅      | ❌     | ❌     |

---

## 🤖 AI Comment Logic

Comments are auto-generated based on average score and attendance:

| Average Score | Comment Tone                                     |
|---------------|--------------------------------------------------|
| ≥ 80          | Excellent — encourage maintaining high standards |
| 65–79         | Good — solid performance, keep going             |
| 50–64         | Satisfactory — room for improvement              |
| < 50          | Struggling — urgent support recommended          |

| Attendance %  | Comment                              |
|---------------|--------------------------------------|
| ≥ 95%         | Excellent attendance                 |
| 80–94%        | Acceptable, room to improve          |
| 60–79%        | Concerning — impacts learning        |
| < 60%         | Critical — must be addressed         |

---

## 🗄️ Demo Login Credentials

After running `python manage.py seed_demo_data`:

| Role    | Username      | Password     | Notes                            |
|---------|---------------|--------------|----------------------------------|
| Admin   | headmaster    | Admin123!    | Full access                      |
| Teacher | ms_johnson    | Teacher123!  | Records marks & attendance       |
| Teacher | mr_osei       | Teacher123!  | Records marks & attendance       |
| Bursar  | bursar_kate   | Bursar123!   | Manages fees                     |
| Parent  | parent_alice  | Parent123!   | S001 paid ✅  /  S002 unpaid ❌  |
| Parent  | parent_bob    | Parent123!   | S003 & S004 paid ✅              |

---

## 🧪 Quick Test Workflow

```bash
# 1. Login as teacher
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"ms_johnson","password":"Teacher123!"}'

# 2. Generate report for student 1 (save token from step 1)
curl http://localhost:8000/api/generate-report/1/ \
  -H "Authorization: Bearer <access_token>"

# 3. Login as admin and approve
curl -X POST http://localhost:8000/api/approve-report/1/ \
  -H "Authorization: Bearer <admin_token>"

# 4. Login as parent_alice — S001 report accessible (fees paid)
curl http://localhost:8000/api/generate-report/1/ \
  -H "Authorization: Bearer <parent_alice_token>"

# 5. Login as parent_alice — S002 report BLOCKED (fees unpaid)
curl http://localhost:8000/api/generate-report/2/ \
  -H "Authorization: Bearer <parent_alice_token>"
# → 402 Payment Required
```
