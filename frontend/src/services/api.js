import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// PUBLIC ENDPOINTS (No JWT Required)
// ============================================
const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/send-otp',
    '/auth/resend-otp',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/verify-password-otp',
    '/auth/reset-password',
     '/auth/me', 

];
// Request interceptor - Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  
  console.log('🔑 Interceptor - Token:', token ? 'YES' : 'NO');
  console.log('🔑 Interceptor - URL:', config.url);
  console.log('🔑 Interceptor - Method:', config.method);
  console.log('🔑 Interceptor - Full URL:', config.baseURL + config.url);
  console.log('🔑 Interceptor - Headers before:', config.headers);
   const isPublic = PUBLIC_ENDPOINTS.some(path => config.url?.includes(path));
    
  if (token && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Interceptor - Authorization header added');
  }
  
  console.log('🔑 Interceptor - Headers after:', config.headers);
  
  return config;
});


// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('employeeprofilePhoto');
      window.location.href = '/login';
      
    }
    return Promise.reject(error);
  }
);

// ============================================
// ✅ AUTH APIS - COMPLETE
// ============================================
export const authApi = {
  // ===== 1. AUTHENTICATION =====
  
  /**
   * Login user
   * @param {Object} data - { email, password }
   */
  login: (data) => api.post('/auth/login', data),
  
  /**
   * Register new user
   * @param {Object} data - { email, password, fullName, role, ... }
   */
  register: (data) => api.post('/auth/register', data),
  
  /**
   * Logout user
   */
  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/logout', { refreshToken });
  },
  
  /**
   * Refresh access token
   */
  refreshToken: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/refresh-token', { refreshToken });
  },
  
  /**
   * Get current user info
   */
  getCurrentUser: () => api.get('/auth/me'),
  
  // ===== 2. OTP MANAGEMENT =====
  
  /**
   * Send OTP to email
   * @param {string} email - User email
   */
  sendOtp: (email) => {
    return api.post('/auth/send-otp', null, {
      params: { email }
    });
  },
  
  /**
   * Verify OTP code
   * @param {Object} data - { email, otp }
   */
  verifyOtp: (data) => {
    return api.post('/auth/verify-otp', data);
  },
  
  /**
   * Resend OTP code
   * @param {string} email - User email
   */
    // ✅ CORRECT: Send as query parameter
  resendOtp: (email) => {
    return api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`);
  },
  // ===== 3. PASSWORD MANAGEMENT =====
  
  /**
   * Request password reset (send OTP)
   * @param {string} email - User email
   */
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },
  
  /**
   * Verify OTP for password reset
   * @param {Object} data - { email, otp }
   */
  verifyPasswordResetOtp: (data) => {
    return api.post('/auth/verify-password-otp', data);
  },
  
  /**
   * Reset password after OTP verification
   * @param {Object} data - { email, otp, newPassword, confirmPassword }
   */
  resetPassword: (data) => {
    return api.post('/auth/reset-password', data);
  },
  
  /**
   * Change password (logged in user)
   * @param {Object} data - { currentPassword, newPassword, confirmPassword }
   */
  changePassword: (data) => {
    return api.post('/auth/change-password', data);
  },
// ===== 4. OAUTH2 =====

/**
 * Redirect to Google OAuth2 login
 * Call this by navigating to: /oauth2/authorization/google
 * Or use the button link in Login page
 */
googleLogin: () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
},

/**
 * Handle OAuth2 redirect - Extract token from URL
 * Used by OAuth2Redirect page
 */
handleOAuth2Redirect: (token) => {
    if (token) {
        localStorage.setItem('accessToken', token);
        return true;
    }
    return false;
},

/**
 * Get user info after OAuth2 login
 * Uses the stored JWT token
 */
getOAuth2User: () => {
    return api.get('/auth/me');
}

};

// ===== EMPLOYEE APIS =====
export const employeeApi = {
  // Dashboard
  getDashboard: () => api.get('/employee/dashboard'),
  
  // Leaves
  getLeaves: () => api.get('/employee/leaves'),
  getLeaveBalance: () => api.get('/employee/leaves/balance'),
  createLeave: (data) => api.post('/employee/leaves', data),
  
  // Tasks
  getTasks: () => api.get('/employee/tasks'),
  updateTaskProgress: (id, progress) => api.put(`/employee/tasks/${id}/progress`, { progress }),
  submitTask: (id) => api.post(`/employee/tasks/${id}/submit`),
  resubmitTask: (id, data) => api.put(`/employee/tasks/${id}/resubmit`, data),
  
  // Schedules
  getSchedules: (view, date) => api.get(`/employee/schedules?view=${view}&date=${date}`),
  getAllSchedules: () => api.get('/employee/schedules'),
  getUpcomingSchedules: () => api.get('/employee/schedules/upcoming'),
  
  // Profile

  // ===== PROFILE PHOTO =====
  uploadProfilePhoto: (photoBase64) => {
    console.log('📸 Uploading photo, length:', photoBase64?.length);
    return api.post('/employee/profile/photo', { photo: photoBase64 });
    
  },
  
  // ✅ ADD THESE PHOTO HISTORY METHODS
  getPhotoHistory: () => api.get('/employee/profile/photo-history'),
  savePhotoHistory: (data) => api.post('/employee/profile/photo-history', data),
  deletePhotoHistory: (id) => api.delete(`/employee/profile/photo-history/${id}`),
  clearPhotoHistory: () => api.delete('/employee/profile/photo-history/clear'),
  revertToPhoto: (id) => api.post(`/employee/profile/photo-history/revert/${id}`),
  
  // ===== PROFILE =====
  getProfile: () => api.get('/employee/profile'),
  updateProfile: (data) => api.put('/employee/profile', data),
    changePassword: (data) => api.post('/employee/profile/change-password', data),
  
  // Invitations
  getInvitations: () => api.get('/employee/invitations'),
  acceptInvitation: (id, data) => api.put(`/employee/invitations/${id}/accept`, data),
  rejectInvitation: (id) => api.put(`/employee/invitations/${id}/reject`),
  getInvitationHistory: () => api.get('/employee/invitations/history'),
  
  // Swaps
  getMySwaps: () => api.get('/employee/swaps'),
  getIncomingSwaps: () => api.get('/employee/swaps/incoming'),
  createSwap: (data) => api.post('/employee/swaps', data),
  acceptSwap: (id) => api.put(`/employee/swaps/${id}/accept`),
  rejectSwap: (id) => api.put(`/employee/swaps/${id}/reject`),
  
  // Projects
  getMyProjects: () => api.get('/employee/projects'),
  getMyProjectById: (id) => api.get(`/employee/projects/${id}`),
  
  // Team
  getTeamMembers: () => api.get('/employee/team-members'),
  
  // ===== NOTIFICATIONS =====
  getNotifications: () => api.get('/employee/notifications'),
  getUnreadCount: () => api.get('/employee/notifications/unread/count'),  // ✅ FIXED: changed from 'unread-count' to 'unread'
  getUnreadNotifications: () => api.get('/employee/notifications/unread'),
  markNotificationRead: (id) => api.put(`/employee/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/employee/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/employee/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/employee/notifications/clear-all'),

  getNotificationsByType: (type) => api.get(`/employee/notifications/type/${type}`),
getRecentNotifications: () => api.get('/employee/notifications/recent'),
markAllByTypeAsRead: (type) => api.put(`/employee/notifications/read-by-type/${type}`),
bulkDeleteNotifications: (ids) => api.delete('/employee/notifications/bulk-delete', { data: ids }),
markAllByEntityAsRead: (entityType) => api.put(`/employee/notifications/read-by-entity/${entityType}`),

  getActiveAnnouncements: () => api.get('/announcements'),
markAnnouncementRead: (id) => api.post(`/announcements/${id}/read`),


};

// ===== MANAGER APIS =====
export const managerApi = {
  // Dashboard
  getDashboardStats: () => api.get('/manager/dashboard/stats'),
  getRecentActivities: () => api.get('/manager/activities'),
  
  // Team
  getTeam: () => api.get('/manager/team'),
  removeTeamMember: (id) => api.delete(`/manager/team/${id}`),
  
  // Leaves
  getPendingLeaves: () => api.get('/manager/leaves/pending'),
  approveLeave: (id, data) => api.put(`/manager/leaves/${id}/approve`, data),
  rejectLeave: (id, data) => api.put(`/manager/leaves/${id}/reject`, data),
  
  // Schedules
  createSchedule: (data) => api.post('/manager/schedules', data),
  getTeamSchedules: (view, date) => api.get(`/manager/schedules?view=${view}&date=${date}`),
  deleteSchedule: (id) => api.delete(`/manager/schedules/${id}`),
  
  // Invitations
  sendInvitation: (data) => api.post('/manager/invitations', data),
  getPendingInvitations: () => api.get('/manager/invitations'),
  getRejectedInvitations: () => api.get('/manager/invitations/rejected'),
  cancelInvitation: (id) => api.delete(`/manager/invitations/${id}`),
  
  // Swaps
  getPendingSwaps: () => api.get('/manager/swaps/pending'),
  approveSwap: (id, data) => api.put(`/manager/swaps/${id}/approve`, data),
  rejectSwap: (id, data) => api.put(`/manager/swaps/${id}/reject`, data),
  
  // Projects
  getProjects: () => api.get('/manager/projects'),
  createProject: (data) => api.post('/manager/projects', data),
  getProjectById: (id) => api.get(`/manager/projects/${id}`),
  updateProject: (id, data) => api.put(`/manager/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/manager/projects/${id}`),
  
  // Tasks
  getTasks: () => api.get('/manager/tasks'),
  getTasksForProject: (projectId) => api.get(`/manager/projects/${projectId}/tasks`),
  createTask: (data) => api.post('/manager/tasks', data),
  approveTask: (id, data) => api.put(`/manager/tasks/${id}/approve`, data),
  rejectTask: (id, data) => api.put(`/manager/tasks/${id}/reject`, data),

   // ✅ ADD THESE NOTIFICATION METHODS
  sendNotificationToTeamMember: (userId, data) => 
    api.post(`/manager/notifications/team/${userId}`, data),
  
  sendNotificationToTeam: (data) => 
    api.post('/manager/notifications/team', data),

  sendScheduleUpdate: (data) => 
  api.post('/manager/notifications/team/schedule-update', data),

sendShiftAssignment: (data) => 
  api.post('/manager/notifications/team/shift-assign', data),

sendAnnouncement: (data) => 
  api.post('/manager/notifications/team/announcement', data),


  // ===== REPORTS =====
  getReports: (period = 'monthly') => api.get(`/manager/reports?period=${period}`),
  exportReportCsv: (period = 'monthly') => api.get(`/manager/reports/export/csv?period=${period}`),

  getActiveAnnouncements: () => api.get('/announcements'),
markAnnouncementRead: (id) => api.post(`/announcements/${id}/read`),


// ===== MANAGER PROFILE APIS =====
getManagerProfile: () => api.get('/manager/profile'),
updateManagerProfile: (data) => api.put('/manager/profile', data),
uploadManagerPhoto: (photo) => api.post('/manager/profile/photo', { photo }),
getManagerStats: () => api.get('/manager/profile/stats'),

getProfile: () => api.get('/manager/profile'),
updateProfile: (data) => api.put('/manager/profile', data),
uploadProfilePhoto: (photoBase64) => {
  console.log('📸 Manager uploading photo, length:', photoBase64?.length);
  return api.post('/manager/profile/photo', { photo: photoBase64 });
},


};

// ===== ADMIN APIS =====
export const adminApi = {
 

// ===== DASHBOARD =====

getDashboardStats: () => api.get('/admin/dashboard/stats'),
  // ===== USERS =====
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getUsersByRole: (role) => api.get(`/admin/users/role/${role}`),
  getUsersByDepartment: (department) => api.get(`/admin/users/department/${department}`),

  // ===== PROJECTS =====
  getProjects: () => api.get('/admin/projects'),
  getProjectById: (id) => api.get(`/admin/projects/${id}`),
  createProject: (data) => api.post('/admin/projects', data),
  updateProject: (id, data) => api.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  getProjectTasks: (projectId) => api.get(`/admin/projects/${projectId}/tasks`),
  updateProjectStatus: (id, status) => api.put(`/admin/projects/${id}/status`, { status }),

  // ===== SCHEDULES =====
  getSchedules: () => api.get('/admin/schedules'),
  getScheduleById: (id) => api.get(`/admin/schedules/${id}`),
  createSchedule: (data) => api.post('/admin/schedules', data),
  updateSchedule: (id, data) => api.put(`/admin/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/admin/schedules/${id}`),
  getSchedulesByDate: (date) => api.get(`/admin/schedules/date/${date}`),
  getSchedulesByDateRange: (startDate, endDate) => 
    api.get(`/admin/schedules/range?start=${startDate}&end=${endDate}`),
  
  // ===== STATS =====
  getAdminStats: () => api.get('/admin/stats'),
  
  // ===== SYSTEM =====
  getSystemHealth: () => api.get('/admin/health'),
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (data) => api.put('/admin/settings', data),
  
  // ===== AUDIT LOGS =====
  getAuditLogs: () => api.get('/admin/audit/logs'),
  getAuditLogsByUser: (userId) => api.get(`/admin/audit/logs/user/${userId}`),
  
  // ===== DEPARTMENTS =====
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  
  // ===== ANNOUNCEMENTS (Admin can manage all) =====
getAnnouncements: () => api.get('/admin/announcements'),
getAnnouncementsPaginated: (page, size) => api.get(`/admin/announcements/paginated?page=${page}&size=${size}`),
getAnnouncementById: (id) => api.get(`/admin/announcements/${id}`),
createAnnouncement: (data) => api.post('/admin/announcements', data),
updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
toggleAnnouncementStatus: (id) => api.put(`/admin/announcements/${id}/toggle`),

// ===== EMPLOYEE ANNOUNCEMENTS =====
getActiveAnnouncements: () => api.get('/announcements'),
markAnnouncementRead: (id) => api.post(`/announcements/${id}/read`),
getAnnouncementUnreadCount: () => api.get('/announcements/unread/count'),

  
// ===== SWAPS =====
getSwaps: () => api.get('/admin/swaps'),
getPendingSwaps: () => api.get('/admin/swaps/pending'),
approveSwap: (id, data) => api.put(`/admin/swaps/${id}/approve`, data),
rejectSwap: (id, data) => api.put(`/admin/swaps/${id}/reject`, data),
deleteAllSwaps: () => api.delete('/admin/swaps/all'),
deleteSwap: (id) => api.delete(`/admin/swaps/${id}`),
getPendingSwapCount: () => api.get('/admin/swaps/pending-count'),


// ===== TASKS =====
getTasks: () => api.get('/admin/tasks'),
getTaskById: (id) => api.get(`/admin/tasks/${id}`),
getTasksByProject: (projectId) => api.get(`/admin/tasks/project/${projectId}`),
createTask: (data) => api.post('/admin/tasks', data),
updateTask: (id, data) => api.put(`/admin/tasks/${id}`, data),
approveTask: (id, data) => api.put(`/admin/tasks/${id}/approve`, data),
rejectTask: (id, data) => api.put(`/admin/tasks/${id}/reject`, data),
deleteTask: (id) => api.delete(`/admin/tasks/${id}`),
getTaskStats: () => api.get('/admin/tasks/stats'),

// ===== REPORTS =====
getReport: (startDate, endDate) => {
    let url = '/admin/reports';
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
},
exportReportJson: (startDate, endDate) => {
    let url = '/admin/reports/export/json';
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url, { responseType: 'blob' });
},
exportReportCsv: (startDate, endDate) => {
    let url = '/admin/reports/export/csv';
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url, { responseType: 'blob' });
},

// ===== PROFILE =====
getProfile: () => api.get('/admin/profile'),
updateProfile: (data) => api.put('/admin/profile', data),
uploadProfilePhoto: (photo) => api.post('/admin/profile/photo', { photo }),
changePassword: (data) => api.post('/admin/profile/change-password', data),
getPhotoHistory: () => api.get('/admin/profile/photo-history'),
savePhotoHistory: (data) => api.post('/admin/profile/photo-history', data),
deletePhotoHistory: (id) => api.delete(`/admin/profile/photo-history/${id}`),
clearPhotoHistory: () => api.delete('/admin/profile/photo-history/clear'),
revertToPhoto: (id) => api.post(`/admin/profile/photo-history/revert/${id}`),



// ===== NOTIFICATIONS =====
getNotifications: () => api.get('/admin/notifications'),
getUserNotifications: (userId) => api.get(`/admin/notifications/user/${userId}`),
getNotificationsByType: (type) => api.get(`/admin/notifications/type/${type}`),
broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
getNotificationStats: () => api.get('/admin/notifications/stats'),
deleteAllNotifications: () => api.delete('/admin/notifications/all'),
deleteUserNotifications: (userId) => api.delete(`/admin/notifications/user/${userId}`),

getNotificationsByDateRange: (startDate, endDate) => 
  api.get(`/admin/notifications/date-range?startDate=${startDate}&endDate=${endDate}`),

broadcastToRole: (role, data) => 
  api.post(`/admin/notifications/broadcast/role/${role}`, data),

broadcastToUser: (userId, data) => 
  api.post(`/admin/notifications/broadcast/user/${userId}`, data),

markNotificationAsRead: (id) => 
  api.put(`/admin/notifications/${id}/read`),

getUnreadCount: () => 
  api.get('/admin/notifications/unread/count'),

getTopUsersWithNotifications: (limit = 10) => 
  api.get(`/admin/notifications/top-users?limit=${limit}`),

getNotificationTypeDistribution: () => 
  api.get('/admin/notifications/types/distribution'),

deleteNotificationsOlderThan: (days) => 
  api.delete(`/admin/notifications/cleanup/${days}`),

searchNotifications: (keyword, type, page = 0, size = 20) => {
  let url = `/admin/notifications/search?page=${page}&size=${size}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (type) url += `&type=${type}`;
  return api.get(url);
},

};

export default api;