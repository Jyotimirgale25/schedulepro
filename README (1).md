

# 📅 Schedule Pro - Enterprise Schedule Management System

A complete, production-ready employee schedule management system built with Spring Boot and React.

# 🚀 Overview

Schedule Pro is an enterprise-grade employee scheduling and project management system designed to streamline workforce management. It provides role-based dashboards for Admins, Managers, and Employees, enabling efficient schedule creation, leave management, task tracking, and team collaboration.

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Google OAuth2 login
- OTP email verification for registration
- Role-based access control (Admin, Manager, Employee)
- Password reset with OTP

### 👥 Role-Based Dashboards

#### 👑 Admin Dashboard
- Full user management (CRUD, roles, status)
- Department management
- Company-wide schedule oversight
- Project & task management
- Broadcast notifications
- Announcement management

#### 👔 Manager Dashboard
- Team member management
- Leave approval/rejection workflow
- Schedule creation for team members
- Shift swap approval
- Project & task assignment
- Team performance reports

#### 👤 Employee Dashboard
- Personal schedule view
- Leave application with balance tracking
- Shift swap requests
- Task management with progress tracking
- Task submission for review
- Profile management with photo upload
- Announcements & notifications

### 📋 Core Modules
- **Schedule Management**: Create, view, and manage employee schedules
- **Leave Management**: Apply, approve, and track leaves with balance
- **Shift Swaps**: Request and approve shift swaps
- **Project Management**: Create and manage projects
- **Task Management**: Assign, track, and approve tasks
- **Notifications**: Real-time in-app notifications (SSE)
- **Announcements**: Company-wide announcements with read tracking
- **Reports**: Generate and export team reports (CSV)
- **Profile**: User profile with photo upload and crop

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 | Core language |
| Spring Boot | 3.1.5 | Framework |
| Spring Security | 6.1.5 | Authentication & Authorization |
| Spring Data JPA | 3.1.5 | ORM & Database operations |
| PostgreSQL | 14+ | Database |
| JWT | 0.12.3 | Token-based authentication |
| OAuth2 | 6.1.5 | Google OAuth2 login |
| Maven | 3.9+ | Build tool |
| Lombok | 1.18.30 | Boilerplate reduction |
| Thymeleaf | 3.1.2 | Email templates |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| React Router | 6.15.0 | Routing |
| Axios | 1.5.0 | HTTP client |
| React Image Crop | 10.1.5 | Profile photo cropping |
| CSS3 | - | Styling |

### Database Schema
- 18+ tables
- Proper relationships (One-to-Many, Many-to-One)
- Indexes for performance optimization


---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17** or higher
- **Maven 3.9+**
- **Node.js 18+** and **npm 9+**
- **PostgreSQL 14+**
- **Git** (for cloning)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/schedulepro.git
cd schedulepro


