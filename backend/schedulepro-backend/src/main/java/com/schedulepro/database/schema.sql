-- ============================================
-- SCHEDULE PRO DATABASE SCHEMA
-- ============================================

-- ===== USERS =====
CREATE TABLE IF NOT EXISTS users (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    phone VARCHAR(20),
    profile_photo TEXT,
    department VARCHAR(100),
    position VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    join_date DATE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== EMPLOYEE DETAILS =====
CREATE TABLE IF NOT EXISTS employee_details (
                                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    alternate_phone VARCHAR(20),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20)
    );

-- ===== DEPARTMENTS =====
CREATE TABLE IF NOT EXISTS departments (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    head_of_dept_id UUID REFERENCES users(id),
    employee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== LEAVE TYPES =====
CREATE TABLE IF NOT EXISTS leave_types (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    max_days_per_year INTEGER,
    carryover_limit INTEGER,
    requires_approval BOOLEAN DEFAULT TRUE
    );

-- ===== SCHEDULES =====
CREATE TABLE IF NOT EXISTS schedules (
                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== LEAVE REQUESTS =====
CREATE TABLE IF NOT EXISTS leave_requests (
                                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== LEAVE BALANCE =====
CREATE TABLE IF NOT EXISTS leave_balance (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    total_days INTEGER DEFAULT 0,
    used_days INTEGER DEFAULT 0,
    carried_over INTEGER DEFAULT 0
    );

-- ===== SWAP REQUESTS =====
CREATE TABLE IF NOT EXISTS swap_requests (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id),
    date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== PROJECTS =====
CREATE TABLE IF NOT EXISTS projects (
                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'PLANNED',
    progress INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== TASKS =====
CREATE TABLE IF NOT EXISTS tasks (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    status VARCHAR(30) DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    feedback TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== TEAM MEMBERS =====
CREATE TABLE IF NOT EXISTS team_members (
                                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES users(id),
    employee_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== INVITATIONS =====
CREATE TABLE IF NOT EXISTS invitations (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'EMPLOYEE',
    department VARCHAR(100),
    position VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING',
    invited_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notifications (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    link VARCHAR(255),
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== ANNOUNCEMENTS =====
CREATE TABLE IF NOT EXISTS announcements (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'GENERAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== ANNOUNCEMENT READS =====
CREATE TABLE IF NOT EXISTS announcement_reads (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== SKILLS =====
CREATE TABLE IF NOT EXISTS skills (
                                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
    );

-- ===== USER SKILLS =====
CREATE TABLE IF NOT EXISTS user_skills (
                                           user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
    );

-- ===== LANGUAGES =====
CREATE TABLE IF NOT EXISTS languages (
                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE
    );

-- ===== USER LANGUAGES =====
CREATE TABLE IF NOT EXISTS user_languages (
                                              user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, language_id)
    );

-- ===== SOCIAL LINKS =====
CREATE TABLE IF NOT EXISTS social_links (
                                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL
    );

-- ===== PROFILE HISTORY =====
CREATE TABLE IF NOT EXISTS profile_history (
                                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== AUDIT LOGS =====
CREATE TABLE IF NOT EXISTS audit_logs (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ===== SYSTEM SETTINGS =====
CREATE TABLE IF NOT EXISTS system_settings (
                                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- ============================================
-- INDEXES (For Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_balance_user ON leave_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_balance_year ON leave_balance(year);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_target ON swap_requests(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);