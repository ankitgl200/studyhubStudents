// --- DYNAMIC SCRIPT LOADERS (Performance Optimization) ---
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

function ensureJsPDFLoaded() {
  if (window.jspdf) return Promise.resolve();
  return loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
}

function ensurePuterLoaded() {
  if (window.puter) return Promise.resolve();
  return loadScript("https://js.puter.com/v2/");
}






// --- SKELETON LOADING TEMPLATE GENERATORS ---
function getLeaderboardSkeleton() {
  return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${[1, 2, 3].map(() => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--white); font-size: 13px;">
          <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
            <div class="skeleton" style="width: 24px; height: 16px; border-radius: 4px;"></div>
            <div class="skeleton" style="width: 110px; height: 16px; border-radius: 4px;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getAnnouncementsSkeleton() {
  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${[1, 2].map(() => `
        <div class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 12px;">
          <div class="skeleton" style="width: 45%; height: 20px; border-radius: 4px;"></div>
          <div class="skeleton" style="width: 25%; height: 12px; border-radius: 4px;"></div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="skeleton" style="width: 95%; height: 14px; border-radius: 4px;"></div>
            <div class="skeleton" style="width: 75%; height: 14px; border-radius: 4px;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getGridSkeleton(count = 4) {
  return `
    <div class="folder-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; width: 100%;">
      ${Array.from({ length: count }).map(() => `
        <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid var(--border-color); background: var(--white);">
          <div class="skeleton" style="width: 32px; height: 32px; border-radius: 50%;"></div>
          <div class="skeleton" style="flex: 1; height: 16px; border-radius: 4px;"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function getListSkeleton(count = 3) {
  return `
    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
      ${Array.from({ length: count }).map(() => `
        <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 10px; border: 1px solid var(--border-color); background: var(--white);">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
            <div class="skeleton" style="width: 60%; height: 18px; border-radius: 4px;"></div>
            <div class="skeleton" style="width: 15%; height: 14px; border-radius: 4px;"></div>
          </div>
          <div style="display: flex; gap: 8px;">
            <div class="skeleton" style="width: 30%; height: 14px; border-radius: 4px;"></div>
            <div class="skeleton" style="width: 20%; height: 14px; border-radius: 4px;"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --- API SERVICE ---
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.startsWith('192.168.') || 
                    window.location.hostname.startsWith('10.') || 
                    window.location.hostname.startsWith('172.') ||
                    window.location.protocol === 'file:';
const API_BASE = isLocalhost
  ? (window.location.protocol === 'file:' 
      ? 'http://localhost:5000/api' 
      : `http://${window.location.hostname}:${window.location.port || 3000}/api`)
  : 'https://syudyhubbackend.onrender.com/api'; // CHANGE THIS TO YOUR DEPLOYED BACKEND URL ON RENDER

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Determine if sending FormData (multipart file upload) vs JSON body
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  // Auth API
  async login(phone, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { phone, password }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async signup(name, phone, email, password, role) {
    const res = await request('/auth/signup', {
      method: 'POST',
      body: { name, phone, email, password, role }
    });
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async updateEmail(email) {
    const res = await request('/auth/email', {
      method: 'PUT',
      body: { email }
    });
    if (res.user) {
      currentUser = res.user;
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async forgotPassword(phone) {
    return await request('/auth/request-otp', {
      method: 'POST',
      body: { phone }
    });
  },

  async resendOtp(verificationId) {
    return await request('/auth/resend-otp', {
      method: 'POST',
      body: { verificationId }
    });
  },

  async verifyResetOtp(verificationId, otp, newPassword = null, confirmPassword = null) {
    const payload = { verificationId, otp };
    if (newPassword && confirmPassword) {
      payload.newPassword = newPassword;
      payload.confirmPassword = confirmPassword;
    }
    return await request('/auth/verify-otp', {
      method: 'POST',
      body: payload
    });
  },

  async resetPasswordFinal(resetToken, newPassword, confirmPassword) {
    return await request('/auth/reset-password-final', {
      method: 'POST',
      body: { resetToken, newPassword, confirmPassword }
    });
  },

  async adminUpdateUserEmail(userId, email) {
    return await request(`/auth/users/${userId}/email`, {
      method: 'PUT',
      body: { email }
    });
  },

  async adminUpdateUserEmailByPhone(phone, email) {
    return await request(`/auth/users/by-phone/${encodeURIComponent(phone)}/email`, {
      method: 'PUT',
      body: { email }
    });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof stopNotificationPolling === 'function') {
      stopNotificationPolling();
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async getMe() {
    return await request('/auth/me');
  },

  async getPendingUsers() {
    return await request('/auth/pending');
  },

  async getAllUsers() {
    return await request('/auth/users');
  },

  async approveUser(userId) {
    return await request(`/auth/approve/${userId}`, { method: 'POST' });
  },

  async rejectUser(userId) {
    return await request(`/auth/reject/${userId}`, { method: 'POST' });
  },

  async deleteUser(userId) {
    return await request(`/auth/users/${userId}`, { method: 'DELETE' });
  },

  async promoteUser(userId) {
    return await request(`/auth/promote/${userId}`, { method: 'POST' });
  },

  async resetPassword(oldPassword, newPassword, confirmPassword) {
    return await request('/auth/reset-password', {
      method: 'POST',
      body: { oldPassword, newPassword, confirmPassword }
    });
  },

  async adminResetPassword(userId) {
    return await request(`/auth/users/${userId}/reset-password`, { method: 'POST' });
  },

  // Folders API
  async getFolders(type, parentId = null) {
    let url = `/folders?type=${type}`;
    if (parentId !== null) {
      url += `&parentId=${parentId}`;
    } else {
      url += `&parentId=null`;
    }
    return await request(url);
  },

  async getAllFolders(type) {
    return await request(type ? `/folders?type=${type}` : '/folders');
  },

  async createFolder(name, type, parentId = null) {
    return await request('/folders', {
      method: 'POST',
      body: { name, type, parentId }
    });
  },

  async renameFolder(folderId, name) {
    return await request(`/folders/${folderId}`, {
      method: 'PUT',
      body: { name }
    });
  },

  async deleteFolder(folderId) {
    return await request(`/folders/${folderId}`, {
      method: 'DELETE'
    });
  },

  // Documents API
  async getDocuments(type, folderId = null) {
    let url = `/documents?type=${type}`;
    if (folderId !== null) {
      url += `&folderId=${folderId}`;
    }
    return await request(url);
  },

  async uploadDocument(formData) {
    return await request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  async contributeDocument(formData) {
    return await request('/documents/contribute', {
      method: 'POST',
      body: formData
    });
  },

  async getPendingDocuments() {
    return await request('/documents/pending');
  },

  async approveDocument(docId) {
    return await request(`/documents/approve/${docId}`, {
      method: 'POST'
    });
  },

  async rejectDocument(docId) {
    return await request(`/documents/reject/${docId}`, {
      method: 'POST'
    });
  },

  async deleteDocument(docId) {
    return await request(`/documents/${docId}`, {
      method: 'DELETE'
    });
  },

  async moveDocument(docId, targetType, targetFolderId) {
    return await request(`/documents/${docId}/move`, {
      method: 'PUT',
      body: { targetType, targetFolderId }
    });
  },

  async getMyUploads() {
    return await request('/documents/my-uploads');
  },

  async getPublicStats() {
    return await request('/documents/public-stats');
  },

  async updateDocument(docId, title, subject, year) {
    return await request(`/documents/${docId}`, {
      method: 'PUT',
      body: { title, subject, year }
    });
  },

  // Announcements API
  async getAnnouncements() {
    return await request('/announcements');
  },

  async createAnnouncement(title, content, docUrl) {
    return await request('/announcements', {
      method: 'POST',
      body: { title, content, docUrl }
    });
  },

  async deleteAnnouncement(annId) {
    return await request(`/announcements/${annId}`, {
      method: 'DELETE'
    });
  },

  // Help & Support API
  async submitHelpRequest(subject, message, name = null, phone = null, role = null, requestedEmail = null) {
    return await request('/help', {
      method: 'POST',
      body: { subject, message, name, phone, role, requestedEmail }
    });
  },

  async getHelpRequests() {
    return await request('/help');
  },

  async getMyHelpRequests() {
    return await request('/help/my');
  },

  async resolveHelpRequest(requestId) {
    return await request(`/help/resolve/${requestId}`, {
      method: 'POST'
    });
  },

  async deleteHelpRequest(requestId) {
    return await request(`/help/${requestId}`, {
      method: 'DELETE'
    });
  },

  // Notifications API
  async sendNotification(recipientId, message) {
    return await request('/notifications', {
      method: 'POST',
      body: { recipientId, message }
    });
  },

  async getUnreadNotifications() {
    return await request('/notifications/unread');
  },

  async markNotificationRead(id) {
    return await request(`/notifications/read/${id}`, {
      method: 'POST'
    });
  },

  async getMessageTemplates() {
    return await request('/notifications/templates');
  },

  async saveMessageTemplate(name, content) {
    return await request('/notifications/templates', {
      method: 'POST',
      body: { name, content }
    });
  },

  async deleteMessageTemplate(id) {
    return await request(`/notifications/templates/${id}`, {
      method: 'DELETE'
    });
  },

  async getAllNotifications() {
    return await request('/notifications/all');
  },

  async deleteNotification(id) {
    return await request(`/notifications/${id}`, {
      method: 'DELETE'
    });
  },

  async updateNotification(id, message) {
    return await request(`/notifications/${id}`, {
      method: 'PUT',
      body: { message }
    });
  },

  async toggleLikeDocument(docId) {
    return await request(`/documents/${docId}/like`, { method: 'POST' });
  },

  async togglePinDocument(docId) {
    return await request(`/documents/${docId}/pin`, { method: 'POST' });
  },

  async getTeacherRanking() {
    return await request('/auth/teachers/ranking');
  },

  async getContributors() {
    return await request('/auth/contributors');
  },

  async getTeacherStats() {
    return await request('/auth/teachers/stats');
  },

  // Reviews API
  async getMyReview() {
    return await request('/reviews/my');
  },
  async submitReview(rating, comment) {
    return await request('/reviews', {
      method: 'POST',
      body: { rating, comment }
    });
  },
  async getAllReviews() {
    return await request('/reviews');
  },
  async deleteReview(id) {
    return await request(`/reviews/${id}`, {
      method: 'DELETE'
    });
  }
};

// --- GLOBAL APPLICATION STATE ---
let currentUser = null;
let uploadSourceMode = 'file'; // 'file' | 'link' | 'scan'
let scanImages = []; // Array of compressed scanned images { dataUrl, width, height }
let cameraStream = null; // Holds the MediaStream object for camera capture
let editingIndex = null; // The index of the scanned page currently being edited
let editorRotation = 0; // Rotate state (0, 90, 180, 270)
let editorFilter = 'original'; // Current filter name ('original', 'bw', 'gray')
let editorImg = new Image(); // The original image object loaded into editor memory
let currentNotesFolder = null;
let currentPapersFolder = null;
let currentResourcesFolder = null;
let currentResourcesSection = 'root'; // 'root' | 'syllabus' | 'lab_manuals' | 'lab_manuals_folder' | 'books' | 'books_folder' | 'simulations' | 'competitive' | 'competitive_folder' | 'calculator'
let simulationFolderStack = [];
let roadmapFolderStack = simulationFolderStack;
let notesFoldersList = []; // Kept in memory to populate syllabus uploads
let activeDirectoryTab = 'admin'; // 'admin' | 'teacher' | 'student'
let adminUserSearchQuery = '';
let directoryVisibleCount = 5;
let helpRequestsVisibleCount = 5;
let notificationsVisibleCount = 5;
let reviewsVisibleCount = 5;

// GPA Calculator State
const GRADE_POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0 };
let sgpaRows = [
  { id: 1, courseName: '', credits: 4, grade: 'A+' },
  { id: 2, courseName: '', credits: 3, grade: 'A' },
  { id: 3, courseName: '', credits: 3, grade: 'B+' },
  { id: 4, courseName: '', credits: 2, grade: 'A+' }
];
let cgpaRows = [
  { id: 1, semesterName: 'Semester 1', sgpa: '', credits: 20 },
  { id: 2, semesterName: 'Semester 2', sgpa: '', credits: 20 }
];

// Helper to calculate dynamic academic years
function getAcademicYears() {
  const currentYear = new Date().getFullYear();
  const startYear = 2025;
  const years = [];
  const endLimit = Math.max(currentYear + 1, 2026);
  for (let y = startYear; y < endLimit; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years.reverse(); // Newest first
}

// Generate the Folder Icon HTML
function getFolderIconSvg(color1 = '#4a90e2', color2 = '#1e56a0') {
  return `
    <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 5px 4px rgba(14, 56, 122, 0.15))">
      <defs>
        <linearGradient id="folder-grad-${color1.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}" />
          <stop offset="100%" stop-color="${color2}" />
        </linearGradient>
      </defs>
      <path d="M10 24C10 20.6863 12.6863 18 16 18H40C43.3137 18 46 20.6863 46 24V27H90C93.3137 27 96 29.6863 96 33V76C96 79.3137 93.3137 82 90 82H10C6.68629 82 4 79.3137 4 76V24C4 20.6863 6.68629 18 10 18Z" fill="url(#folder-grad-${color1.replace('#', '')})" opacity="0.85" />
      <rect x="20" y="22" width="60" height="35" rx="3" fill="#ffffff" opacity="0.95" />
      <line x1="28" y1="28" x2="72" y2="28" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="36" x2="60" y2="36" stroke="#d9e2ec" stroke-width="2" />
      <line x1="28" y1="44" x2="68" y2="44" stroke="#d9e2ec" stroke-width="2" />
      <path d="M4 33C4 29.6863 6.68629 27 10 27H90C93.3137 27 96 29.6863 96 33V77C96 80.3137 93.3137 83 90 83H10C6.68629 83 4 80.3137 4 77V33Z" fill="url(#folder-grad-${color1.replace('#', '')})" />
      <path d="M10 27.5H90" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />
    </svg>
  `;
}

let myUploadsDocsList = [];

function canManageDocument(doc) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
  if (currentUser.role === 'educator') {
    return doc.uploadedByUserId === currentUser.id;
  }
  return false;
}

// --- DOM NAVIGATION & AUTH HELPERS ---
function updateNavbar() {
  const container = document.getElementById('nav-auth-container');
  const adminTab = document.getElementById('nav-admin');
  const mobMenu = document.getElementById('mobile-nav-menu');
  const floatingContributeBtn = document.getElementById('btn-floating-contribute');
  if (currentUser && currentUser.role === 'student') {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'flex';
  } else {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'none';
  }

  if (currentUser) {
    // Show admin dashboard tab for admin & superadmin
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      if (adminTab) adminTab.style.display = 'flex';
    } else {
      if (adminTab) adminTab.style.display = 'none';
    }

    // Show My Uploads tab for staff (educators, admins, superadmins)
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) {
      if (currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
        myUploadsTab.style.display = 'flex';
      } else {
        myUploadsTab.style.display = 'none';
      }
    }

    // Show My Contributions tab for students only
    const myContributionsTab = document.getElementById('nav-my-contributions');
    if (myContributionsTab) {
      if (currentUser.role === 'student') {
        myContributionsTab.style.display = 'flex';
      } else {
        myContributionsTab.style.display = 'none';
      }
    }

    // Show Teacher Dashboard tab for educators only
    const teacherDashboardTab = document.getElementById('nav-teacher-dashboard');
    if (teacherDashboardTab) {
      if (currentUser.role === 'educator') {
        teacherDashboardTab.style.display = 'flex';
      } else {
        teacherDashboardTab.style.display = 'none';
      }
    }

    // Populate Desktop Auth State
    // Populate Desktop Auth State
    container.innerHTML = `
      <div class="profile-dropdown-wrapper">
        <button id="profile-trigger-btn" class="profile-dropdown-btn" type="button">
          <i data-lucide="user" style="width: 16px; height: 16px;"></i>
          <span>${escapeHTML(capitalizeName(currentUser.name))}</span>
          <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 2px; opacity: 0.7;"></i>
        </button>
        <div class="profile-dropdown-menu" id="profile-dropdown-menu" style="max-height: 80vh; overflow-y: auto; padding: 16px;">
          <div class="profile-info-header" style="margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <div class="profile-name" style="font-weight: 700; font-size: 14px; color: var(--text-main);">${escapeHTML(capitalizeName(currentUser.name))}</div>
            <div class="profile-phone" style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 4px;">
              <i data-lucide="phone" style="width: 12px; height: 12px;"></i>
              ${escapeHTML(currentUser.phone)}
            </div>
            ${currentUser.email ? `
              <div class="profile-email" style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 5px;">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;" title="${escapeHTML(currentUser.email)}">
                  <i data-lucide="mail" style="width: 12px; height: 12px; flex-shrink: 0; color: var(--primary);"></i>
                  <span style="overflow: hidden; text-overflow: ellipsis;">${escapeHTML(currentUser.email)}</span>
                </div>
              </div>
            ` : `
              <div class="profile-email" style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 5px;">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 165px;" title="No email added">
                  <i data-lucide="mail" style="width: 12px; height: 12px; flex-shrink: 0; color: var(--primary);"></i>
                  <span style="overflow: hidden; text-overflow: ellipsis; color: #ef4444; font-style: italic;">No email added</span>
                </div>
                <button type="button" class="btn-open-update-email" style="padding: 2px 7px; font-size: 10px; font-weight: 700; border-radius: 4px; background: var(--primary); color: #fff; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; transition: var(--transition);" title="Link your email">
                  + Add Email
                </button>
              </div>
            `}
          </div>
          <div class="profile-role-container" style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 12px;">
            <span class="profile-role-label" style="color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Role:</span>
            <span class="profile-role-badge" style="background-color: var(--primary-accent); color: var(--primary); font-weight: 700; padding: 2px 6px; border-radius: var(--radius-sm);">
              ${currentUser.role === 'superadmin' ? 'Super Admin' : (currentUser.role === 'educator' ? 'Educator' : currentUser.role)}
            </span>
          </div>

          <!-- Quick Navigation Shortcuts (for desktop scroll & easy access) -->
          <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
            <a href="#/support" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
              <i data-lucide="help-circle" style="width: 14px; height: 14px; color: var(--primary);"></i> Help &amp; Support
            </a>
            <a href="#/generators" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
              <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--primary);"></i> File Tools
            </a>
            ${currentUser.role === 'student' ? `
              <a href="#/my-contributions" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
                <i data-lucide="award" style="width: 14px; height: 14px; color: var(--primary);"></i> My Contributions
              </a>
            ` : ''}
            ${(currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
              <a href="#/my-uploads" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
                <i data-lucide="folder-heart" style="width: 14px; height: 14px; color: var(--primary);"></i> My Uploads
              </a>
            ` : ''}
            ${currentUser.role === 'educator' ? `
              <a href="#/teacher-dashboard" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
                <i data-lucide="presentation" style="width: 14px; height: 14px; color: var(--primary);"></i> Teacher Dashboard
              </a>
            ` : ''}
            ${(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
              <a href="#/admin" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
                <i data-lucide="shield-alert" style="width: 14px; height: 14px; color: var(--primary);"></i> Admin Dashboard
              </a>
            ` : ''}
            <a href="javascript:void(0)" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link btn-download-app-trigger" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--primary); font-size: 13px; font-weight: 700; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); border: 1px solid var(--border-color); background-color: var(--primary-accent);">
              <i data-lucide="smartphone" style="width: 14px; height: 14px; color: var(--primary);"></i> Download App
            </a>
          </div>

          <!-- Academic Sections & Utilities -->
          <a href="javascript:void(0)" onclick="showAboutModal(); document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="info" style="width: 14px; height: 14px; color: var(--primary);"></i> About StudyHub
          </a>
          <a href="#/appearance" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="type" style="width: 14px; height: 14px; color: var(--primary);"></i> Typography & Fonts
          </a>
          <a href="#/contributors" onclick="document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="trophy" style="width: 14px; height: 14px; color: var(--primary);"></i> Top Contributors
          </a>
          <a href="javascript:void(0)" onclick="downloadUserManual(); document.getElementById('profile-dropdown-menu').classList.remove('show');" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--primary);"></i> Download Manual
          </a>
          <a href="#/reset-password" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="key-round" style="width: 14px; height: 14px; color: var(--primary);"></i> Reset Password
          </a>
          <a href="#/reviews" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="star" style="width: 14px; height: 14px; color: var(--primary);"></i> Write a Review
          </a>
          <a href="https://github.com/ankitgl200/studyhubStudents" target="_blank" rel="noopener noreferrer" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--primary);"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Contribute
          </a>
          <a href="#/terms" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 6px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="file-text" style="width: 14px; height: 14px; color: var(--primary);"></i> Terms of Service
          </a>
          <a href="#/privacy" class="profile-dropdown-link" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-main); font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: var(--radius-sm); transition: var(--transition); margin-bottom: 12px; border: 1px solid var(--border-color); background-color: var(--primary-accent);">
            <i data-lucide="shield" style="width: 14px; height: 14px; color: var(--primary);"></i> Privacy Policy
          </a>

          <button id="btn-logout" class="btn btn-danger btn-sm profile-logout-btn" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; width: 100%;">
            <i data-lucide="log-out" style="width: 14px; height: 14px;"></i> Logout
          </button>
        </div>
      </div>
    `;

    // Click handler to toggle showing on click (for mobile-tablet or explicit click behavior)
    const trigger = document.getElementById('profile-trigger-btn');
    const menu = document.getElementById('profile-dropdown-menu');
    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;

      updateNavbar();
      navigate('/');
    });

    // Populate Mobile Menu
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 4px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; font-size: 16px; color: var(--text-main); line-height: 1.2;">${escapeHTML(capitalizeName(currentUser.name))}</span>
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; margin-top: 2px;">Role: ${currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role}</span>
        </div>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; margin-left: 4px;">
        <i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(currentUser.phone)}
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
        <a href="#/generators" class="mobile-nav-link" id="mob-nav-generators"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> File Tools</a>
        <a href="#/reset-password" class="mobile-nav-link" id="mob-nav-reset-password"><i data-lucide="key-round" style="width: 18px; height: 18px;"></i> Reset Password</a>
        <a href="https://github.com/ankitgl200/studyhubStudents" target="_blank" rel="noopener noreferrer" class="mobile-nav-link" id="mob-nav-contribute"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: var(--primary);"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg> Contribute</a>

        ${currentUser.role === 'student' ? `
          <a href="#/my-contributions" class="mobile-nav-link" id="mob-nav-my-contributions"><i data-lucide="award" style="width: 18px; height: 18px;"></i> My Contributions</a>
        ` : ''}
        ${(currentUser.role === 'educator' || currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/my-uploads" class="mobile-nav-link" id="mob-nav-my-uploads"><i data-lucide="folder-heart" style="width: 18px; height: 18px;"></i> My Uploads</a>
        ` : ''}
        ${currentUser.role === 'educator' ? `
          <a href="#/teacher-dashboard" class="mobile-nav-link" id="mob-nav-teacher-dashboard"><i data-lucide="presentation" style="width: 18px; height: 18px;"></i> Teacher Dashboard</a>
        ` : ''}
        ${(currentUser.role === 'admin' || currentUser.role === 'superadmin') ? `
          <a href="#/admin" class="mobile-nav-link" id="mob-nav-admin"><i data-lucide="shield-alert" style="width: 18px; height: 18px;"></i> Admin</a>
        ` : ''}
      </div>
      <button class="btn btn-primary btn-download-app-trigger" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; margin-top: auto; margin-bottom: 12px;">
        <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i> Download App
      </button>
      <button id="btn-mobile-logout" class="btn btn-danger" style="width: 100%;">
        <i data-lucide="log-out" style="width: 18px; height: 18px;"></i> Logout
      </button>
    `;

    // Click handler for Close Button inside Mobile Drawer
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }

    document.getElementById('btn-mobile-logout').addEventListener('click', () => {
      api.logout();
      currentUser = null;
      document.body.style.overflow = '';
      updateNavbar();
      navigate('/');
    });

  } else {
    if (floatingContributeBtn) floatingContributeBtn.style.display = 'none';
    if (adminTab) adminTab.style.display = 'none';
    const myUploadsTab = document.getElementById('nav-my-uploads');
    if (myUploadsTab) myUploadsTab.style.display = 'none';
    const myContributionsTab = document.getElementById('nav-my-contributions');
    if (myContributionsTab) myContributionsTab.style.display = 'none';
    
    // Populate Desktop Auth State (Logged out)
    container.innerHTML = `
      <div style="display: flex; gap: 8px; margin-left: 12px;">
        <a href="#/login" class="nav-link">Login</a>
        <a href="#/signup" class="btn btn-primary btn-sm">Sign Up</a>
      </div>
    `;

    // Populate Mobile Menu (Logged out)
    mobMenu.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px;">
        <span style="font-weight: 800; font-size: 18px; color: var(--primary-dark);">Studyhub</span>
        <button id="btn-close-mobile-menu" class="btn-close-mobile-menu" style="margin: 0; padding: 4px;" aria-label="Close Menu">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>
      <div class="mobile-nav-links">
        <a href="#/" class="mobile-nav-link" id="mob-nav-home"><i data-lucide="home" style="width: 18px; height: 18px;"></i> Home</a>
        <a href="#/notes" class="mobile-nav-link" id="mob-nav-notes"><i data-lucide="book-open" style="width: 18px; height: 18px;"></i> Notes</a>
        <a href="#/papers" class="mobile-nav-link" id="mob-nav-papers"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Papers</a>
        <a href="#/resources" class="mobile-nav-link" id="mob-nav-resources"><i data-lucide="compass" style="width: 18px; height: 18px;"></i> Resources</a>
        <a href="#/support" class="mobile-nav-link" id="mob-nav-support"><i data-lucide="help-circle" style="width: 18px; height: 18px;"></i> Help & Support</a>
        <a href="#/generators" class="mobile-nav-link" id="mob-nav-generators"><i data-lucide="file-text" style="width: 18px; height: 18px;"></i> File Tools</a>
      </div>
      <button class="btn btn-primary btn-download-app-trigger" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 600; margin-top: auto; margin-bottom: 12px;">
        <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i> Download App
      </button>
      <div style="display: flex; gap: 8px; width: 100%;">
        <a href="#/login" class="nav-link btn btn-secondary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Login</a>
        <a href="#/signup" class="btn btn-primary" style="flex: 1; text-align: center; justify-content: center; padding: 10px 0;">Sign Up</a>
      </div>
    `;

    // Click handler for Close Button inside Mobile Drawer (Logged out)
    const btnClose = document.getElementById('btn-close-mobile-menu');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        mobMenu.classList.remove('open');
        const overlay = document.getElementById('mobile-nav-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = ''; // RESTORE PAGE SCROLL
      });
    }
  }
  refreshIcons();
}

// ----------------------------------------------------------------
// DESKTOP SCROLL NAV — Instant, fluid, cancelable anime.js engine
// ----------------------------------------------------------------
function initDesktopScrollNav() {
  const navbar   = document.querySelector('.navbar');
  const navLinks = document.getElementById('desktop-nav-links');
  const dock     = document.getElementById('dock');
  if (!navbar || !navLinks || !dock) return;

  const SCROLL_THRESHOLD = 50;
  let currentState = 'top'; // 'top' or 'dock'

  function getVisibleLinks() {
    return Array.from(navLinks.querySelectorAll('.nav-link')).filter(l => {
      const s = window.getComputedStyle(l);
      return s.display !== 'none';
    });
  }

  function setNavState(targetState) {
    if (window.innerWidth < 769) return;
    if (currentState === targetState) return;
    currentState = targetState;

    const links = getVisibleLinks();

    // Cancel all current animations on these elements to prevent getting stuck
    anime.remove(links);
    anime.remove(dock);

    if (targetState === 'dock') {
      // 1. Prepare DOM
      navbar.classList.add('scrolled');
      dock.classList.add('desktop-scrolled-show');
      updateDockActiveTab();

      // Measure center for left-to-center / right-to-center convergence
      const navRect = navLinks.getBoundingClientRect();
      const navCenterX = navRect.left + navRect.width / 2;
      const offsets = links.map(link => {
        const rect = link.getBoundingClientRect();
        const linkCenterX = rect.left + rect.width / 2;
        return navCenterX - linkCenterX;
      });

      // Animate buttons to center and slide down
      anime({
        targets: links,
        translateX: (el, i) => offsets[i] || 0,
        translateY: 30,
        opacity: [1, 0],
        scale: [1, 0.8],
        duration: 160,
        easing: 'easeInQuad',
        complete: () => {
          if (currentState === 'dock') {
            navLinks.style.visibility = 'hidden';
            navLinks.style.display = 'none';
          }
        }
      });

      // Animate bottom dock up
      anime({
        targets: dock,
        translateY: ['60px', '0px'],
        opacity: [0, 1],
        duration: 200,
        easing: 'easeOutCubic'
      });

    } else {
      // Return to 'top' desktop navbar state
      navLinks.style.display = '';
      navLinks.style.visibility = '';
      navbar.classList.remove('scrolled');

      // Animate dock down and remove
      anime({
        targets: dock,
        translateY: [0, '60px'],
        opacity: [1, 0],
        duration: 140,
        easing: 'easeInQuad',
        complete: () => {
          if (currentState === 'top') {
            dock.classList.remove('desktop-scrolled-show');
            dock.style.transform = '';
            dock.style.opacity = '';
          }
        }
      });

      // Animate top nav buttons springing back out into position
      anime({
        targets: links,
        translateX: 0,
        translateY: 0,
        scale: 1,
        opacity: 1,
        duration: 180,
        easing: 'easeOutBack',
        complete: () => {
          if (currentState === 'top') {
            links.forEach(l => {
              l.style.transform = '';
              l.style.opacity = '';
            });
          }
        }
      });
    }
  }

  // Use requestAnimationFrame for immediate, non-laggy, non-dropping scroll response
  let ticking = false;
  function onScroll() {
    if (window.innerWidth < 769) return;
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    if (scrollY > SCROLL_THRESHOLD) {
      setNavState('dock');
    } else {
      setNavState('top');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial check on load
  onScroll();

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth < 769) {
      currentState = 'top';
      dock.classList.remove('desktop-scrolled-show');
      navbar.classList.remove('scrolled');
      navLinks.style.visibility = '';
      getVisibleLinks().forEach(l => {
        anime.remove(l);
        l.style.transform = '';
        l.style.opacity = '';
      });
      anime.remove(dock);
      dock.style.transform = '';
      dock.style.opacity = '';
    } else {
      onScroll();
    }
  });

  // Active tab highlight
  function updateDockActiveTab() {
    const hash = window.location.hash || '#/';
    const tabMap = {
      '#/': 'bottom-nav-home',
      '#/notes': 'bottom-nav-notes',
      '#/papers': 'bottom-nav-papers',
      '#/resources': 'bottom-nav-resources',
      '#/profile': 'bottom-nav-profile'
    };
    dock.querySelectorAll('.mobile-bottom-nav-item').forEach(t => t.removeAttribute('aria-selected'));
    const activeId = tabMap[hash];
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) el.setAttribute('aria-selected', 'true');
    }
  }

  window.addEventListener('hashchange', updateDockActiveTab);
  updateDockActiveTab();
}

function handleAuthProtection(path) {
  let cleanPath = path;
  if (cleanPath.startsWith('#/')) {
    cleanPath = cleanPath.slice(1);
  } else if (cleanPath.startsWith('#')) {
    cleanPath = cleanPath.slice(1);
  }
  cleanPath = cleanPath.split('?')[0];
  if (cleanPath.endsWith('/') && cleanPath.length > 1) {
    cleanPath = cleanPath.slice(0, -1);
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/notes', '/papers', '/resources', '/generators', '/support', '/terms', '/privacy', '/contributors', '/appearance', '/reviews'];
  if (!publicRoutes.includes(cleanPath) && !currentUser) {
    navigate('/login');
    return false;
  }
  if (cleanPath.startsWith('/admin') && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('/');
    return false;
  }
  if (cleanPath === '/my-uploads' && currentUser && currentUser.role !== 'educator' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    navigate('/');
    return false;
  }
  if (cleanPath === '/my-contributions' && currentUser && currentUser.role !== 'student') {
    navigate('/');
    return false;
  }
  if (cleanPath === '/teacher-dashboard' && currentUser && currentUser.role !== 'educator') {
    navigate('/');
    return false;
  }
  return true;
}

function navigate(path) {
  let cleanPath = path;
  if (cleanPath.startsWith('#/')) {
    cleanPath = cleanPath.slice(2);
  } else if (cleanPath.startsWith('#') && cleanPath.includes('/')) {
    cleanPath = cleanPath.slice(1);
  }
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.slice(1);
  }
  const newHash = '#/' + cleanPath;
  if (window.location.hash === newHash) {
    router();
  } else {
    window.location.hash = newHash;
  }
}

function getHashQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex !== -1) {
    const qStr = hash.slice(qIndex + 1);
    const pairs = qStr.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
  }
  return params;
}

// --- ROUTER ENGINE ---
async function router() {
  // Extract clean pathname (and support hash fallback for backwards compatibility)
  let cleanPath = window.location.pathname || '/';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    cleanPath = window.location.hash.slice(1);
  } else if (window.location.hash && window.location.hash.startsWith('#') && window.location.hash.includes('/')) {
    cleanPath = window.location.hash.slice(1);
  }
  cleanPath = cleanPath.split('?')[0];
  if (cleanPath.endsWith('/') && cleanPath.length > 1) {
    cleanPath = cleanPath.slice(0, -1);
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  const adSpace = document.getElementById('site-ad-space');
  if (adSpace) adSpace.style.display = 'none';
  
  // Update navbar active state
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('#/')) href = href.slice(1);
      else if (href.startsWith('#')) href = href.slice(1);
      if (!href.startsWith('/')) href = '/' + href;
      href = href.split('?')[0];
      
      if (href === cleanPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });

  // Update mobile navbar active state
  document.querySelectorAll('.mobile-nav-menu .mobile-nav-link').forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('#/')) href = href.slice(1);
      else if (href.startsWith('#')) href = href.slice(1);
      if (!href.startsWith('/')) href = '/' + href;
      href = href.split('?')[0];

      if (href === cleanPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });

  // Close mobile nav menu when navigating
  const mobMenu = document.getElementById('mobile-nav-menu');
  if (mobMenu) {
    mobMenu.classList.remove('open');
  }
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (mobOverlay) {
    mobOverlay.classList.remove('open');
  }
  document.body.style.overflow = ''; // RESTORE PAGE SCROLL

  // Run protection check
  if (!handleAuthProtection(cleanPath)) return;

  // Update mobile bottom nav active state instantly before asynchronous loading
  document.querySelectorAll('.mobile-bottom-nav-item').forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      if (href.startsWith('#/')) href = href.slice(1);
      else if (href.startsWith('#')) href = href.slice(1);
      if (!href.startsWith('/')) href = '/' + href;
      href = href.split('?')[0];

      if (href === cleanPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });

  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (bottomNav) {
    if (cleanPath === '/login' || cleanPath === '/signup' || cleanPath === '/forgot-password') {
      bottomNav.style.setProperty('display', 'none', 'important');
    } else {
      bottomNav.style.removeProperty('display');
    }
  }
  updateMobileBottomNavPosition();

  // Toggle page visibility
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === 'view-loading') return;
    view.style.display = 'none';
    view.classList.remove('route-enter');
  });

  // Cleanup auth scene elements and tilt when navigating away from auth pages
  if (cleanPath !== '/login' && cleanPath !== '/signup' && cleanPath !== '/forgot-password') {
    document.querySelectorAll('.auth-bubble, .auth-sparkle, .auth-particle').forEach(el => el.remove());
    const prevBook = document.querySelector('.auth-book');
    if (prevBook && prevBook._tiltCleanup) prevBook._tiltCleanup();
  }

  // Detect flip direction when toggling login ↔ signup
  const prevPath = router._prevPath || '';
  if (cleanPath === '/signup' && prevPath === '/login') setAuthFlipDirection('forward');
  else if (cleanPath === '/login' && prevPath === '/signup') setAuthFlipDirection('backward');
  router._prevPath = cleanPath;

  // Close any open modals when navigating
  closeAllModals();

  if (cleanPath === '/' || cleanPath === '') {
    document.getElementById('view-home').style.display = 'block';
    await renderHomeView();
  } else if (cleanPath === '/login') {
    if (currentUser) return navigate('/');
    document.getElementById('view-login').style.display = 'block';
    document.getElementById('login-error-alert').style.display = 'none';
    setAuthBookMode('login', false);
  } else if (cleanPath === '/forgot-password') {
    document.getElementById('view-forgot-password').style.display = 'block';
    renderForgotPasswordView();
  } else if (cleanPath === '/signup') {
    if (currentUser) return navigate('/');
    document.getElementById('view-login').style.display = 'block';
    document.getElementById('signup-error-alert').style.display = 'none';
    document.getElementById('signup-success-alert').style.display = 'none';
    setAuthBookMode('signup', false);
  } else if (cleanPath === '/notes') {
    document.getElementById('view-notes').style.display = 'block';
    await renderNotesView();
  } else if (cleanPath === '/papers') {
    document.getElementById('view-papers').style.display = 'block';
    await renderPapersView();
  } else if (cleanPath === '/resources') {
    document.getElementById('view-resources').style.display = 'block';
    await renderResourcesView();
  } else if (cleanPath.startsWith('/admin')) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      if (cleanPath === '/admin/approvals') {
        return navigate('/admin?tab=pending');
      } else if (cleanPath === '/admin/users') {
        return navigate('/admin?tab=users');
      } else if (cleanPath === '/admin/reviews') {
        return navigate('/admin?tab=reviews');
      } else if (cleanPath === '/admin/contributions' || cleanPath === '/admin/support' || cleanPath === '/admin/notifications') {
        return navigate('/admin');
      }
    } else {
      if (cleanPath === '/admin' || cleanPath === '/admin/') {
        return navigate('/admin/approvals');
      }
    }
    directoryVisibleCount = 5;
    helpRequestsVisibleCount = 5;
    notificationsVisibleCount = 5;
    reviewsVisibleCount = 5;
    document.getElementById('view-admin').style.display = 'block';
    await renderAdminDashboardView(cleanPath);
  } else if (cleanPath === '/my-uploads') {
    document.getElementById('view-my-uploads').style.display = 'block';
    await renderMyUploadsView();
  } else if (cleanPath === '/my-contributions') {
    document.getElementById('view-my-contributions').style.display = 'block';
    await renderMyContributionsView();
  } else if (cleanPath === '/contributors') {
    document.getElementById('view-contributors').style.display = 'block';
    await renderContributorsView();
  } else if (cleanPath === '/support') {
    document.getElementById('view-support').style.display = 'block';
    await renderSupportView();
  } else if (cleanPath === '/reviews') {
    document.getElementById('view-reviews').style.display = 'block';
    await renderReviewsView();
  } else if (cleanPath === '/generators') {
    document.getElementById('view-generators').style.display = 'block';
    await renderGeneratorsView();
  } else if (cleanPath === '/teacher-dashboard') {
    document.getElementById('view-teacher-dashboard').style.display = 'block';
    await renderTeacherDashboardView();
  } else if (cleanPath === '/reset-password') {
    document.getElementById('view-reset-password').style.display = 'block';
    document.getElementById('reset-password-error-alert').style.display = 'none';
    document.getElementById('reset-password-success-alert').style.display = 'none';
    document.getElementById('reset-old-password').value = '';
    document.getElementById('reset-new-password').value = '';
    document.getElementById('reset-confirm-password').value = '';
  } else if (cleanPath === '/profile') {
    document.getElementById('view-profile').style.display = 'block';
    renderProfileView();
  } else if (cleanPath === '/appearance') {
    document.getElementById('view-appearance').style.display = 'block';
    renderAppearanceView();
  } else if (cleanPath === '/terms') {
    navigate('/');
    setTimeout(() => showTermsModal(), 100);
    return;
  } else if (cleanPath === '/privacy') {
    navigate('/');
    setTimeout(() => showPrivacyModal(), 100);
    return;
  } else {
    document.getElementById('view-home').style.display = 'block';
    await renderHomeView();
  }

  // Update mobile top bar page title
  const titleEl = document.getElementById('mobile-page-title');
  if (titleEl) {
    if (cleanPath === '/' || cleanPath === '') titleEl.textContent = 'Study Hub';
    else if (cleanPath === '/notes') titleEl.textContent = 'Notes';
    else if (cleanPath === '/papers') titleEl.textContent = 'Papers';
    else if (cleanPath === '/resources') titleEl.textContent = 'Resources';
    else if (cleanPath === '/profile') titleEl.textContent = 'Profile';
    else if (cleanPath === '/admin') titleEl.textContent = 'Admin';
    else if (cleanPath === '/my-uploads') titleEl.textContent = 'My Uploads';
    else if (cleanPath === '/my-contributions') titleEl.textContent = 'Contributions';
    else if (cleanPath === '/support') titleEl.textContent = 'Support';
    else if (cleanPath === '/reviews') titleEl.textContent = 'Reviews';
    else if (cleanPath === '/generators') titleEl.textContent = 'File Tools';
    else if (cleanPath === '/reset-password') titleEl.textContent = 'Reset Password';
    else if (cleanPath === '/terms') titleEl.textContent = 'Terms';
    else if (cleanPath === '/privacy') titleEl.textContent = 'Privacy';
    else titleEl.textContent = 'Study Hub';
  }

  const activeView = Array.from(document.querySelectorAll('.page-view'))
    .find(view => view.style.display !== 'none');

  if (activeView) {
    requestAnimationFrame(() => activeView.classList.add('route-enter'));
  }

  if (adSpace) adSpace.style.display = 'none';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

  refreshIcons();
}

// --- VIEW RENDERERS ---

// 1. HOME VIEW (Announcements)
async function renderHomeView() {
  const contributorsBtn = document.getElementById('home-btn-contributors');
  if (contributorsBtn) {
    contributorsBtn.style.display = 'inline-flex';
  }

  const container = document.getElementById('announcements-list-container');
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');

  // Toggle announcement button for admin and teachers
  if (addAnnBtn) {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator')) {
      addAnnBtn.style.display = 'flex';
    } else {
      addAnnBtn.style.display = 'none';
      if (annForm) annForm.style.display = 'none';
    }
  }

  // Load and render teacher rankings on the leaderboard card
  const leaderboardList = document.getElementById('teacher-ranking-list');
  if (leaderboardList) {
    leaderboardList.innerHTML = getLeaderboardSkeleton();
    api.getTeacherRanking()
      .then(ranking => {
        const topRanking = ranking.slice(0, 3);
        if (topRanking.length === 0) {
          leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--text-muted); text-align: center; padding: 10px 0;">No educators ranked yet</div>';
        } else {
          leaderboardList.innerHTML = topRanking.map((t, index) => {
            const rankNum = index + 1;
            let trophy = '';
            if (rankNum === 1) trophy = '🏆';
            else if (rankNum === 2) trophy = '🥈';
            else if (rankNum === 3) trophy = '🥉';

            const isSelf = currentUser && currentUser.id === t.id;
            const bgStyle = isSelf ? 'background-color: rgba(34, 197, 94, 0.05);' : '';

            return `
              <div style="display: flex; align-items: center; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); ${bgStyle} font-size: 14px; gap: 12px; background: var(--card-bg);">
                <span style="font-weight: 800; min-width: 44px; color: var(--text-main); font-size: 13px;">#${rankNum}${trophy ? ' ' + trophy : ''}</span>
                <span style="font-weight: 600; color: var(--primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${escapeHTML(capitalizeName(t.name))}
                </span>
              </div>
            `;
          }).join('');
        }
      })
      .catch(err => {
        console.error('Failed to load home leaderboard:', err);
        leaderboardList.innerHTML = '<div style="font-size: 11px; color: var(--danger);">Failed to load rankings</div>';
      });
  }

  // Load and render public stats (total resources count & average review rating)
  const statResourcesEl = document.getElementById('stat-resources-count');
  const statRatingEl = document.getElementById('stat-average-rating');
  if (statResourcesEl && statRatingEl) {
    api.getPublicStats()
      .then(stats => {
        const count = stats.totalResources || 0;
        const roundedCount = Math.floor(count / 10) * 10;
        
        // Count Up Animation
        if (roundedCount <= 0) {
          statResourcesEl.textContent = '0+';
        } else {
          const duration = 1200; // 1.2 seconds duration
          const startTime = performance.now();
          
          const animateCount = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // easeOutQuad curve for smooth deceleration
            const easeProgress = progress * (2 - progress);
            const current = Math.floor(easeProgress * roundedCount);
            statResourcesEl.textContent = `${current}+`;
            
            if (progress < 1) {
              requestAnimationFrame(animateCount);
            } else {
              statResourcesEl.textContent = `${roundedCount}+`;
            }
          };
          requestAnimationFrame(animateCount);
        }
        
        const rating = stats.averageRating || 4.8;
        statRatingEl.textContent = rating.toFixed(1);
      })
      .catch(err => {
        console.error('Failed to load public stats:', err);
        statResourcesEl.textContent = '150+';
        statRatingEl.textContent = '4.8';
      });
  }

  container.innerHTML = getAnnouncementsSkeleton();

  try {
    const list = await api.getAnnouncements();
    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state">No announcements posted yet. Check back later!</div>`;
      return;
    }

    container.innerHTML = `
      <div class="announcements-container sh-reveal-stagger in-view">
        ${list.map((ann, idx) => {
          const delayStyle = `animation-delay: ${idx * 0.08}s;`;
          const cardStyle = ann.docUrl ? `style="cursor: pointer; border-left: 4px solid var(--primary); ${delayStyle}"` : `style="${delayStyle}"`;
          const cardClick = ann.docUrl ? `onclick="window.open('${ann.docUrl}', '_blank')"` : '';
          return `
            <div class="announcement-card" ${cardStyle} ${cardClick}>
              <h4 style="display: flex; align-items: center; gap: 8px;">
                ${escapeHTML(ann.title)}
                ${ann.docUrl ? `<span style="font-size: 10px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 2px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase;">Doc Link</span>` : ''}
              </h4>
              <span class="announcement-date">
                <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px; vertical-align: middle;"></i>
                ${new Date(ann.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <p class="announcement-content">${escapeHTML(ann.content).replace(/\n/g, '<br>')}</p>
              ${ann.docUrl ? `
                <div style="margin-top: 10px; font-size: 13px; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <i data-lucide="external-link" style="width: 14px; height: 14px;"></i> Open Associated Link
                </div>
              ` : ''}
              ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator') ? `
                <button class="announcement-delete btn-delete-ann" data-id="${ann.id}" title="Delete Announcement" onclick="event.stopPropagation();">
                  <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach deletion handlers
    document.querySelectorAll('.btn-delete-ann').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this announcement?')) return;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
        refreshIcons();
        try {
          await api.deleteAnnouncement(id);
          await renderHomeView();
        } catch (err) {
          alert(err.message || 'Failed to delete announcement');
          btn.disabled = false;
          btn.innerHTML = originalHTML;
          refreshIcons();
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2)">Error loading announcements.</div>`;
  }
  refreshIcons();
  initHomeScrollAnimations();
}

// HOMEPAGE SCROLL ANIMATIONS (IntersectionObserver Engine)
// ---------------------------------------------------------
let homeScrollObserver = null;

function initHomeScrollAnimations() {
  const elements = document.querySelectorAll('#view-home .sh-reveal, #view-home .sh-reveal-left, #view-home .sh-reveal-right, #view-home .sh-reveal-scale, #view-home .sh-reveal-stagger');
  if (!elements || elements.length === 0) return;

  if (homeScrollObserver) {
    homeScrollObserver.disconnect();
    homeScrollObserver = null;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('in-view'));
    return;
  }

  homeScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        homeScrollObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.06
  });

  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
      el.classList.add('in-view');
    } else {
      homeScrollObserver.observe(el);
    }
  });
}

function initScrollProgressBar() {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollY = window.scrollY || doc.scrollTop || 0;
    const maxScroll = doc.scrollHeight - doc.clientHeight;
    if (maxScroll <= 0) {
      bar.style.width = '0%';
      return;
    }
    const percent = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
    bar.style.width = `${percent}%`;
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// 2. NOTES VIEW
async function renderNotesView() {
  localStorage.setItem('currentNotesFolder', JSON.stringify(currentNotesFolder));
  const breadcrumbs = document.getElementById('notes-breadcrumbs');
  const actions = document.getElementById('notes-header-actions');
  const content = document.getElementById('notes-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // 1. Render Header / Breadcrumbs & Action buttons
  if (!currentNotesFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Subject Notes</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-notes-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-notes-folder').addEventListener('click', () => {
        openFolderModal('notes');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="notes-back-crumb">Subject Notes</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentNotesFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-notes-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-notes-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload Note (PDF)
          </button>
        ` : (currentUser && currentUser.role === 'student' ? `
          <button class="btn btn-primary" id="btn-notes-contribute-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Contribute
          </button>
        ` : '')}
      </div>
    `;

    document.getElementById('btn-notes-back').addEventListener('click', backToNotesFolders);
    document.getElementById('notes-back-crumb').addEventListener('click', backToNotesFolders);
    if (isStaff) {
      document.getElementById('btn-notes-upload').addEventListener('click', () => {
        openUploadModal('notes', currentNotesFolder.id, currentNotesFolder.name);
      });
    }
    const notesContributeBtn = document.getElementById('btn-notes-contribute-folder');
    if (notesContributeBtn) {
      notesContributeBtn.addEventListener('click', () => {
        if (window.openContributeModal) window.openContributeModal('notes', currentNotesFolder.id);
      });
    }
  }

  // 2. Render content body
  if (!currentNotesFolder) {
    // Folders Grid View
    content.innerHTML = getGridSkeleton();
    try {
      const folders = await api.getFolders('notes');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No subjects folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item notes-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#4a82c3', '#1e56a0')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Attach Folder Navigation and CRUD Click Listeners
      document.querySelectorAll('.notes-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // If clicking rename or delete overlays, ignore navigation
          if (e.target.closest('.folder-actions-overlay')) return;
          currentNotesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          renderNotesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('notes', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all notes inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderNotesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list view inside folder
    content.innerHTML = getListSkeleton();
    try {
      const docs = await api.getDocuments('notes', currentNotesFolder.id);
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No notes uploaded in this subject folder yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload Note" to post the first PDF.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Notes for ${escapeHTML(currentNotesFolder.name)}</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5 style="display: flex; align-items: center; gap: 6px;">
                    ${doc.isPinned ? `<i data-lucide="pin" style="width: 14px; height: 14px; fill: var(--warning); color: var(--warning); flex-shrink: 0;" title="Pinned Document"></i>` : ''}
                    ${escapeHTML(doc.title)}
                  </h5>
                  <div class="doc-meta-details">
                    <span>Academic Year: ${escapeHTML(doc.year)}</span>
                    <span>&bull;</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                    <span>&bull;</span>
                    <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions" style="position: relative;">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                </a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                  <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                </a>
                <div class="more-options-container" style="position: relative; display: inline-block;">
                  <button class="btn btn-secondary btn-sm btn-more-options" data-id="${doc.id}" style="padding: 8px;" title="More Options">
                    <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                  </button>
                  <div class="more-options-dropdown" id="dropdown-${doc.id}">
                    ${isStaff ? `
                      <button class="dropdown-item btn-pin-doc" data-id="${doc.id}">
                        <i data-lucide="pin" style="width: 14px; height: 14px; ${doc.isPinned ? 'fill: var(--warning); color: var(--warning);' : ''}"></i>
                        <span>${doc.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    ` : ''}
                    ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                      <button class="dropdown-item btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}">
                        <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                        <span>Shift</span>
                      </button>
                    ` : ''}
                    ${canManageDocument(doc) ? `
                      <button class="dropdown-item btn-delete-doc" data-id="${doc.id}">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                        <span style="color: var(--danger);">Delete</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this note document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderNotesView();
          } catch (err) {
            alert(err.message || 'Failed to delete note');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderNotesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load documents.</div>`;
    }
  }
  refreshIcons();
}

function backToNotesFolders() {
  currentNotesFolder = null;
  renderNotesView();
}

// 3. PAPERS VIEW
let paperSearchQuery = '';

async function renderPapersView() {
  localStorage.setItem('currentPapersFolder', JSON.stringify(currentPapersFolder));
  const breadcrumbs = document.getElementById('papers-breadcrumbs');
  const actions = document.getElementById('papers-header-actions');
  const content = document.getElementById('papers-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  if (!currentPapersFolder) {
    breadcrumbs.innerHTML = `<span class="breadcrumb-item breadcrumb-active">Papers (PYQs)</span>`;
    actions.innerHTML = isAdmin ? `
      <button class="btn btn-primary" id="btn-add-papers-folder" style="display: flex; align-items: center; gap: 6px;">
        <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Subject Folder
      </button>
    ` : '';

    if (isAdmin) {
      document.getElementById('btn-add-papers-folder').addEventListener('click', () => {
        openFolderModal('papers');
      });
    }
  } else {
    breadcrumbs.innerHTML = `
      <span class="breadcrumb-item" id="papers-back-crumb">Papers (PYQs)</span>
      <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
      <span class="breadcrumb-active">${escapeHTML(currentPapersFolder.name)}</span>
    `;
    actions.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-papers-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${isStaff ? `
          <button class="btn btn-primary" id="btn-papers-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload PYQ (PDF)
          </button>
        ` : (currentUser && currentUser.role === 'student' ? `
          <button class="btn btn-primary" id="btn-papers-contribute-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Contribute
          </button>
        ` : '')}
      </div>
    `;

    document.getElementById('btn-papers-back').addEventListener('click', backToPapersFolders);
    document.getElementById('papers-back-crumb').addEventListener('click', backToPapersFolders);
    if (isStaff) {
      document.getElementById('btn-papers-upload').addEventListener('click', () => {
        openUploadModal('paper', currentPapersFolder.id, currentPapersFolder.name);
      });
    }
    const papersContributeBtn = document.getElementById('btn-papers-contribute-folder');
    if (papersContributeBtn) {
      papersContributeBtn.addEventListener('click', () => {
        if (window.openContributeModal) window.openContributeModal('papers', currentPapersFolder.id);
      });
    }
  }

  // Render Content
  if (!currentPapersFolder) {
    // Folders Grid View
    content.innerHTML = getGridSkeleton();
    try {
      const folders = await api.getFolders('papers');
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--primary-light);"></i>
            <p>No paper subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to get started.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item papers-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${getFolderIconSvg('#0284c7', '#0369a1')}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-papers-folder" data-id="${f.id}" data-name="${f.name}" title="Rename">
                    <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                  </button>
                  <button class="folder-btn folder-btn-danger btn-delete-papers-folder" data-id="${f.id}" title="Delete">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      // Folder Click Listeners
      document.querySelectorAll('.papers-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentPapersFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          paperSearchQuery = '';
          renderPapersView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-papers-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('papers', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-papers-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all papers inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load subject folders.</div>`;
    }
  } else {
    // Documents list inside folder
    content.innerHTML = getListSkeleton();
    try {
      const docs = await api.getDocuments('paper', currentPapersFolder.id);

      // Filtering logic
      const getFilteredDocs = () => {
        if (!paperSearchQuery.trim()) return docs;
        const q = paperSearchQuery.toLowerCase();
        return docs.filter(d => {
          const title = d.title || '';
          const year = d.year || '';
          return title.toLowerCase().includes(q) || year.toLowerCase().includes(q);
        });
      };

      const renderDocsList = () => {
        const filtered = getFilteredDocs();

        let searchBarHTML = '';
        if (docs.length > 0) {
          searchBarHTML = `
            <div class="search-input-wrapper" style="max-width: 300px; margin-bottom: 20px;">
              <i data-lucide="search" class="search-input-icon" style="width: 16px; height: 16px;"></i>
              <input
                type="text"
                id="input-paper-search"
                class="form-input search-input"
                placeholder="Search by paper name/year..."
                value="${escapeHTML(paperSearchQuery)}"
                style="padding: 8px 12px 8px 36px; font-size: 14px;"
              />
            </div>
          `;
        }

        let listHTML = '';
        if (docs.length === 0) {
          listHTML = `
            <div class="empty-state">
              <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
              <p>No Previous Year Papers uploaded in this subject folder yet.</p>
              ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PYQ" to post the first PDF.</p>' : ''}
            </div>
          `;
        } else if (filtered.length === 0) {
          listHTML = `
            <div class="empty-state">
              <p>No papers match your search "${escapeHTML(paperSearchQuery)}"</p>
            </div>
          `;
        } else {
          listHTML = `
            <div class="docs-list">
              ${filtered.map(doc => `
                <div class="doc-card" style="position: relative; border-left: 4px solid #0284c7;">
                  <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                    <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                    <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                  </button>
                  <div class="doc-info">
                    <div class="doc-icon-container" style="background-color: #e0f2fe; color: #0284c7;">
                      <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div class="doc-meta">
                      <h5 style="display: flex; align-items: center; gap: 6px;">
                        ${doc.isPinned ? `<i data-lucide="pin" style="width: 14px; height: 14px; fill: var(--warning); color: var(--warning); flex-shrink: 0;" title="Pinned Document"></i>` : ''}
                        ${escapeHTML(doc.title)}
                      </h5>
                      <div class="doc-meta-details">
                        <span>Academic Year: ${escapeHTML(doc.year)}</span>
                        <span>&bull;</span>
                        <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                        <span>&bull;</span>
                        <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div class="doc-actions" style="position: relative;">
                    <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </a>
                    <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm" style="padding: 8px 12px;">
                      <i data-lucide="download" style="width: 14px; height: 14px;"></i> Download
                    </a>
                    <div class="more-options-container" style="position: relative; display: inline-block;">
                      <button class="btn btn-secondary btn-sm btn-more-options" data-id="${doc.id}" style="padding: 8px;" title="More Options">
                        <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                      </button>
                      <div class="more-options-dropdown" id="dropdown-${doc.id}">
                        ${isStaff ? `
                          <button class="dropdown-item btn-pin-doc" data-id="${doc.id}">
                            <i data-lucide="pin" style="width: 14px; height: 14px; ${doc.isPinned ? 'fill: var(--warning); color: var(--warning);' : ''}"></i>
                            <span>${doc.isPinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                        ` : ''}
                        ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                          <button class="dropdown-item btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}">
                            <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                            <span>Shift</span>
                          </button>
                        ` : ''}
                        ${canManageDocument(doc) ? `
                          <button class="dropdown-item btn-delete-paper" data-id="${doc.id}">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                            <span style="color: var(--danger);">Delete</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }

        content.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
            <h3 style="color: var(--primary-dark); margin: 0;">PYQs for ${escapeHTML(currentPapersFolder.name)}</h3>
            ${searchBarHTML}
          </div>
          <div id="papers-list-render-mount">
            ${listHTML}
          </div>
        `;

        // Re-attach Search input handler
        const searchInput = document.getElementById('input-paper-search');
        if (searchInput) {
          // Focus at the end of the text
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
          
          searchInput.addEventListener('input', (e) => {
            paperSearchQuery = e.target.value;
            renderDocsList();
          });
        }

        // Re-attach Delete handler
        document.querySelectorAll('.btn-delete-paper').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this paper document?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.deleteDocument(id);
              await renderPapersView();
            } catch (err) {
              alert(err.message || 'Failed to delete paper');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        // Re-attach Like handler
        document.querySelectorAll('.btn-like-doc').forEach(btn => {
          btn.addEventListener('click', (e) => {
            handleLikeToggle(e, renderPapersView);
          });
        });
        refreshIcons();
      };

      renderDocsList();

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Failed to load papers documents.</div>`;
    }
  }
  refreshIcons();
}

function backToPapersFolders() {
  currentPapersFolder = null;
  renderPapersView();
}

// 4. RESOURCES VIEW
async function renderResourcesView() {
  localStorage.setItem('currentResourcesSection', currentResourcesSection);
  localStorage.setItem('currentResourcesFolder', JSON.stringify(currentResourcesFolder));
  localStorage.setItem('roadmapFolderStack', JSON.stringify(roadmapFolderStack));
  const breadcrumbs = document.getElementById('resources-breadcrumbs');
  const actions = document.getElementById('resources-header-actions');
  const content = document.getElementById('resources-content-container');

  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
  const isStaff = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  // Breadcrumbs & Actions
  let crumbsHTML = `<span class="breadcrumb-item ${currentResourcesSection === 'root' ? 'breadcrumb-active' : ''}" id="crumb-resources-root">Resources</span>`;
  let actionsHTML = '';

  const isStaffOrEducator = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin' || currentUser.role === 'educator');

  if (currentResourcesSection !== 'root') {
    if (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">Simulations</span>
      `;
      simulationFolderStack.forEach((folder, idx) => {
        const isLast = idx === simulationFolderStack.length - 1;
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-item ${isLast ? 'breadcrumb-active' : ''} simulation-crumb-item" data-idx="${idx}" style="cursor: pointer;">
            ${escapeHTML(folder.name)}
          </span>
        `;
      });
    } else {
      crumbsHTML += `
        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
        <span class="breadcrumb-item ${!currentResourcesFolder ? 'breadcrumb-active' : ''}" id="crumb-resources-section">
          ${currentResourcesSection === 'syllabus' ? 'Syllabus' : ''}
          ${currentResourcesSection.startsWith('lab_manuals') ? 'Lab Manuals' : ''}
          ${currentResourcesSection.startsWith('books') ? 'Books' : ''}
          ${currentResourcesSection.startsWith('competitive') ? 'Competitive Exam PYQs' : ''}
          ${currentResourcesSection === 'calculator' ? 'SGPA & CGPA Calculator' : ''}
        </span>
      `;
      if (currentResourcesFolder) {
        crumbsHTML += `
          <i data-lucide="chevron-right" class="breadcrumb-separator" style="width: 16px; height: 16px;"></i>
          <span class="breadcrumb-active">${escapeHTML(currentResourcesFolder.name)}</span>
        `;
      }
    }

    // Header buttons
    actionsHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="btn-resources-back">
          <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i> Back
        </button>
        ${(isAdmin && (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books' || currentResourcesSection === 'competitive')) || (isStaffOrEducator && (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') && !currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-add-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="folder-plus" style="width: 18px; height: 18px;"></i> Add Folder
          </button>
        ` : ''}
        ${(isStaff && (currentResourcesSection === 'syllabus' || currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder' || currentResourcesSection === 'competitive_folder')) || (isStaffOrEducator && (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') && currentResourcesFolder) ? `
          <button class="btn btn-primary" id="btn-resources-upload" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Upload Simulation / PDF
          </button>
        ` : (!isStaff && currentUser && currentUser.role === 'student' && (currentResourcesFolder || currentResourcesSection === 'syllabus') ? `
          <button class="btn btn-primary" id="btn-resources-contribute-folder" style="display: flex; align-items: center; gap: 6px;">
            <i data-lucide="plus" style="width: 18px; height: 18px;"></i> Contribute
          </button>
        ` : '')}
      </div>
    `;
  }

  breadcrumbs.innerHTML = crumbsHTML;
  actions.innerHTML = actionsHTML;

  // Crumb clicks
  const crumbRoot = document.getElementById('crumb-resources-root');
  if (crumbRoot) crumbRoot.addEventListener('click', () => { currentResourcesSection = 'root'; currentResourcesFolder = null; simulationFolderStack = []; roadmapFolderStack = []; renderResourcesView(); });

  const crumbSection = document.getElementById('crumb-resources-section');
  if (crumbSection) crumbSection.addEventListener('click', () => {
    if (currentResourcesSection.endsWith('_folder')) {
      currentResourcesSection = currentResourcesSection.replace('_folder', '');
    }
    currentResourcesFolder = null;
    simulationFolderStack = [];
    roadmapFolderStack = [];
    renderResourcesView();
  });

  // Re-attach breadcrumbs stack handlers
  document.querySelectorAll('.simulation-crumb-item, .roadmap-crumb-item').forEach(crumb => {
    crumb.addEventListener('click', () => {
      const idx = parseInt(crumb.getAttribute('data-idx'));
      simulationFolderStack = simulationFolderStack.slice(0, idx + 1);
      roadmapFolderStack = simulationFolderStack;
      currentResourcesFolder = simulationFolderStack[simulationFolderStack.length - 1];
      renderResourcesView();
    });
  });

  const backBtn = document.getElementById('btn-resources-back');
  if (backBtn) backBtn.addEventListener('click', handleResourcesBack);

  const addFolderBtn = document.getElementById('btn-resources-add-folder');
  if (addFolderBtn) addFolderBtn.addEventListener('click', () => openFolderModal(currentResourcesSection));

  const uploadBtn = document.getElementById('btn-resources-upload');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      let docType = 'syllabus';
      let folderId = null;
      let folderName = '';
      if (currentResourcesSection === 'lab_manuals_folder') {
        docType = 'lab_manual';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'books_folder') {
        docType = 'book';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'competitive_folder') {
        docType = 'competitive';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      } else if (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') {
        docType = 'simulation';
        folderId = currentResourcesFolder.id;
        folderName = currentResourcesFolder.name;
      }
      openUploadModal(docType, folderId, folderName);
    });
  }

  const resContributeBtn = document.getElementById('btn-resources-contribute-folder');
  if (resContributeBtn) {
    resContributeBtn.addEventListener('click', () => {
      let cat = 'lab_manuals';
      if (currentResourcesSection.startsWith('books')) cat = 'books';
      else if (currentResourcesSection.startsWith('simulations') || currentResourcesSection.startsWith('roadmaps')) cat = 'simulations';
      else if (currentResourcesSection.startsWith('competitive')) cat = 'competitive';
      else if (currentResourcesSection === 'syllabus') cat = 'syllabus';
      if (window.openContributeModal) {
        window.openContributeModal(cat, currentResourcesFolder ? currentResourcesFolder.id : null);
      }
    });
  }

  // 3. Render content body
  if (currentResourcesSection === 'root') {
    content.innerHTML = `
      <div class="resources-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
        <div class="card resource-card-trigger" data-section="syllabus" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #ede9fe; color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="graduation-cap" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Syllabus</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Access official university syllabus PDFs for all departments and semesters.</p>
        </div>

        <div class="card resource-card-trigger" data-section="lab_manuals" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="file-spreadsheet" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Lab Manuals</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Subject-wise practical files, manuals, experiments instructions, and guides.</p>
        </div>

        <div class="card resource-card-trigger" data-section="books" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #e0f2fe; color: #0369a1; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="book-open" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Books</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Recommended textbooks, references, and digital libraries for engineering.</p>
        </div>

        <div class="card resource-card-trigger" data-section="simulations" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #fae8ff; color: #a21caf; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="cpu" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Simulations</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Interactive virtual labs, circuit simulations, engineering models, code demos, and visual experiments.</p>
        </div>

        <div class="card resource-card-trigger" data-section="competitive" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #ffe4e6; color: #e11d48; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="award" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">Competitive Exam PYQs</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Previous year papers for GATE, CAT, UPSC, SSC, Banking, Defence, CUET, JEE, NEET and more.</p>
        </div>

        <div class="card resource-card-trigger" data-section="calculator" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 30px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <i data-lucide="calculator" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 700; margin-bottom: 10px;">GPA Calculator</h3>
          <p style="color: var(--text-muted); font-size: 14px;">Quickly calculate your SGPA and CGPA with an interactive semester grid.</p>
        </div>
      </div>
    `;

    document.querySelectorAll('.resource-card-trigger').forEach(card => {
      card.addEventListener('click', () => {
        currentResourcesSection = card.getAttribute('data-section');
        currentResourcesFolder = null;
        simulationFolderStack = [];
        roadmapFolderStack = [];
        renderResourcesView();
      });
    });

  } else if (currentResourcesSection === 'syllabus') {
    // Syllabus Documents View
    content.innerHTML = getListSkeleton();
    try {
      const docs = await api.getDocuments('syllabus');
      if (docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No syllabus PDFs uploaded yet.</p>
            ${isStaff ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add a syllabus.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">Syllabus Documents</h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5 style="display: flex; align-items: center; gap: 6px;">
                    ${doc.isPinned ? `<i data-lucide="pin" style="width: 14px; height: 14px; fill: var(--warning); color: var(--warning); flex-shrink: 0;" title="Pinned Document"></i>` : ''}
                    ${escapeHTML(doc.title)}
                  </h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>&bull;</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions" style="position: relative;">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                <div class="more-options-container" style="position: relative; display: inline-block;">
                  <button class="btn btn-secondary btn-sm btn-more-options" data-id="${doc.id}" style="padding: 8px;" title="More Options">
                    <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                  </button>
                  <div class="more-options-dropdown" id="dropdown-${doc.id}">
                    ${isStaff ? `
                      <button class="dropdown-item btn-pin-doc" data-id="${doc.id}">
                        <i data-lucide="pin" style="width: 14px; height: 14px; ${doc.isPinned ? 'fill: var(--warning); color: var(--warning);' : ''}"></i>
                        <span>${doc.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    ` : ''}
                    ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                      <button class="dropdown-item btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}">
                        <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                        <span>Shift</span>
                      </button>
                    ` : ''}
                    ${canManageDocument(doc) ? `
                      <button class="dropdown-item btn-delete-resource-doc" data-id="${doc.id}">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                        <span style="color: var(--danger);">Delete</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-resource-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this syllabus document?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading syllabus documents.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals' || currentResourcesSection === 'books' || currentResourcesSection === 'competitive') {
    // Folders Grid View for Lab Manuals, Books or Competitive Exams
    content.innerHTML = getGridSkeleton();
    try {
      const folders = await api.getFolders(currentResourcesSection);
      if (folders.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="info" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No subject folders created yet.</p>
            ${isAdmin ? '<p style="font-size: 14px; margin-top: 6px;">Click "Add Subject Folder" to start.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      const isLab = currentResourcesSection === 'lab_manuals';
      const isComp = currentResourcesSection === 'competitive';
      content.innerHTML = `
        <div class="folders-grid">
          ${folders.map(f => `
            <div class="folder-item resources-folder-card" data-id="${f.id}" data-name="${f.name}">
              ${isLab ? getFolderIconSvg('#f59e0b', '#d97706') : (isComp ? getFolderIconSvg('#f43f5e', '#e11d48') : getFolderIconSvg('#38bdf8', '#0369a1'))}
              <span class="folder-name">${escapeHTML(f.name)}</span>
              ${isAdmin ? `
                <div class="folder-actions-overlay">
                  <button class="folder-btn btn-rename-res-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                  <button class="folder-btn folder-btn-danger btn-delete-res-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.resources-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          currentResourcesFolder = { id: card.getAttribute('data-id'), name: card.getAttribute('data-name') };
          if (currentResourcesSection === 'lab_manuals') {
            currentResourcesSection = 'lab_manuals_folder';
          } else if (currentResourcesSection === 'competitive') {
            currentResourcesSection = 'competitive_folder';
          } else {
            currentResourcesSection = 'books_folder';
          }
          renderResourcesView();
        });
      });

      if (isAdmin) {
        document.querySelectorAll('.btn-rename-res-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal(currentResourcesSection, btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-res-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading folders.</div>`;
    }

  } else if (currentResourcesSection === 'lab_manuals_folder' || currentResourcesSection === 'books_folder' || currentResourcesSection === 'competitive_folder') {
    // Documents inside specific Lab Manual, Book or Competitive Exam folder
    content.innerHTML = getListSkeleton();
    let docType = 'book';
    if (currentResourcesSection === 'lab_manuals_folder') {
      docType = 'lab_manual';
    } else if (currentResourcesSection === 'competitive_folder') {
      docType = 'competitive';
    }

    try {
      const docs = await api.getDocuments(docType, currentResourcesFolder.id);
      if (docs.length === 0) {
        const canUpload = isStaff;
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="file-text" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No documents uploaded in this subject yet.</p>
            ${canUpload ? '<p style="font-size: 14px; margin-top: 6px;">Click "Upload PDF" to add files.</p>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      content.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 16px;">
          Files in ${escapeHTML(currentResourcesFolder.name)} (${docType === 'lab_manual' ? 'Lab Manuals' : (docType === 'competitive' ? 'Competitive Exam PYQs' : 'Books')})
        </h3>
        <div class="docs-list">
          ${docs.map(doc => `
            <div class="doc-card" style="position: relative;">
              <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
              </button>
              <div class="doc-info">
                <div class="doc-icon-container">
                  <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                </div>
                <div class="doc-meta">
                  <h5 style="display: flex; align-items: center; gap: 6px;">
                    ${doc.isPinned ? `<i data-lucide="pin" style="width: 14px; height: 14px; fill: var(--warning); color: var(--warning); flex-shrink: 0;" title="Pinned Document"></i>` : ''}
                    ${escapeHTML(doc.title)}
                  </h5>
                  <div class="doc-meta-details">
                    <span>Year: ${escapeHTML(doc.year)}</span>
                    <span>&bull;</span>
                    <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                  </div>
                </div>
              </div>
              <div class="doc-actions" style="position: relative;">
                <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                <a href="${API_BASE}/documents/download/${doc.id}?token=${localStorage.getItem('token')}" download="${escapeHTML(doc.fileName)}" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i> Download</a>
                <div class="more-options-container" style="position: relative; display: inline-block;">
                  <button class="btn btn-secondary btn-sm btn-more-options" data-id="${doc.id}" style="padding: 8px;" title="More Options">
                    <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                  </button>
                  <div class="more-options-dropdown" id="dropdown-${doc.id}">
                    ${isStaff ? `
                      <button class="dropdown-item btn-pin-doc" data-id="${doc.id}">
                        <i data-lucide="pin" style="width: 14px; height: 14px; ${doc.isPinned ? 'fill: var(--warning); color: var(--warning);' : ''}"></i>
                        <span>${doc.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>
                    ` : ''}
                    ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                      <button class="dropdown-item btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}">
                        <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                        <span>Shift</span>
                      </button>
                    ` : ''}
                    ${canManageDocument(doc) ? `
                      <button class="dropdown-item btn-delete-res-item-doc" data-id="${doc.id}">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                        <span style="color: var(--danger);">Delete</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.btn-delete-res-item-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Delete this file?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.deleteDocument(id);
            await renderResourcesView();
          } catch (err) {
            alert(err.message || 'Failed to delete');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state">Error loading documents.</div>`;
    }

  } else if (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') {
    content.innerHTML = getGridSkeleton();
    const parentId = currentResourcesFolder ? currentResourcesFolder.id : 'null';

    try {
      let folders = await api.getFolders('simulations', parentId);
      if (folders.length === 0 && (!currentResourcesFolder || parentId === 'null')) {
        const legacyFolders = await api.getFolders('roadmaps', parentId);
        if (legacyFolders.length > 0) folders = legacyFolders;
      }

      let docs = [];
      if (currentResourcesFolder) {
        docs = await api.getDocuments('simulation', currentResourcesFolder.id);
        if (docs.length === 0) {
          const legacyDocs = await api.getDocuments('roadmap', currentResourcesFolder.id);
          if (legacyDocs.length > 0) docs = legacyDocs;
        }
      }

      if (folders.length === 0 && docs.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i data-lucide="cpu" style="width: 30px; height: 30px; margin-bottom: 10px; color: var(--text-muted);"></i>
            <p>No folders or simulations here yet.</p>
            ${isStaffOrEducator ? `<p style="font-size: 14px; margin-top: 6px;">Click ${!currentResourcesFolder ? '"Add Folder" or ' : ''}"Upload Simulation / PDF" to get started.</p>` : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      let foldersHTML = '';
      if (folders.length > 0) {
        foldersHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Folders</h4>
          <div class="folders-grid" style="margin-bottom: 30px;">
            ${folders.map(f => `
              <div class="folder-item simulation-folder-card roadmap-folder-card" data-id="${f.id}" data-name="${f.name}">
                ${getFolderIconSvg('#a21caf', '#701a75')}
                <span class="folder-name">${escapeHTML(f.name)}</span>
                ${isStaffOrEducator ? `
                  <div class="folder-actions-overlay">
                    <button class="folder-btn btn-rename-roadmap-folder" data-id="${f.id}" data-name="${f.name}" title="Rename"><i data-lucide="edit-2" style="width:12px;height:12px;"></i></button>
                    <button class="folder-btn folder-btn-danger btn-delete-roadmap-folder" data-id="${f.id}" title="Delete"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      let docsHTML = '';
      if (docs.length > 0) {
        docsHTML = `
          <h4 style="color: var(--primary-dark); margin-bottom: 12px; font-weight: 700;">Simulation Files</h4>
          <div class="docs-list">
            ${docs.map(doc => `
              <div class="doc-card" style="position: relative; border-left: 4px solid #a21caf;">
                <div class="doc-info">
                  <div class="doc-icon-container" style="background-color: #fae8ff; color: #a21caf;">
                    <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
                  </div>
                  <div class="doc-meta">
                    <h5 style="display: flex; align-items: center; gap: 6px;">
                      ${doc.isPinned ? `<i data-lucide="pin" style="width: 14px; height: 14px; fill: var(--warning); color: var(--warning); flex-shrink: 0;" title="Pinned Document"></i>` : ''}
                      ${escapeHTML(doc.title)}
                    </h5>
                    <div class="doc-meta-details">
                      <span>Year: ${escapeHTML(doc.year)}</span>
                      <span>&bull;</span>
                      <span>${doc.uploadedByRole === 'student' ? 'Contributed By' : 'By'}: ${escapeHTML(doc.uploadedBy)}</span>
                      <span>&bull;</span>
                      <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button class="btn-like-doc like-heart-btn ${doc.hasLiked ? 'liked' : ''}" data-id="${doc.id}" title="${doc.hasLiked ? 'Unlike' : 'Like'} this resource" style="position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: ${doc.hasLiked ? 'var(--danger)' : 'var(--text-muted)'}; transition: transform 0.2s ease;">
                  <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${doc.hasLiked ? 'var(--danger)' : 'none'}; stroke: ${doc.hasLiked ? 'var(--danger)' : 'currentColor'};"></i>
                  <span class="like-count" style="font-size: 12px; font-weight: 700;">${doc.likesCount || 0}</span>
                </button>

                <div class="doc-actions" style="position: relative;">
                  <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                  <div class="more-options-container" style="position: relative; display: inline-block;">
                    <button class="btn btn-secondary btn-sm btn-more-options" data-id="${doc.id}" style="padding: 8px;" title="More Options">
                      <i data-lucide="more-vertical" style="width: 14px; height: 14px;"></i>
                    </button>
                    <div class="more-options-dropdown" id="dropdown-${doc.id}">
                      ${isStaff ? `
                        <button class="dropdown-item btn-pin-doc" data-id="${doc.id}">
                          <i data-lucide="pin" style="width: 14px; height: 14px; ${doc.isPinned ? 'fill: var(--warning); color: var(--warning);' : ''}"></i>
                          <span>${doc.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                      ` : ''}
                      ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                        <button class="dropdown-item btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}">
                          <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                          <span>Shift</span>
                        </button>
                      ` : ''}
                      ${canManageDocument(doc) ? `
                        <button class="dropdown-item btn-delete-roadmap-doc" data-id="${doc.id}">
                          <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                          <span style="color: var(--danger);">Delete</span>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      content.innerHTML = `
        <div style="padding: 10px 0;">
          ${foldersHTML}
          ${docsHTML}
        </div>
      `;

      // Event listeners
      document.querySelectorAll('.simulation-folder-card, .roadmap-folder-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.folder-actions-overlay')) return;
          const folderId = card.getAttribute('data-id');
          const folderName = card.getAttribute('data-name');
          const folder = { id: folderId, name: folderName };
          simulationFolderStack.push(folder);
          roadmapFolderStack = simulationFolderStack;
          currentResourcesFolder = folder;
          renderResourcesView();
        });
      });

      if (isStaffOrEducator) {
        document.querySelectorAll('.btn-rename-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openFolderModal('simulations', btn.getAttribute('data-id'), btn.getAttribute('data-name'));
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-folder').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!confirm('Are you sure you want to delete this folder and all subfolders and documents inside?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 10px; height: 10px;"></i>';
            refreshIcons();
            try {
              await api.deleteFolder(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete folder');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-delete-roadmap-doc').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete this simulation?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.deleteDocument(id);
              await renderResourcesView();
            } catch (err) {
              alert(err.message || 'Failed to delete simulation');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }

      // Like handlers for roadmaps / simulations
      document.querySelectorAll('.btn-like-doc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          handleLikeToggle(e, renderResourcesView);
        });
      });

    } catch (err) {
      content.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load simulations: ${escapeHTML(err.message)}</div>`;
    }

  } else if (currentResourcesSection === 'calculator') {
    // SGPA & CGPA CALCULATOR SHEET
    renderGPAThresholdsView(content);
  }

  refreshIcons();
}

function handleResourcesBack() {
  if (currentResourcesSection === 'simulations' || currentResourcesSection === 'roadmaps') {
    if (simulationFolderStack.length > 0) {
      simulationFolderStack.pop();
      roadmapFolderStack = simulationFolderStack;
      if (simulationFolderStack.length > 0) {
        currentResourcesFolder = simulationFolderStack[simulationFolderStack.length - 1];
      } else {
        currentResourcesFolder = null;
      }
    } else {
      currentResourcesSection = 'root';
      currentResourcesFolder = null;
    }
  } else if (currentResourcesSection === 'lab_manuals_folder') {
    currentResourcesSection = 'lab_manuals';
    currentResourcesFolder = null;
  } else if (currentResourcesSection === 'books_folder') {
    currentResourcesSection = 'books';
    currentResourcesFolder = null;
  } else if (currentResourcesSection === 'competitive_folder') {
    currentResourcesSection = 'competitive';
    currentResourcesFolder = null;
  } else {
    currentResourcesSection = 'root';
    currentResourcesFolder = null;
  }
  renderResourcesView();
}

// Render GPA Calculator sheets
function renderGPAThresholdsView(mountElement) {
  let calculatedSgpa = null;
  let calculatedCgpa = null;
  let activeTab = 'sgpa'; // 'sgpa' | 'cgpa'

  const computeAndRender = () => {
    mountElement.innerHTML = `
      <div class="card" style="max-width: 800px; margin: 0 auto;">
        <div class="calculator-tabs">
          <button class="calc-tab ${activeTab === 'sgpa' ? 'active' : ''}" id="tab-sgpa-trigger">SGPA Calculator</button>
          <button class="calc-tab ${activeTab === 'cgpa' ? 'active' : ''}" id="tab-cgpa-trigger">CGPA Calculator</button>
        </div>

        <!-- SGPA SHEET -->
        <div id="sheet-sgpa" style="display: ${activeTab === 'sgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your course credit hours and letter grade. SGPA is calculated as weighted average of grade points.
          </p>

          <div class="calc-row-header">
            <span>Course Title (Optional)</span>
            <span>Credits (Weight)</span>
            <span>Letter Grade</span>
            <span></span>
          </div>

          <div id="sgpa-rows-container">
            ${sgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input sgpa-course-name"
                  placeholder="e.g. Mathematics I"
                  value="${escapeHTML(row.courseName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  class="form-input sgpa-credits"
                  min="1"
                  max="10"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <select class="form-select sgpa-grade" data-idx="${idx}">
                  ${Object.keys(GRADE_POINTS).map(g => `
                    <option value="${g}" ${row.grade === g ? 'selected' : ''}>${g} (GP: ${GRADE_POINTS[g]})</option>
                  `).join('')}
                </select>
                <button 
                  class="btn btn-danger btn-sm btn-remove-sgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${sgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-sgpa-row" class="btn btn-secondary btn-sm">+ Add Course</button>
            <button id="btn-calc-sgpa" class="btn btn-primary btn-sm">Calculate SGPA</button>
          </div>

          ${calculatedSgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease;">
              <p style="font-weight: 600; font-size: 15px;">YOUR SGPA IS</p>
              <h2 class="result-val">${calculatedSgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Calculation: Sum(Credits * GradePoints) / Sum(Credits)</p>
            </div>
          ` : ''}
        </div>

        <!-- CGPA SHEET -->
        <div id="sheet-cgpa" style="display: ${activeTab === 'cgpa' ? 'block' : 'none'};">
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
            Enter your SGPA and total credits earned per semester. CGPA is computed as a credit-weighted average.
          </p>

          <div class="calc-row-header">
            <span>Semester</span>
            <span>SGPA (0.00 - 10.00)</span>
            <span>Credits (Weight)</span>
            <span></span>
          </div>

          <div id="cgpa-rows-container">
            ${cgpaRows.map((row, idx) => `
              <div class="calc-row">
                <input
                  type="text"
                  class="form-input cgpa-sem-name"
                  value="${escapeHTML(row.semesterName)}"
                  data-idx="${idx}"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  class="form-input cgpa-sgpa"
                  placeholder="e.g. 8.42"
                  value="${row.sgpa}"
                  data-idx="${idx}"
                  required
                />
                <input
                  type="number"
                  min="1"
                  max="40"
                  class="form-input cgpa-credits"
                  placeholder="Credits"
                  value="${row.credits}"
                  data-idx="${idx}"
                />
                <button 
                  class="btn btn-danger btn-sm btn-remove-cgpa-row"
                  style="padding: 8px 10px; border-radius: 8px;"
                  data-idx="${idx}"
                  ${cgpaRows.length <= 1 ? 'disabled' : ''}
                >
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="btn-add-cgpa-row" class="btn btn-secondary btn-sm">+ Add Semester</button>
            <button id="btn-calc-cgpa" class="btn btn-primary btn-sm">Calculate CGPA</button>
          </div>

          ${calculatedCgpa !== null ? `
            <div class="result-box" style="animation: modalEnter 0.3s ease; background: linear-gradient(135deg, #15803d 0%, #22c55e 100%)">
              <p style="font-weight: 600; font-size: 15px;">YOUR CGPA IS</p>
              <h2 class="result-val">${calculatedCgpa}</h2>
              <p style="font-size: 12px; opacity: 0.8;">Credit-weighted CGPA calculated across semesters.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    refreshIcons();

    // Event Triggers
    document.getElementById('tab-sgpa-trigger').addEventListener('click', () => { activeTab = 'sgpa'; computeAndRender(); });
    document.getElementById('tab-cgpa-trigger').addEventListener('click', () => { activeTab = 'cgpa'; computeAndRender(); });

    // SGPA triggers
    document.getElementById('btn-add-sgpa-row').addEventListener('click', () => {
      sgpaRows.push({ id: Date.now(), courseName: '', credits: 3, grade: 'A' });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-sgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        sgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    // Save values typed in input fields back to state
    document.querySelectorAll('.sgpa-course-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].courseName = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        sgpaRows[idx].credits = e.target.value;
      });
    });
    document.querySelectorAll('.sgpa-grade').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(sel.getAttribute('data-idx'));
        sgpaRows[idx].grade = e.target.value;
      });
    });

    document.getElementById('btn-calc-sgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      sgpaRows.forEach(row => {
        const cred = parseFloat(row.credits);
        const pts = GRADE_POINTS[row.grade];
        if (!isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (cred * pts);
        }
      });
      calculatedSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });

    // CGPA triggers
    document.getElementById('btn-add-cgpa-row').addEventListener('click', () => {
      cgpaRows.push({ id: Date.now(), semesterName: `Semester ${cgpaRows.length + 1}`, sgpa: '', credits: 20 });
      computeAndRender();
    });

    document.querySelectorAll('.btn-remove-cgpa-row').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        cgpaRows.splice(idx, 1);
        computeAndRender();
      });
    });

    document.querySelectorAll('.cgpa-sem-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].semesterName = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-sgpa').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].sgpa = e.target.value;
      });
    });
    document.querySelectorAll('.cgpa-credits').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        cgpaRows[idx].credits = e.target.value;
      });
    });

    document.getElementById('btn-calc-cgpa').addEventListener('click', () => {
      let totalCredits = 0;
      let totalPoints = 0;
      cgpaRows.forEach(row => {
        const sg = parseFloat(row.sgpa);
        const cred = parseFloat(row.credits);
        if (!isNaN(sg) && sg >= 0 && sg <= 10 && !isNaN(cred) && cred > 0) {
          totalCredits += cred;
          totalPoints += (sg * cred);
        }
      });
      calculatedCgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
      computeAndRender();
    });
  };

  computeAndRender();
}

function renderProfileView() {
  if (!currentUser) {
    navigate('/login');
    return;
  }

  const heroCard = document.getElementById('profile-hero-card');
  const menuGroup = document.getElementById('profile-sections-group');
  if (!heroCard || !menuGroup) return;

  // Populate hero card
  heroCard.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
      <div style="width: 70px; height: 70px; border-radius: 50%; background: white; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; box-shadow: var(--shadow-sm); margin-bottom: 12px;">
        ${escapeHTML(currentUser.name.charAt(0).toUpperCase())}
      </div>
      <h3 style="color: white; margin: 0; font-size: 19px; font-weight: 700;">${escapeHTML(capitalizeName(currentUser.name))}</h3>
      <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 4px 0 2px 0;">${escapeHTML(currentUser.phone)}</p>
      ${currentUser.email ? `
        <div style="color: rgba(255, 255, 255, 0.95); font-size: 13px; margin: 2px 0 10px 0; display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
          <i data-lucide="mail" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span>${escapeHTML(currentUser.email)}</span>
        </div>
      ` : `
        <div style="color: rgba(255, 255, 255, 0.95); font-size: 13px; margin: 2px 0 10px 0; display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
          <i data-lucide="mail" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span style="opacity: 0.9; font-style: italic;">No email added</span>
          <button type="button" class="btn-open-update-email" style="padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 12px; background: rgba(255, 255, 255, 0.25); border: 1px solid rgba(255, 255, 255, 0.45); color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; backdrop-filter: blur(4px);" title="Link your email">
            + Add Email
          </button>
        </div>
      `}
      <span style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
        ${currentUser.role === 'superadmin' ? 'SUPER ADMIN' : (currentUser.role === 'educator' ? 'TEACHER' : currentUser.role)}
      </span>
    </div>
  `;

  // Build menu items
  let html = '';

  // 1. Account Section
  html += `
    <div class="profile-menu-section collapsed">
      <div class="profile-menu-section-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>Account</span>
        <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
      </div>
      <div class="profile-menu-items">
        ${currentUser.role === 'student' ? `
          <a href="#/my-contributions" class="profile-menu-item">
            <div class="item-left"><i data-lucide="award"></i><span>My Contributions</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
        ` : `
          <a href="#/my-uploads" class="profile-menu-item">
            <div class="item-left"><i data-lucide="folder-heart"></i><span>My Uploads</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
        `}
        <a href="#/contributors" class="profile-menu-item">
          <div class="item-left"><i data-lucide="trophy"></i><span>Top Contributors</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="javascript:void(0)" onclick="downloadUserManual()" class="profile-menu-item">
          <div class="item-left"><i data-lucide="file-text"></i><span>Download Manual</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="#/reset-password" class="profile-menu-item">
          <div class="item-left"><i data-lucide="key-round"></i><span>Reset Password</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="#/reviews" class="profile-menu-item">
          <div class="item-left"><i data-lucide="star"></i><span>Write a Review</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="https://github.com/ankitgl200/studyhubStudents" target="_blank" rel="noopener noreferrer" class="profile-menu-item">
          <div class="item-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            <span>Contribute</span>
          </div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  // 2. Tools Section
  html += `
    <div class="profile-menu-section collapsed" style="margin-top: 16px;">
      <div class="profile-menu-section-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>Tools</span>
        <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
      </div>
      <div class="profile-menu-items">
        <a href="#/generators" class="profile-menu-item">
          <div class="item-left"><i data-lucide="file-text"></i><span>File Tools</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="javascript:void(0)" class="profile-menu-item btn-download-app-trigger">
          <div class="item-left"><i data-lucide="smartphone"></i><span>Download App</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  // 3. Support Section
  html += `
    <div class="profile-menu-section collapsed" style="margin-top: 16px;">
      <div class="profile-menu-section-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>Support</span>
        <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
      </div>
      <div class="profile-menu-items">
        <a href="javascript:void(0)" onclick="showAboutModal()" class="profile-menu-item">
          <div class="item-left"><i data-lucide="info"></i><span>About StudyHub</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="#/support" class="profile-menu-item">
          <div class="item-left"><i data-lucide="help-circle"></i><span>Help & Support</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="#/privacy" class="profile-menu-item">
          <div class="item-left"><i data-lucide="shield"></i><span>Privacy Policy</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <a href="#/terms" class="profile-menu-item">
          <div class="item-left"><i data-lucide="file-text"></i><span>Terms of Service</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  // 3.5 Customization Section
  html += `
    <div class="profile-menu-section collapsed" style="margin-top: 16px;">
      <div class="profile-menu-section-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>Customization</span>
        <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
      </div>
      <div class="profile-menu-items">
        <a href="#/appearance" class="profile-menu-item">
          <div class="item-left"><i data-lucide="type"></i><span>Typography & Fonts</span></div>
          <i data-lucide="chevron-right" class="arrow-right"></i>
        </a>
        <div class="profile-menu-item" style="cursor: default;">
          <div class="item-left"><i data-lucide="moon"></i><span>Dark Mode</span></div>
          <label class="ui-toggle-switch" style="margin: 0;" title="Toggle Dark Mode">
            <input type="checkbox" id="theme-mode-toggle-mobile" aria-label="Toggle Dark Mode">
            <span class="ui-toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;

  // 3.6 Connect Section
  html += `
    <div class="profile-menu-section collapsed" style="margin-top: 16px;">
      <div class="profile-menu-section-header" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
        <span>Connect</span>
        <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
      </div>
      <div class="profile-menu-items">
        <a href="https://www.instagram.com/studyhub_0fficial?utm_source=qr&igsh=dGh3cG02MnFhbTJl" target="_blank" rel="noopener noreferrer" class="profile-menu-item">
          <div class="item-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            <span>Instagram</span>
          </div>
          <i data-lucide="plus" class="arrow-right"></i>
        </a>
        <a href="https://t.me/+Y8-xHuu_XBo0ZDBl" target="_blank" rel="noopener noreferrer" class="profile-menu-item">
          <div class="item-left">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <span>Telegram</span>
          </div>
          <i data-lucide="plus" class="arrow-right"></i>
        </a>
      </div>
    </div>
  `;

  // 4. Admin Section (Admins/Superadmins only)
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
    const isMobile = window.innerWidth <= 768;
    html += `
      <div class="profile-menu-section collapsed" style="margin-top: 16px;">
        <div class="profile-menu-section-header" style="color: var(--danger); cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
          <span>Admin Panel</span>
          <span class="section-toggle-icon" style="display: flex; align-items: center; justify-content: center;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></span>
        </div>
        <div class="profile-menu-items">
    `;
    if (isMobile) {
      html += `
          <a href="#/admin/approvals" class="profile-menu-item">
            <div class="item-left"><i data-lucide="user-check" style="color: var(--danger);"></i><span>Pending Approvals</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin/users" class="profile-menu-item">
            <div class="item-left"><i data-lucide="users" style="color: var(--danger);"></i><span>User Directory</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin/contributions" class="profile-menu-item">
            <div class="item-left"><i data-lucide="upload-cloud" style="color: var(--danger);"></i><span>Pending Contributions</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin/support" class="profile-menu-item">
            <div class="item-left"><i data-lucide="help-circle" style="color: var(--danger);"></i><span>Help & Support Requests</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          ${(currentUser.role === 'superadmin' || currentUser.role === 'admin') ? `
            <a href="#/admin/notifications" class="profile-menu-item">
              <div class="item-left"><i data-lucide="mail" style="color: var(--danger);"></i><span>Sent Notifications</span></div>
              <i data-lucide="chevron-right" class="arrow-right"></i>
            </a>
          ` : ''}
          <a href="#/admin/reviews" class="profile-menu-item">
            <div class="item-left"><i data-lucide="star" style="color: var(--danger);"></i><span>User Reviews</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
      `;
    } else {
      html += `
          <a href="#/admin" class="profile-menu-item">
            <div class="item-left"><i data-lucide="shield-alert" style="color: var(--danger);"></i><span>Admin Dashboard</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin?tab=users" class="profile-menu-item">
            <div class="item-left"><i data-lucide="users" style="color: var(--danger);"></i><span>Manage Users</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin?tab=pending" class="profile-menu-item">
            <div class="item-left"><i data-lucide="user-check" style="color: var(--danger);"></i><span>Teacher Approval</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
          <a href="#/admin?tab=reviews" class="profile-menu-item">
            <div class="item-left"><i data-lucide="star" style="color: var(--danger);"></i><span>User Reviews</span></div>
            <i data-lucide="chevron-right" class="arrow-right"></i>
          </a>
      `;
    }
    html += `
        </div>
      </div>
    `;
  }

  menuGroup.innerHTML = html;

  // Bind expand/collapse listeners to headers
  const headers = menuGroup.querySelectorAll('.profile-menu-section-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.profile-menu-section');
      if (!section) return;

      const isCollapsed = section.classList.contains('collapsed');
      section.classList.toggle('collapsed');

      const toggle = header.querySelector('.section-toggle-icon');
      if (toggle) {
        if (isCollapsed) {
          toggle.innerHTML = '<i data-lucide="minus" style="width: 16px; height: 16px;"></i>';
        } else {
          toggle.innerHTML = '<i data-lucide="plus" style="width: 16px; height: 16px;"></i>';
        }
      }
      refreshIcons();
    });
  });

  // Add event listener to mobile theme toggle and set initial checked state
  const mobThemeToggle = document.getElementById('theme-mode-toggle-mobile');
  if (mobThemeToggle) {
    const currentTheme = localStorage.getItem('studyhub-theme-mode') || 'light';
    mobThemeToggle.checked = (currentTheme === 'dark');
    mobThemeToggle.addEventListener('change', (e) => {
      const isDark = e.target.checked;
      setThemeMode(isDark ? 'dark' : 'light', true);
    });
  }

  refreshIcons();
}

function showTermsModal() {
  const modal = document.getElementById('modal-terms');
  if (modal) {
    modal.style.display = 'flex';
    const closeBtn = document.getElementById('modal-terms-close');
    const footerBtn = document.getElementById('btn-terms-close-footer');
    const closeFn = () => { modal.style.display = 'none'; };
    if (closeBtn) closeBtn.onclick = closeFn;
    if (footerBtn) footerBtn.onclick = closeFn;
    modal.onclick = (e) => { if (e.target === modal) closeFn(); };
  }
}

function showPrivacyModal() {
  const modal = document.getElementById('modal-privacy');
  if (modal) {
    modal.style.display = 'flex';
    const closeBtn = document.getElementById('modal-privacy-close');
    const footerBtn = document.getElementById('btn-privacy-close-footer');
    const closeFn = () => { modal.style.display = 'none'; };
    if (closeBtn) closeBtn.onclick = closeFn;
    if (footerBtn) footerBtn.onclick = closeFn;
    modal.onclick = (e) => { if (e.target === modal) closeFn(); };
  }
}

async function downloadUserManual() {
  const { jsPDF } = window.jspdf;
  
  const loadImg = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const [imgProfile, imgFolders, imgResources, imgNotes] = await Promise.all([
    loadImg('media_1786884488200.jpg'),
    loadImg('media_1786884488206.jpg'),
    loadImg('media_1786884488213.jpg'),
    loadImg('media_1786884488234.jpg')
  ]);

  const doc = new jsPDF('p', 'mm', 'a4'); // A4 size: 210mm x 297mm
  
  // Custom Color Constants (RGB)
  const PRIMARY = [79, 70, 229];    // Indigo (#4f46e5)
  const PRIMARY_DARK = [55, 48, 163]; // Dark Indigo
  const SECONDARY = [5, 150, 105];   // Emerald Green (#059669)
  const TEXT_MAIN = [30, 41, 59];    // Slate 800
  const TEXT_MUTED = [100, 116, 139]; // Slate 500
  const WHITE = [255, 255, 255];
  
  // Helper: Draw Header & Footer for pages (except Page 1)
  function drawPageTemplate(pageNum, totalPages) {
    // Header bar
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('STUDYHUB - ACADEMIC PORTAL & CENTRAL LIBRARY GUIDE', 15, 8);
    
    // Footer bar
    doc.setFillColor(...TEXT_MAIN);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text('StudyHub Official User Manual', 15, 293.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, 180, 293.5);
  }

  // Helper: Draw section title
  function drawSectionHeader(title, x, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text(title, x, y);
    
    // Draw horizontal colored accent line below title
    doc.setFillColor(...SECONDARY);
    doc.rect(x, y + 1.5, 45, 0.8, 'F');
    return y + 8;
  }
  
  // Helper: Print wrapped text line by line
  function printWrappedText(doc, text, x, y, maxW, lineHeight = 6) {
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(line => {
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y; // returns the new Y coordinate!
  }
  
  // ----------------------------------------------------
  // PAGE 1: COVER PAGE
  // ----------------------------------------------------
  // Top Banner
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 110, 'F');
  
  // Large Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...WHITE);
  doc.text('StudyHub', 20, 45);
  
  // Tagline/Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(224, 231, 255); // Light indigo
  doc.text('Official Platform User Manual & Contribution Guide', 20, 58);
  
  // Accent Bar
  doc.setFillColor(...SECONDARY);
  doc.rect(20, 68, 60, 2.5, 'F');
  
  // Metadata block in banner
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(199, 210, 254);
  doc.text('Version 1.0.5  |  A4 Practical Ready  |  Active Resource Hub', 20, 85);
  
  // Bottom Content: Welcome message and table of contents
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_MAIN);
  doc.text('Welcome to StudyHub', 20, 130);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT_MAIN);
  let yPos = 138;
  const introText = "StudyHub is a modern, student-centric digital library and study platform. This document serves as your guide to getting the most out of our centralized resource bank, folders directory, and built-in A4 file tools.";
  yPos = printWrappedText(doc, introText, 20, yPos, 170, 6);
  
  // Table of Contents block
  yPos += 10;
  doc.setFillColor(248, 250, 252); // light slate gray
  doc.rect(20, yPos, 170, 68, 'F');
  doc.rect(20, yPos, 170, 68, 'S'); // border
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('TABLE OF CONTENTS', 28, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MAIN);
  
  const tocItems = [
    { page: 'Page 2', title: '1. App Navigation & Core Features (Notes, PYQs, and Resources)' },
    { page: 'Page 2', title: '2. Built-in Practical File Generators & Scan Filters' },
    { page: 'Page 3', title: '3. Uploading & Downloading Rules (Students, Teachers, Admins)' },
    { page: 'Page 3', title: '4. Contribution Leaderboard & Points Structure' },
    { page: 'Page 4', title: '5. About StudyHub (Overview, Problems Statement, Solution & Credits)' },
    { page: 'Page 5', title: '6. User Interface Visual Tour & Screenshot Gallery' }
  ];
  
  tocItems.forEach(item => {
    doc.text(item.title, 28, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(item.page, 168, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
  });
  
  // ----------------------------------------------------
  // PAGE 2: FEATURES & TOOLS
  // ----------------------------------------------------
  doc.addPage();
  drawPageTemplate(2, 5);
  
  yPos = 25;
  yPos = drawSectionHeader('1. Core Features & Navigation', 20, yPos);
  yPos += 2;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('Subject-Wise Lecture Notes & PYQs:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MAIN);
  const notesText = "StudyHub categorizes study materials into notes and previous year question papers. You can select semesters, browse subject folders, like documents for quick reference, and filter files instantly. All files load and view in-browser or download with one tap.";
  yPos = printWrappedText(doc, notesText, 20, yPos, 170, 5);
  yPos += 5;
  
  yPos = drawSectionHeader('2. Practical File Generators & Tools', 20, yPos);
  yPos += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MAIN);
  const generatorText = "Under \'File Tools\', students can generate custom, A4-ready practical cover pages (Lab Front Pages) and index sheets in PDF format. The platform also offers image-to-PDF compilation, PDF compression, PDF merging/splitting, crop margin guides, and scans grayscale/black-and-white filters.";
  yPos = printWrappedText(doc, generatorText, 20, yPos, 170, 5);
  
  // Embed screenshots side-by-side on page 2
  yPos += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Figure 1: Subject Directories & Resource Categories', 20, yPos);
  
  if (imgFolders) {
    doc.addImage(imgFolders, 'JPEG', 20, yPos + 4, 75, 125);
  }
  if (imgResources) {
    doc.addImage(imgResources, 'JPEG', 115, yPos + 4, 75, 125);
  }
  
  // ----------------------------------------------------
  // PAGE 3: RULES & GUIDELINES
  // ----------------------------------------------------
  doc.addPage();
  drawPageTemplate(3, 5);
  
  yPos = 25;
  yPos = drawSectionHeader('3. Upload & Download Rules', 20, yPos);
  yPos += 2;
  
  // Rules Box (Student)
  doc.setFillColor(240, 253, 250); // Emerald 50
  doc.rect(20, yPos, 90, 48, 'F');
  doc.rect(20, yPos, 90, 48, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...SECONDARY);
  doc.text('For Students:', 24, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MAIN);
  const studentRules = [
    "- Only upload high-quality, clear scans of notes, lab manuals, and previous year papers.",
    "- Contributions do not go live instantly. They require review and approval from a Teacher or Admin.",
    "- For every successfully approved contribution, you receive 1 point on the Leaderboard.",
    "- Do not upload copyrighted books, promotional content, or duplicate/corrupt PDFs."
  ];
  let subY = yPos + 12;
  studentRules.forEach(rule => {
    subY = printWrappedText(doc, rule, 24, subY, 82, 4.5);
  });
  yPos += 53;
  
  // Rules Box (Teacher/Educator)
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.rect(20, yPos, 90, 40, 'F');
  doc.rect(20, yPos, 90, 40, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text('For Teachers (Educators):', 24, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MAIN);
  const teacherRules = [
    "- Uploaded resources go live instantly, bypass review gates, and display with the \'Educator\' label.",
    "- Access the Educator Dashboard to monitor your resource likes, uploads count, and total page views.",
    "- Create and manage course folders, simulations, and textbooks."
  ];
  subY = yPos + 12;
  teacherRules.forEach(rule => {
    subY = printWrappedText(doc, rule, 24, subY, 82, 4.5);
  });
  yPos += 45;
  
  // Rules Box (Admin)
  doc.setFillColor(254, 242, 242); // Red 50
  doc.rect(20, yPos, 90, 40, 'F');
  doc.rect(20, yPos, 90, 40, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text('For Administrators:', 24, yPos + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MAIN);
  const adminRules = [
    "- Approve or reject pending student contributions under the approvals panel.",
    "- Manage the student/educator directories and reset user passwords if needed.",
    "- Issue server-wide announcements, manage support tickets, and configure app themes."
  ];
  subY = yPos + 12;
  adminRules.forEach(rule => {
    subY = printWrappedText(doc, rule, 24, subY, 82, 4.5);
  });
  yPos += 45;
  
  yPos = drawSectionHeader('4. Leaderboard & Contribution Points', 20, yPos);
  yPos += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MAIN);
  const leaderboardText = "Under \'Top Contributors\' page, students are ranked by approved uploads points. Each live upload awards 1 point. While leaderboard names and positions are public to all, detailed uploads count and exact points are visible only to Admins/Superadmins.";
  yPos = printWrappedText(doc, leaderboardText, 20, yPos, 90, 4.5);
  
  // Embed profile view screenshot on right side of Page 3
  if (imgProfile) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Figure 2: User Account & Profile Sections', 120, 25);
    doc.addImage(imgProfile, 'JPEG', 120, 28, 70, 140);
  }
  
  // ----------------------------------------------------
  // PAGE 4: ABOUT STUDYHUB (PASTED HTML CONTENT)
  // ----------------------------------------------------
  doc.addPage();
  drawPageTemplate(4, 5);
  
  yPos = 25;
  yPos = drawSectionHeader('5. About StudyHub', 20, yPos);
  yPos += 2;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('PLATFORM OVERVIEW:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  const aboutOverview = "StudyHub is a modern, student-centric digital library and sharing platform designed to make academic life simpler, more collaborative, and highly efficient. Created specifically for university and college students, StudyHub serves as a centralized hub where anyone can access, search, and download a wide variety of academic materials. Beyond being a repository, StudyHub integrates intelligent features to guide students through their academic journey.";
  yPos = printWrappedText(doc, aboutOverview, 20, yPos, 170, 4.5);
  yPos += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('THE PROBLEM STATEMENT:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  const aboutProblem = "Navigating college academics is often harder than it needs to be due to several persistent challenges: Lack of Organized Study Resources: Lecture slides, notes, and study material are usually scattered across different chats, emails, and drives. Students spend valuable time searching for resources instead of studying them. Difficulty Finding PYQs: Previous Year Questions are critical for exam preparation, yet they are rarely cataloged systematically, leaving students guessing about past trends. Lack of Centralized Guidance: Without a single platform, juniors struggle to seek guidance from seniors, leading to a disconnect and unnecessary stress during exams.";
  yPos = printWrappedText(doc, aboutProblem, 20, yPos, 170, 4.5);
  yPos += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('OUR SOLUTION:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  const aboutSolution = "StudyHub solves these pain points by offering a unified, clean, and accessible portal: One-Click Access: Streamlined storage allows students to access notes and files instantly without jumping between platforms. Systematic Archives: Categorized and semester-wise sorted papers make finding PYQs completely effortless. Organized & Responsive Interface: A user-friendly, responsive Single Page Application (SPA) designed to work beautifully on both desktop and mobile devices. Community-Driven Support: Built by seniors who understand the curriculum, ensuring the resources are always relevant and accurate.";
  yPos = printWrappedText(doc, aboutSolution, 20, yPos, 170, 4.5);
  yPos += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('OWNERSHIP & ROLES:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  doc.text('Ankit Ghugtyal - Founder & Developer', 25, yPos);
  doc.text('Abhay Chandra Joshi - Content Curator', 25, yPos + 4.5);
  doc.text('Adarsh Singh Chaudhary - Community Manager', 25, yPos + 9);
  doc.text('Shreya Tamta - Platform Coordinator', 25, yPos + 13.5);
  yPos += 20;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_DARK);
  doc.text('HOW TO CONTRIBUTE:', 20, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MAIN);
  const aboutContribute = "We believe StudyHub belongs to the student community. If you want to help grow the platform, improve the resources, or fix a bug, here is how you can contribute: Fork the Repository: Create a personal copy of the repository on your GitHub account. Add or Improve Resources: Add high-quality study materials, missing PYQs, or clean lecture notes. Submit a Pull Request: Submit your changes back to the main repository for review. Our team will review and merge it.";
  yPos = printWrappedText(doc, aboutContribute, 20, yPos, 170, 4.5);
  
  // ----------------------------------------------------
  // PAGE 5: VISUAL TOUR & NOTES VIEW SCREENSHOT
  // ----------------------------------------------------
  doc.addPage();
  drawPageTemplate(5, 5);
  
  yPos = 25;
  yPos = drawSectionHeader('6. User Interface Visual Tour', 20, yPos);
  yPos += 2;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_MAIN);
  const tourText = "Below is the main document listing page where students can view academic papers, likes, and upload details. StudyHub is fully responsive and adjusts fluidly to provide a native mobile app experience on smaller devices.";
  yPos = printWrappedText(doc, tourText, 20, yPos, 170, 5);
  
  if (imgNotes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Figure 3: Document Catalog & Downloads Layout', 65, yPos + 6);
    doc.addImage(imgNotes, 'JPEG', 65, yPos + 10, 80, 150);
  }
  
  // Save PDF
  doc.save('StudyHub_User_Manual.pdf');
}

function showAboutModal() {
  const modal = document.getElementById('modal-about');
  if (modal) {
    modal.style.display = 'flex';
    const closeBtn = document.getElementById('modal-about-close');
    const footerBtn = document.getElementById('btn-about-close-footer');
    const closeFn = () => { modal.style.display = 'none'; };
    if (closeBtn) closeBtn.onclick = closeFn;
    if (footerBtn) footerBtn.onclick = closeFn;
    modal.onclick = (e) => { if (e.target === modal) closeFn(); };
    if (typeof refreshIcons === 'function') refreshIcons();
  }
}

// ----------------------------------------------------
// APPEARANCE & PERSONALIZATION (FONTS & DISPLAY)
// ----------------------------------------------------

const FONT_STYLES = [
  { id: 'inter', name: 'Inter', category: 'Clean & Modern (Default)', font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'outfit', name: 'Outfit', category: 'Trendy & Geometric', font: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'jakarta', name: 'Plus Jakarta Sans', category: 'Sleek & Professional', font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'poppins', name: 'Poppins', category: 'Friendly & Rounded', font: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'roboto', name: 'Roboto', category: 'Classic & High Legibility', font: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'nunito', name: 'Nunito', category: 'Soft & Approachable', font: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'lexend', name: 'Lexend', category: 'Optimized for Academic Reading', font: "'Lexend', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'space', name: 'Space Grotesk', category: 'Tech & Expressive', font: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: 'lora', name: 'Lora', category: 'Elegant Academic Serif', font: "'Lora', Georgia, serif" },
  { id: 'dmsans', name: 'DM Sans', category: 'Minimalist & Crisp', font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }
];

function clearLegacyColorTheme() {
  try {
    localStorage.removeItem('studyhub-color-theme');
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-dark');
    root.style.removeProperty('--primary-light');
    root.style.removeProperty('--primary-accent');
    root.style.removeProperty('--primary-rgb');
    root.style.removeProperty('--primary-glow');
    root.style.removeProperty('--bg-gradient');
  } catch (e) {}
}

function applyFontStyle(fontId, save = true) {
  const fontObj = FONT_STYLES.find(f => f.id === fontId) || FONT_STYLES[0];
  const root = document.documentElement;
  root.style.setProperty('--app-font-family', fontObj.font);
  document.body.style.fontFamily = fontObj.font;
  if (save) {
    localStorage.setItem('studyhub-app-font', fontObj.id);
  }
}

function renderAppearanceView() {
  const fontContainer = document.getElementById('theme-font-list');
  if (fontContainer) {
    const activeFontKey = localStorage.getItem('studyhub-app-font') || 'inter';

    // Render 10 Font Styles
    fontContainer.innerHTML = FONT_STYLES.map(f => {
      const isActive = (f.id === activeFontKey);
      return `
        <div class="font-style-card ${isActive ? 'active' : ''}" onclick="selectFontStyle('${f.id}')">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 15px; font-family: ${f.font}; color: var(--text-main);">${f.name}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px; font-family: ${f.font};">
              ${f.category} • The quick brown fox jumps over the lazy dog (123)
            </div>
          </div>
          <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isActive ? 'var(--primary)' : 'var(--border-color)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-left: 12px;">
            ${isActive ? '<i data-lucide="check" style="color: #ffffff; width: 15px; height: 15px;"></i>' : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  const appToggle = document.getElementById('theme-mode-toggle-appearance');
  if (appToggle) {
    const isDark = (localStorage.getItem('studyhub-theme-mode') === 'dark');
    appToggle.checked = isDark;
    appToggle.onchange = (e) => {
      setThemeMode(e.target.checked ? 'dark' : 'light', true);
    };
  }

  if (typeof refreshIcons === 'function') refreshIcons();
}

window.selectFontStyle = function(fontId) {
  applyFontStyle(fontId, true);
  renderAppearanceView();
};

function showUserDeviceDetailsModal(u) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.style.zIndex = '2000';
  modal.id = 'modal-user-device-details';
  
  const dev = u.deviceInfo || { browser: 'Unknown', os: 'Unknown', deviceType: 'Unknown', deviceModel: 'Unknown', ip: 'Unknown' };

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; padding: 30px; border-radius: var(--radius-lg); position: relative; text-align: left; background: var(--card-bg); border: 1px solid var(--border-color);">
      <button class="modal-close" id="modal-user-device-close" style="top: 15px; right: 15px; background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer;">&times;</button>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
        <div style="width: 45px; height: 45px; border-radius: 50%; background-color: var(--primary-accent); color: var(--primary); display: flex; align-items: center; justify-content: center;">
          <i data-lucide="shield-alert" style="width: 24px; height: 24px;"></i>
        </div>
        <div>
          <h3 style="color: var(--primary-dark); font-size: 20px; font-weight: 800; margin: 0;">Device & Session Details</h3>
          <p style="color: var(--text-muted); font-size: 13px; margin: 2px 0 0 0;">User: <strong>${escapeHTML(capitalizeName(u.name))}</strong></p>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Last Login</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Last Active</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${u.lastActive ? new Date(u.lastActive).toLocaleString() : 'Never'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Device Type</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700; text-transform: capitalize;">${escapeHTML(dev.deviceType || 'Unknown')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">OS Used</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${escapeHTML(dev.os || 'Unknown')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Browser</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${escapeHTML(dev.browser || 'Unknown')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Network User (IP)</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${escapeHTML(dev.ip || 'Unknown')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 8px;">
          <span style="color: var(--text-muted); font-size: 13px; font-weight: 600;">Device Model / Info</span>
          <span style="color: var(--text-main); font-size: 13px; font-weight: 700;">${escapeHTML(dev.deviceModel || 'N/A')}</span>
        </div>
      </div>
      
      <button class="btn btn-primary" id="modal-user-device-btn" style="width: 100%; margin-top: 24px; padding: 12px; font-weight: 600;">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => {
    modal.classList.add('fade-out');
    setTimeout(() => modal.remove(), 250);
  };

  document.getElementById('modal-user-device-close').addEventListener('click', closeModal);
  document.getElementById('modal-user-device-btn').addEventListener('click', closeModal);
}

// 5. ADMIN DASHBOARD VIEW
async function renderAdminDashboardView(currentHash) {
  if (!currentHash) {
    currentHash = window.location.pathname;
  }
  if (currentHash.startsWith('#/')) {
    currentHash = currentHash.slice(1);
  }
  currentHash = currentHash.split('?')[0];
  if (!currentHash.startsWith('/')) {
    currentHash = '/' + currentHash;
  }
  if (!currentHash.startsWith('/admin')) {
    currentHash = '/admin/approvals';
  }

  const roleLabel = document.getElementById('admin-panel-role-label');
  const errorAlert = document.getElementById('admin-error-alert');
  const pendingCount = document.getElementById('pending-users-count');
  const pendingContainer = document.getElementById('pending-users-list-container');
  const allCount = document.getElementById('all-users-count');
  const allContainer = document.getElementById('all-users-list-container');
  const directoryHint = document.getElementById('admin-directory-hint');
  const tabsContainer = document.getElementById('directory-tabs');
  const subpageTitle = document.getElementById('admin-panel-subpage-title');

  // Set role label
  if (roleLabel) {
    roleLabel.textContent = currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin';
  }
  if (errorAlert) {
    errorAlert.style.display = 'none';
  }

  // Handle visibility of the sub-view containers based on Mobile vs PC viewport
  const isMobile = window.innerWidth <= 768;
  const pcSep = subpageTitle ? subpageTitle.previousElementSibling : null;

  if (isMobile) {
    if (pcSep) pcSep.style.display = 'inline';
    if (subpageTitle) subpageTitle.style.display = 'inline';

    document.querySelectorAll('.admin-subview').forEach(view => {
      view.style.display = 'none';
    });

    if (currentHash === '/admin/approvals') {
      if (subpageTitle) subpageTitle.textContent = 'Pending Approvals';
      const view = document.getElementById('admin-section-approvals');
      if (view) view.style.display = 'block';
    } else if (currentHash === '/admin/users') {
      if (subpageTitle) subpageTitle.textContent = 'User Directory';
      const view = document.getElementById('admin-section-users');
      if (view) view.style.display = 'block';
    } else if (currentHash === '/admin/contributions') {
      if (subpageTitle) subpageTitle.textContent = 'Pending Contributions';
      const view = document.getElementById('admin-section-contributions');
      if (view) view.style.display = 'block';
    } else if (currentHash === '/admin/support') {
      if (subpageTitle) subpageTitle.textContent = 'Help & Support';
      const view = document.getElementById('admin-section-support');
      if (view) view.style.display = 'block';
    } else if (currentHash === '/admin/notifications') {
      if (subpageTitle) subpageTitle.textContent = 'Sent Notifications';
      const view = document.getElementById('admin-section-notifications');
      if (view) view.style.display = 'block';
    } else if (currentHash === '/admin/reviews') {
      if (subpageTitle) subpageTitle.textContent = 'User Reviews';
      const view = document.getElementById('admin-section-reviews');
      if (view) view.style.display = 'block';
    }
  } else {
    if (pcSep) pcSep.style.display = 'none';
    if (subpageTitle) subpageTitle.style.display = 'none';

    document.querySelectorAll('.admin-subview').forEach(view => {
      view.style.display = 'block';
    });
  }

  const adminSearchInput = document.getElementById('admin-user-search-input');
  const adminSearchClearBtn = document.getElementById('btn-admin-user-search-clear');
  if (adminSearchInput && adminSearchClearBtn) {
    adminSearchInput.value = adminUserSearchQuery;
    adminSearchClearBtn.style.display = adminUserSearchQuery ? 'flex' : 'none';
  }

  if (currentUser.role === 'superadmin') {
    if (directoryHint) directoryHint.textContent = 'Super Admin view: You have full deletion and admin promotion privileges.';
  } else {
    if (directoryHint) directoryHint.textContent = 'Admin view: You can manage and delete Student accounts only.';
  }

  try {
    const fetchApprovals = async () => {
      pendingContainer.innerHTML = getListSkeleton();
      const pending = await api.getPendingUsers();
      pendingCount.textContent = pending.length;

      if (pending.length === 0) {
        pendingContainer.innerHTML = `<div class="empty-state" style="padding: 30px;">No registration requests pending approval.</div>`;
      } else {
        pendingContainer.innerHTML = pending.map(u => `
          <div class="user-card">
            <div class="user-info">
              <h5>${escapeHTML(capitalizeName(u.name))}</h5>
              <p>Phone: ${escapeHTML(u.phone)} &bull; Requested Role: <strong style="text-transform: capitalize; color: var(--primary);">${escapeHTML(u.role)}</strong></p>
              <p style="font-size: 11px; margin-top: 2px;">Registered: ${new Date(u.createdAt).toLocaleString()}</p>
            </div>
            <div class="user-actions">
              <button class="btn btn-primary btn-sm btn-approve-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px; background-color: var(--success); border: none;">
                <i data-lucide="user-check" style="width:14px;height:14px;"></i> Approve
              </button>
              <button class="btn btn-danger btn-sm btn-reject-user" data-id="${u.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                <i data-lucide="user-x" style="width:14px;height:14px;"></i> Reject
              </button>
            </div>
          </div>
        `).join('');

        document.querySelectorAll('.btn-approve-user').forEach(btn => {
          btn.addEventListener('click', async () => {
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.approveUser(btn.getAttribute('data-id'));
              await renderAdminDashboardView(currentHash);
            } catch (err) {
              alert(err.message || 'Approval failed');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-reject-user').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Reject and delete this registration request?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
            refreshIcons();
            try {
              await api.rejectUser(btn.getAttribute('data-id'));
              await renderAdminDashboardView(currentHash);
            } catch (err) {
              alert(err.message || 'Rejection failed');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });
      }
    };

    const fetchUsers = async () => {
      allContainer.innerHTML = getListSkeleton();
      const all = await api.getAllUsers();

      // Sort users descending by their date of joining (newest first)
      all.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      let filteredUsers = all;
      if (adminUserSearchQuery.trim()) {
        const q = adminUserSearchQuery.toLowerCase().trim();
        filteredUsers = all.filter(u => {
          const name = (u.name || '').toLowerCase();
          const phone = (u.phone || '').toLowerCase();
          return name.includes(q) || phone.includes(q);
        });
      }

      allCount.textContent = filteredUsers.length;

      const adminsList = filteredUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
      const teachersList = filteredUsers.filter(u => u.role === 'educator');
      const studentsList = filteredUsers.filter(u => u.role === 'student');

      const renderTabs = () => {
        tabsContainer.innerHTML = `
          <button class="calc-tab ${activeDirectoryTab === 'admin' ? 'active' : ''}" id="tab-dir-admin">Admin (${adminsList.length})</button>
          <button class="calc-tab ${activeDirectoryTab === 'teacher' ? 'active' : ''}" id="tab-dir-teacher">Teachers (${teachersList.length})</button>
          <button class="calc-tab ${activeDirectoryTab === 'student' ? 'active' : ''}" id="tab-dir-student">Students (${studentsList.length})</button>
        `;

        document.getElementById('tab-dir-admin').addEventListener('click', () => { activeDirectoryTab = 'admin'; directoryVisibleCount = 5; updateDirectoryView(); });
        document.getElementById('tab-dir-teacher').addEventListener('click', () => { activeDirectoryTab = 'teacher'; directoryVisibleCount = 5; updateDirectoryView(); });
        document.getElementById('tab-dir-student').addEventListener('click', () => { activeDirectoryTab = 'student'; directoryVisibleCount = 5; updateDirectoryView(); });
      };

      const updateDirectoryView = () => {
        renderTabs();

        let selectedUsers = [];
        if (activeDirectoryTab === 'admin') selectedUsers = adminsList;
        else if (activeDirectoryTab === 'teacher') selectedUsers = teachersList;
        else if (activeDirectoryTab === 'student') selectedUsers = studentsList;

        if (selectedUsers.length === 0) {
          allContainer.innerHTML = `<div class="empty-state">No users found in this category.</div>`;
          const dirShowMoreContainer = document.getElementById('directory-show-more-container');
          if (dirShowMoreContainer) dirShowMoreContainer.innerHTML = '';
          refreshIcons();
          return;
        }

        const slicedUsers = selectedUsers.slice(0, directoryVisibleCount);

        allContainer.innerHTML = slicedUsers.map(u => {
          const isPrimarySuperAdmin = u.phone === '8218325600';
          const canPromote = currentUser.role === 'superadmin' && u.role === 'admin';
          
          const canDelete = u.id !== currentUser.id && 
                            !isPrimarySuperAdmin && 
                            (currentUser.role === 'superadmin' || (currentUser.role === 'admin' && u.role === 'student'));

          return `
            <div class="user-card" style="padding: 14px 16px;">
              <div class="user-info btn-user-details" data-id="${u.id}" style="cursor: pointer;" title="Click to view Device & Session Details">
                <h5 style="font-size: 15px; display: flex; align-items: center; gap: 6px;">
                  ${escapeHTML(capitalizeName(u.name))}
                  ${isPrimarySuperAdmin ? `
                    <span style="font-size: 10px; background-color: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                      Primary Owner
                    </span>
                  ` : ''}
                </h5>
                <p style="font-size: 12px;">Phone: ${escapeHTML(u.phone)}</p>
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Email: ${u.email ? escapeHTML(u.email) : '<span style="color: #ef4444; font-style: italic; font-weight: 500;">No email linked</span>'}</p>
                <div style="display: flex; gap: 6px; margin-top: 4px;">
                  <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.role === 'superadmin' ? '#fee2e2' : 'var(--primary-accent)'}; color: ${u.role === 'superadmin' ? '#ef4444' : 'var(--primary-dark)'};">
                    ${u.role === 'superadmin' ? 'Super Admin' : escapeHTML(u.role)}
                  </span>
                  <span class="user-tag" style="margin: 0; padding: 2px 6px; font-size: 10px; background-color: ${u.approved ? '#dcfce7' : '#fee2e2'}; color: ${u.approved ? '#166534' : '#991b1b'};">
                    ${u.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
              <div class="user-actions" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px;">
                ${u.role === 'educator' && typeof u.points === 'number' ? `
                  <span class="user-tag" style="margin: 0 8px 0 0; padding: 4px 10px; font-size: 11px; font-weight: 700; background-color: var(--primary-accent); color: var(--primary-dark);">
                    ${u.points} pts
                  </span>
                ` : ''}
                ${u.id !== currentUser.id ? `
                  <button class="btn btn-secondary btn-sm btn-message-user" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: var(--primary-accent); color: var(--primary-dark); border-color: var(--primary-accent);" title="Send Notification Message">
                    <i data-lucide="bell" style="width: 12px; height: 12px;"></i> Message
                  </button>
                  <button class="btn btn-secondary btn-sm btn-admin-edit-email" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" data-phone="${escapeHTML(u.phone)}" data-email="${escapeHTML(u.email || '')}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #ede9fe; color: #6d28d9; border-color: #ddd6fe;" title="Update user email">
                    <i data-lucide="mail" style="width: 12px; height: 12px;"></i> Edit Email
                  </button>
                  <button class="btn btn-secondary btn-sm btn-admin-reset-password" data-id="${u.id}" data-name="${escapeHTML(capitalizeName(u.name))}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #fef08a; color: #854d0e; border-color: #fef08a;" title="Reset user password to 123456">
                    <i data-lucide="key" style="width: 12px; height: 12px;"></i> Reset Password
                  </button>
                ` : ''}
                ${canPromote ? `
                  <button class="btn btn-secondary btn-sm btn-promote-admin" data-id="${u.id}" style="margin-right: 8px; font-size: 11px; padding: 4px 10px; display: flex; align-items: center; gap: 3px; background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd;" title="Promote to Super Admin">
                    <i data-lucide="award" style="width: 12px; height: 12px;"></i> Promote
                  </button>
                ` : ''}
                ${canDelete ? `
                  <button class="btn btn-danger btn-sm btn-delete-user" data-id="${u.id}" style="padding: 8px; border-radius: 50%;" title="Delete User">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');

        document.querySelectorAll('.btn-promote-admin').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Promote this admin to Super Admin? This action gives them absolute permission.')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
            refreshIcons();
            try {
              const res = await api.promoteUser(btn.getAttribute('data-id'));
              alert(res.message || 'Successfully promoted user to Super Admin!');
              await renderAdminDashboardView(currentHash);
            } catch (err) {
              alert(err.message || 'Promotion failed');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-delete-user').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Permanently delete this user account?')) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
            refreshIcons();
            try {
              await api.deleteUser(btn.getAttribute('data-id'));
              await renderAdminDashboardView(currentHash);
            } catch (err) {
              alert(err.message || 'Deletion failed');
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-message-user').forEach(btn => {
          btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const userName = btn.getAttribute('data-name');
            
            const modal = document.getElementById('modal-send-message');
            const userIdInput = document.getElementById('send-message-user-id');
            const nameInput = document.getElementById('send-message-recipient-name');
            const bodyTextarea = document.getElementById('send-message-body');
            const errAlert = document.getElementById('send-message-error-alert');
            
            if (modal && userIdInput && nameInput && bodyTextarea) {
              errAlert.style.display = 'none';
              bodyTextarea.value = '';
              userIdInput.value = userId;
              nameInput.value = userName;
              modal.style.display = 'flex';
              renderMessageTemplates();
            }
          });
        });
        document.querySelectorAll('.btn-admin-reset-password').forEach(btn => {
          btn.addEventListener('click', async () => {
            const userName = btn.getAttribute('data-name');
            const userId = btn.getAttribute('data-id');
            if (!confirm(`Are you sure you want to reset the password for ${userName} to 123456?`)) return;
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 12px; height: 12px;"></i>';
            refreshIcons();
            try {
              const res = await api.adminResetPassword(userId);
              alert(res.message || 'Successfully reset password to 123456!');
            } catch (err) {
              alert(err.message || 'Failed to reset password');
            } finally {
              btn.disabled = false;
              btn.innerHTML = originalHTML;
              refreshIcons();
            }
          });
        });

        document.querySelectorAll('.btn-admin-edit-email').forEach(btn => {
          btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const phone = btn.getAttribute('data-phone');
            const email = btn.getAttribute('data-email');
            openAdminEditEmailModal({ userId, phone, name, email });
          });
        });

        // Render Show More button for Directory if needed
        const dirShowMoreContainer = document.getElementById('directory-show-more-container');
        const dirRemaining = selectedUsers.length - directoryVisibleCount;
        if (dirShowMoreContainer) {
          if (dirRemaining > 0) {
            dirShowMoreContainer.innerHTML = `
              <button id="btn-directory-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                Show More (${dirRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
              </button>
            `;
            document.getElementById('btn-directory-show-more').addEventListener('click', () => {
              directoryVisibleCount += 10;
              updateDirectoryView();
            });
          } else {
            dirShowMoreContainer.innerHTML = '';
          }
        }

        // Attach click listeners to user info block for device details modal
        allContainer.querySelectorAll('.btn-user-details').forEach(el => {
          el.addEventListener('click', () => {
            const id = el.getAttribute('data-id');
            const u = selectedUsers.find(user => user.id === id);
            if (u) {
              showUserDeviceDetailsModal(u);
            }
          });
        });

        refreshIcons();
      };

      updateDirectoryView();
    };

    const fetchContributions = async () => {
      await renderPendingContributions();
    };

    const fetchSupport = async () => {
      const helpRequestsContainer = document.getElementById('support-requests-list-container');
      const helpRequestsCount = document.getElementById('support-requests-count');

      if (helpRequestsContainer && helpRequestsCount) {
        helpRequestsContainer.innerHTML = getListSkeleton();

        try {
          const tickets = await api.getHelpRequests();
          helpRequestsCount.textContent = tickets.length;

          if (tickets.length === 0) {
            helpRequestsContainer.innerHTML = '<div class="empty-state">No support requests submitted yet.</div>';
            const supportShowMoreContainer = document.getElementById('support-show-more-container');
            if (supportShowMoreContainer) supportShowMoreContainer.innerHTML = '';
          } else {
            const slicedTickets = tickets.slice(0, helpRequestsVisibleCount);

            helpRequestsContainer.innerHTML = slicedTickets.map(t => {
              const isResolved = t.status === 'resolved';
              const cardClass = isResolved ? 'status-resolved' : 'status-pending';
              const badgeClass = isResolved ? 'status-badge-resolved' : 'status-badge-pending';
              const statusText = isResolved ? 'Resolved' : 'Pending';
              const statusIcon = isResolved ? 'check-circle' : 'clock';
              
              const roleBadge = t.role === 'superadmin' ? 'Super Admin' : (t.role === 'educator' ? 'Educator' : 'Student');
              
              return `
                <div class="ticket-card ${cardClass}">
                  <div class="ticket-header">
                    <div class="ticket-user-info">
                      <h5 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHTML(capitalizeName(t.name))}</h5>
                      <div class="ticket-user-meta">
                        <span class="profile-role-badge" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 2px 6px; font-size: 10px; font-weight: 600; text-transform: capitalize;">${roleBadge}</span>
                        <span>&bull;</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${escapeHTML(t.phone)}</span>
                        <span>&bull;</span>
                        <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <span class="ticket-status-badge ${badgeClass}">
                      <i data-lucide="${statusIcon}" style="width: 14px; height: 14px;"></i> ${statusText}
                    </span>
                  </div>
                  <div class="ticket-subject" style="font-size: 15px; font-weight: 700; color: var(--primary-dark); margin-bottom: 8px;">Subject: ${escapeHTML(t.subject)}</div>
                  <div class="ticket-message" style="font-size: 14px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(t.message)}</div>
                  ${t.requestedEmail ? `
                    <div style="margin-top: 10px; padding: 10px 14px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; font-size: 13px; color: #92400e; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="mail" style="width: 16px; height: 16px; flex-shrink: 0;"></i>
                        <span>Requested Email: <strong>${escapeHTML(t.requestedEmail)}</strong></span>
                      </div>
                      <button type="button" class="btn btn-sm btn-link-requested-email" data-phone="${escapeHTML(t.phone)}" data-name="${escapeHTML(t.name)}" data-email="${escapeHTML(t.requestedEmail)}" style="font-size: 12px; padding: 4px 10px; background: #d97706; color: #fff; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600;">
                        <i data-lucide="link" style="width: 12px; height: 12px;"></i> Link to Account
                      </button>
                    </div>
                  ` : ''}
                  <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px;">
                    <button class="btn btn-secondary btn-sm btn-resolve-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                      ${isResolved ? `
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Mark Pending
                      ` : `
                        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Mark Resolved
                      `}
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-ticket" data-id="${t.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete Request
                    </button>
                  </div>
                </div>
              `;
            }).join('');

            // Bind resolve handler
            helpRequestsContainer.querySelectorAll('.btn-resolve-ticket').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Updating...';
                refreshIcons();
                try {
                  await api.resolveHelpRequest(id);
                  await renderAdminDashboardView(currentHash);
                } catch (err) {
                  alert(err.message || 'Failed to update request');
                  btn.disabled = false;
                  btn.innerHTML = originalHTML;
                  refreshIcons();
                }
              });
            });

            // Bind delete handler
            helpRequestsContainer.querySelectorAll('.btn-delete-ticket').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('Are you sure you want to permanently delete this help request?')) return;
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Deleting...';
                refreshIcons();
                try {
                  await api.deleteHelpRequest(id);
                  await renderAdminDashboardView(currentHash);
                } catch (err) {
                  alert(err.message || 'Failed to delete request');
                  btn.disabled = false;
                  btn.innerHTML = originalHTML;
                  refreshIcons();
                }
              });
            });

            // Bind Link Requested Email handler
            helpRequestsContainer.querySelectorAll('.btn-link-requested-email').forEach(btn => {
              btn.addEventListener('click', () => {
                const phone = btn.getAttribute('data-phone');
                const name = btn.getAttribute('data-name');
                const email = btn.getAttribute('data-email');
                openAdminEditEmailModal({ phone, name, email });
              });
            });

            // Render Show More button for Support requests if needed
            const supportShowMoreContainer = document.getElementById('support-show-more-container');
            const supportRemaining = tickets.length - helpRequestsVisibleCount;
            if (supportShowMoreContainer) {
              if (supportRemaining > 0) {
                supportShowMoreContainer.innerHTML = `
                  <button id="btn-support-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                    Show More (${supportRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                  </button>
                `;
                document.getElementById('btn-support-show-more').addEventListener('click', () => {
                  helpRequestsVisibleCount += 10;
                  renderAdminDashboardView(currentHash);
                });
              } else {
                supportShowMoreContainer.innerHTML = '';
              }
            }
          }
        } catch (err) {
          console.error('Error fetching help requests:', err);
          helpRequestsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load support requests: ${escapeHTML(err.message)}</div>`;
        }
      }
    };

    const fetchNotifications = async () => {
      const superadminMessagesSection = document.getElementById('admin-section-notifications');
      const superadminMessagesContainer = document.getElementById('superadmin-messages-list-container');
      const superadminMessagesCount = document.getElementById('superadmin-messages-count');

      if ((currentUser.role === 'superadmin' || currentUser.role === 'admin') && superadminMessagesSection && superadminMessagesContainer && superadminMessagesCount) {
        superadminMessagesSection.style.display = 'block';
        superadminMessagesContainer.innerHTML = getListSkeleton();

        try {
          const notifications = await api.getAllNotifications();
          superadminMessagesCount.textContent = notifications.length;

          if (notifications.length === 0) {
            superadminMessagesContainer.innerHTML = '<div class="empty-state">No notification messages sent yet.</div>';
            const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
            if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
          } else {
            const slicedNotifications = notifications.slice(0, notificationsVisibleCount);

            superadminMessagesContainer.innerHTML = slicedNotifications.map(n => {
              const seenLabelClass = n.read ? 'status-badge-resolved' : 'status-badge-pending';
              const seenText = n.read ? 'seen' : 'unseen';
              const seenIcon = n.read ? 'eye' : 'eye-off';
              
              return `
                <div class="ticket-card" style="border-left: 4px solid ${n.read ? '#10b981' : '#eab308'}; margin-bottom: 12px; padding: 14px 16px;">
                  <div class="ticket-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="ticket-user-info">
                      <h5 style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">
                        To: ${escapeHTML(capitalizeName(n.recipient.name))} (${escapeHTML(n.recipient.phone)})
                      </h5>
                      <span style="font-size: 11px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px;">
                        <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span class="ticket-status-badge ${seenLabelClass}" style="text-transform: capitalize; padding: 2px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                      <i data-lucide="${seenIcon}" style="width: 12px; height: 12px;"></i> ${seenText}
                    </span>
                  </div>
                  <div class="ticket-message" style="font-size: 13px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap;">${escapeHTML(n.message)}</div>
                  <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 10px;">
                    ${!n.read ? `
                      <button class="btn btn-secondary btn-sm btn-edit-notification" data-id="${n.id}" data-raw="${escapeHTML(n.rawMessage)}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; background-color: #f1f5f9; border-color: #cbd5e1; color: #475569;">
                        <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i> Edit Message
                      </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm btn-delete-notification" data-id="${n.id}" style="padding: 4px 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">
                      <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Delete
                    </button>
                  </div>
                </div>
              `;
            }).join('');

            // Bind Edit button click
            superadminMessagesContainer.querySelectorAll('.btn-edit-notification').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const rawMessage = btn.getAttribute('data-raw');
                
                const newMsgBody = prompt('Edit your message body:', rawMessage);
                if (newMsgBody === null) return; // user cancelled
                
                if (!newMsgBody.trim()) {
                  alert('Message body cannot be empty');
                  return;
                }

                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Saving...';

                try {
                  await api.updateNotification(id, newMsgBody.trim());
                  await renderAdminDashboardView(currentHash);
                } catch (err) {
                  alert(err.message || 'Failed to update message');
                  btn.disabled = false;
                  btn.innerHTML = originalHTML;
                  refreshIcons();
                }
              });
            });

            // Bind Delete button click
            superadminMessagesContainer.querySelectorAll('.btn-delete-notification').forEach(btn => {
              btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('Are you sure you want to delete this message?')) return;
                
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = 'Deleting...';

                try {
                  await api.deleteNotification(id);
                  await renderAdminDashboardView(currentHash);
                } catch (err) {
                  alert(err.message || 'Failed to delete message');
                  btn.disabled = false;
                  btn.innerHTML = originalHTML;
                  refreshIcons();
                }
              });
            });

            // Render Show More button for Sent notifications if needed
            const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
            const messagesRemaining = notifications.length - notificationsVisibleCount;
            if (messagesShowMoreContainer) {
              if (messagesRemaining > 0) {
                messagesShowMoreContainer.innerHTML = `
                  <button id="btn-messages-show-more" class="btn btn-secondary" style="display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; font-weight: 600;">
                    Show More (${messagesRemaining} remaining) <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
                  </button>
                `;
                document.getElementById('btn-messages-show-more').addEventListener('click', () => {
                  notificationsVisibleCount += 10;
                  renderAdminDashboardView(currentHash);
                });
              } else {
                messagesShowMoreContainer.innerHTML = '';
              }
            }
          }
        } catch (err) {
          console.error('Error fetching sent notifications:', err);
          superadminMessagesContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load sent notifications: ${escapeHTML(err.message)}</div>`;
        }
      } else if (superadminMessagesSection) {
        superadminMessagesSection.style.display = 'none';
        const messagesShowMoreContainer = document.getElementById('messages-show-more-container');
        if (messagesShowMoreContainer) messagesShowMoreContainer.innerHTML = '';
      }
    };

    const fetchReviews = async () => {
      const reviewsContainer = document.getElementById('admin-reviews-list-container');
      const reviewsCount = document.getElementById('admin-reviews-count');
      const reviewsAverage = document.getElementById('admin-reviews-average');

      if (reviewsContainer && reviewsCount && reviewsAverage) {
        reviewsContainer.innerHTML = getListSkeleton();

        try {
          const reviews = await api.getAllReviews();
          reviewsCount.textContent = reviews.length;

          if (reviews.length === 0) {
            reviewsAverage.textContent = '0.0';
            reviewsContainer.innerHTML = '<div class="empty-state">No reviews submitted yet.</div>';
            const reviewsShowMoreContainer = document.getElementById('reviews-show-more-container');
            if (reviewsShowMoreContainer) reviewsShowMoreContainer.innerHTML = '';
          } else {
            // Calculate average
            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            const avg = (sum / reviews.length).toFixed(1);
            reviewsAverage.textContent = avg;

            // Support show-more pagination for reviews
            const slicedReviews = reviews.slice(0, reviewsVisibleCount);

            reviewsContainer.innerHTML = slicedReviews.map(r => {
              let starsHTML = '';
              for (let i = 1; i <= 5; i++) {
                const color = i <= r.rating ? 'var(--warning)' : '#cbd5e1';
                const fill = i <= r.rating ? 'var(--warning)' : 'none';
                starsHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
              }

              return `
                <div class="ticket-card" style="border-left: 5px solid ${r.rating >= 4 ? 'var(--success)' : (r.rating <= 2 ? 'var(--danger)' : 'var(--warning)')}; margin-bottom: 12px; padding: 14px 16px;">
                  <div class="ticket-header" style="border-bottom: 1px dashed var(--border-color); padding-bottom: 12px; margin-bottom: 14px;">
                    <div class="ticket-user-info">
                      <h5 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 2px;">${escapeHTML(capitalizeName(r.name))}</h5>
                      <div class="ticket-user-meta" style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);">
                        <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style="display: flex; gap: 2px;">
                      ${starsHTML}
                    </div>
                  </div>
                  <div class="ticket-message" style="font-size: 14px; color: var(--text-main); background-color: rgba(243, 248, 255, 0.3); padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05); line-height: 1.5; white-space: pre-wrap; margin-top: 4px;">${escapeHTML(r.comment) || '<span style="font-style: italic; color: var(--text-muted);">No comment review left.</span>'}</div>
                  <div class="ticket-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 14px;">
                    <button class="btn btn-danger btn-sm btn-delete-review" data-id="${r.id}" style="padding: 6px 12px; display: flex; align-items: center; gap: 4px;">
                      <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete Review
                    </button>
                  </div>
                </div>
              `;
            }).join('');

            // Bind delete review handler
            reviewsContainer.querySelectorAll('.btn-delete-review').forEach(btn => {
              btn.addEventListener('click', async () => {
                if (!confirm('Permanently delete this user review?')) return;
                const id = btn.getAttribute('data-id');
                const originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Deleting...';
                refreshIcons();
                try {
                  await api.deleteReview(id);
                  await renderAdminDashboardView(currentHash);
                } catch (err) {
                  alert(err.message || 'Deletion failed');
                  btn.disabled = false;
                  btn.innerHTML = originalHTML;
                  refreshIcons();
                }
              });
            });

            // Render show-more pagination button
            const reviewsShowMoreContainer = document.getElementById('reviews-show-more-container');
            if (reviewsShowMoreContainer) {
              const reviewsRemaining = reviews.length - reviewsVisibleCount;
              if (reviewsRemaining > 0) {
                reviewsShowMoreContainer.innerHTML = `
                  <button id="btn-reviews-show-more" class="btn btn-secondary btn-sm" style="padding: 8px 16px;">
                    Show More Reviews (${reviewsRemaining} remaining)
                  </button>
                `;
                document.getElementById('btn-reviews-show-more').addEventListener('click', async () => {
                  reviewsVisibleCount += 10;
                  await renderAdminDashboardView(currentHash);
                });
              } else {
                reviewsShowMoreContainer.innerHTML = '';
              }
            }
          }
        } catch (err) {
          console.error('Load reviews view error:', err);
          reviewsContainer.innerHTML = `<div class="alert alert-danger">Error loading reviews: ${err.message}</div>`;
        }
      }
    };

    // Execute fetches depending on isMobile vs Desktop View
    if (!isMobile) {
      // Desktop: Fetch and display EVERYTHING in parallel
      await Promise.all([
        fetchApprovals(),
        fetchUsers(),
        fetchContributions(),
        fetchSupport(),
        fetchNotifications(),
        fetchReviews()
      ]);
    } else {
      // Mobile: Fetch ONLY the active section's data
      if (currentHash === '/admin/approvals') {
        await fetchApprovals();
      } else if (currentHash === '/admin/users') {
        await fetchUsers();
      } else if (currentHash === '/admin/contributions') {
        await fetchContributions();
      } else if (currentHash === '/admin/support') {
        await fetchSupport();
      } else if (currentHash === '/admin/notifications') {
        await fetchNotifications();
      } else if (currentHash === '/admin/reviews') {
        await fetchReviews();
      }
    }

    // Scroll to query-params (only on PC / Desktop)
    if (!isMobile) {
      setTimeout(() => {
        const params = getHashQueryParams();
        if (params.tab === 'users') {
          const directorySection = document.getElementById('admin-user-search-input');
          if (directorySection) directorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (params.tab === 'pending') {
          const pendingSection = document.getElementById('pending-users-list-container');
          if (pendingSection) pendingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (params.tab === 'reviews') {
          const reviewsSection = document.getElementById('admin-reviews-list-container');
          if (reviewsSection) reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }

    refreshIcons();
  } catch (err) {
    errorAlert.textContent = err.message || 'Failed to load control panel directory';
    errorAlert.style.display = 'block';
  }
}

// --- MODAL UTILITIES ---

function closeAllModals() {
  document.getElementById('modal-folder').style.display = 'none';
  document.getElementById('modal-upload').style.display = 'none';
  if (document.getElementById('modal-edit-document')) document.getElementById('modal-edit-document').style.display = 'none';
  if (document.getElementById('modal-move-document')) document.getElementById('modal-move-document').style.display = 'none';
  if (document.getElementById('modal-send-message')) document.getElementById('modal-send-message').style.display = 'none';
  if (document.getElementById('modal-view-notification')) document.getElementById('modal-view-notification').style.display = 'none';

  // Stop active camera stream if any
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
  const galleryWrapper = document.getElementById('scan-gallery-and-actions');
  if (streamWrapper) streamWrapper.style.display = 'none';
  if (galleryWrapper) galleryWrapper.style.display = 'block';
}

function openFolderModal(sectionType, folderId = '', folderName = '') {
  document.getElementById('modal-folder-id').value = folderId;
  document.getElementById('modal-folder-section-type').value = sectionType;
  document.getElementById('modal-folder-name').value = folderName;
  
  const title = document.getElementById('modal-folder-title');
  if (folderId) {
    title.textContent = 'Rename Subject Folder';
  } else {
    title.textContent = 'Add Subject Folder';
  }

  document.getElementById('modal-folder').style.display = 'flex';
  document.getElementById('modal-folder-name').focus();
}

// Compress image client side using Canvas to Jpeg 0.7
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          dataUrl,
          width,
          height
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderScanPreviewGallery() {
  const gallery = document.getElementById('scan-preview-gallery');
  const container = document.getElementById('scan-preview-container');
  const btnClear = document.getElementById('btn-scan-clear');
  
  if (!gallery) return;
  
  gallery.innerHTML = '';
  
  if (scanImages.length === 0) {
    if (container) container.style.display = 'none';
    if (btnClear) btnClear.style.display = 'none';
    return;
  }
  
  if (container) container.style.display = 'block';
  if (btnClear) btnClear.style.display = 'inline-block';
  
  scanImages.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'scan-thumbnail-item';
    item.style.cssText = 'position: relative; border-radius: var(--radius-sm); border: 1px solid var(--border-color); overflow: hidden; aspect-ratio: 3/4; display: flex; flex-direction: column; background: #000; box-shadow: var(--shadow-sm);';
    
    item.innerHTML = `
      <img src="${img.dataUrl}" class="scan-thumbnail-img" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" />
      <div class="scan-thumb-controls" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: space-between; align-items: center; padding: 4px; z-index: 2;">
        <button type="button" class="thumb-control-btn btn-left" style="background: none; border: none; color: #fff; padding: 2px; cursor: pointer; display: flex; align-items: center; opacity: ${idx === 0 ? 0.3 : 1};" ${idx === 0 ? 'disabled' : ''}>
          <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
        </button>
        <span class="thumb-page-num" style="color: #fff; font-size: 10px; font-weight: bold;">P. ${idx + 1}</span>
        <button type="button" class="thumb-control-btn btn-right" style="background: none; border: none; color: #fff; padding: 2px; cursor: pointer; display: flex; align-items: center; opacity: ${idx === scanImages.length - 1 ? 0.3 : 1};" ${idx === scanImages.length - 1 ? 'disabled' : ''}>
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
      <button type="button" class="thumb-edit-btn" style="position: absolute; top: 4px; left: 4px; background: rgba(37, 99, 235, 0.9); border: none; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; padding: 0;">
        <i data-lucide="pencil" style="width: 12px; height: 12px;"></i>
      </button>
      <button type="button" class="thumb-delete-btn" style="position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); border: none; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; padding: 0;">
        <i data-lucide="x" style="width: 12px; height: 12px;"></i>
      </button>
    `;
    
    item.querySelector('.btn-left').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx > 0) {
        const temp = scanImages[idx];
        scanImages[idx] = scanImages[idx - 1];
        scanImages[idx - 1] = temp;
        renderScanPreviewGallery();
      }
    });
    
    item.querySelector('.btn-right').addEventListener('click', (e) => {
      e.stopPropagation();
      if (idx < scanImages.length - 1) {
        const temp = scanImages[idx];
        scanImages[idx] = scanImages[idx + 1];
        scanImages[idx + 1] = temp;
        renderScanPreviewGallery();
      }
    });

    item.querySelector('.thumb-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      loadEditor(idx);
    });
    
    item.querySelector('.thumb-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      scanImages.splice(idx, 1);
      renderScanPreviewGallery();
    });
    
    gallery.appendChild(item);
  });
  
  if (window.lucide) {
    window.refreshIcons();
  }
}

// --- SCAN IMAGE EDITOR UTILITIES ---

function updateSliderLabels() {
  document.getElementById('val-crop-left').textContent = document.getElementById('range-crop-left').value;
  document.getElementById('val-crop-right').textContent = document.getElementById('range-crop-right').value;
  document.getElementById('val-crop-top').textContent = document.getElementById('range-crop-top').value;
  document.getElementById('val-crop-bottom').textContent = document.getElementById('range-crop-bottom').value;
}

function drawEditorCanvas(applyCrop = false) {
  const canvas = document.getElementById('editor-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const origW = editorImg.width;
  const origH = editorImg.height;
  
  // Crop parameters (fractions of original size)
  const cL = parseFloat(document.getElementById('range-crop-left').value) / 100;
  const cR = parseFloat(document.getElementById('range-crop-right').value) / 100;
  const cT = parseFloat(document.getElementById('range-crop-top').value) / 100;
  const cB = parseFloat(document.getElementById('range-crop-bottom').value) / 100;
  
  // Crop bounds on original image
  const cropX = origW * cL;
  const cropY = origH * cT;
  const cropW = origW * (1 - cL - cR);
  const cropH = origH * (1 - cT - cB);
  
  // Set dimensions based on rotation
  const is90or270 = (editorRotation === 90 || editorRotation === 270);
  const renderW = applyCrop ? cropW : origW;
  const renderH = applyCrop ? cropH : origH;
  
  canvas.width = is90or270 ? renderH : renderW;
  canvas.height = is90or270 ? renderW : renderH;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Translate and rotate around center
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((editorRotation * Math.PI) / 180);
  
  const drawW = applyCrop ? cropW : origW;
  const drawH = applyCrop ? cropH : origH;
  const drawX = applyCrop ? cropX : 0;
  const drawY = applyCrop ? cropY : 0;
  
  ctx.drawImage(
    editorImg,
    drawX, drawY, drawW, drawH,
    -renderW / 2, -renderH / 2, renderW, renderH
  );
  
  ctx.restore();
  
  // Apply image filters (B&W or grayscale)
  if (editorFilter === 'gray' || editorFilter === 'bw') {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      if (editorFilter === 'bw') {
        // High-contrast document scanner filter threshold
        gray = (gray > 120) ? 255 : 0;
      }
      
      data[i] = gray;
      data[i+1] = gray;
      data[i+2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  
  // Draw crop guides overlay if not compiling final cropped image
  if (!applyCrop && (cL > 0 || cR > 0 || cT > 0 || cB > 0)) {
    ctx.save();
    
    // Transform coordinates back to current rotation space to draw overlay
    if (editorRotation === 90) {
      ctx.translate(canvas.width, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (editorRotation === 180) {
      ctx.translate(canvas.width, canvas.height);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (editorRotation === 270) {
      ctx.translate(0, canvas.height);
      ctx.rotate((270 * Math.PI) / 180);
    }
    
    // Draw Guidelines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    
    // Darken cropped margins
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    // Top
    ctx.fillRect(0, 0, origW, cropY);
    // Bottom
    ctx.fillRect(0, cropY + cropH, origW, origH - cropY - cropH);
    // Left
    ctx.fillRect(0, cropY, cropX, cropH);
    // Right
    ctx.fillRect(cropX + cropW, cropY, origW - cropX - cropW, cropH);
    
    ctx.restore();
  }
}

function loadEditor(idx) {
  editingIndex = idx;
  editorRotation = 0;
  editorFilter = 'original';
  
  // Reset crop sliders
  document.getElementById('range-crop-left').value = 0;
  document.getElementById('range-crop-right').value = 0;
  document.getElementById('range-crop-top').value = 0;
  document.getElementById('range-crop-bottom').value = 0;
  updateSliderLabels();
  
  // Show loading indicator or block UI
  editorImg.onload = function() {
    drawEditorCanvas();
    const modal = document.getElementById('modal-image-editor');
    if (modal) modal.style.display = 'flex';
  };
  editorImg.src = scanImages[idx].dataUrl;
}

// Initializing event listeners for the editor
function initEditorEventHandlers() {
  const btnRotate = document.getElementById('btn-editor-rotate');
  const btnFilterBw = document.getElementById('btn-editor-filter-bw');
  const btnFilterGray = document.getElementById('btn-editor-filter-gray');
  const btnReset = document.getElementById('btn-editor-reset');
  const btnSave = document.getElementById('btn-editor-save');
  const btnCancel = document.getElementById('modal-image-editor-cancel');
  const btnClose = document.getElementById('modal-image-editor-close');
  
  const sliders = [
    'range-crop-left',
    'range-crop-right',
    'range-crop-top',
    'range-crop-bottom'
  ];

  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      editorRotation = (editorRotation + 90) % 360;
      drawEditorCanvas();
    });
  }

  if (btnFilterBw) {
    btnFilterBw.addEventListener('click', () => {
      editorFilter = (editorFilter === 'bw') ? 'original' : 'bw';
      drawEditorCanvas();
    });
  }

  if (btnFilterGray) {
    btnFilterGray.addEventListener('click', () => {
      editorFilter = (editorFilter === 'gray') ? 'original' : 'gray';
      drawEditorCanvas();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      editorRotation = 0;
      editorFilter = 'original';
      sliders.forEach(id => {
        document.getElementById(id).value = 0;
      });
      updateSliderLabels();
      drawEditorCanvas();
    });
  }

  sliders.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateSliderLabels();
        drawEditorCanvas();
      });
    }
  });

  const closeEditorModal = () => {
    const modal = document.getElementById('modal-image-editor');
    if (modal) modal.style.display = 'none';
  };

  if (btnCancel) btnCancel.addEventListener('click', closeEditorModal);
  if (btnClose) btnClose.addEventListener('click', closeEditorModal);

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      // Compile canvas output with crop applied
      drawEditorCanvas(true);
      const canvas = document.getElementById('editor-canvas');
      if (canvas && editingIndex !== null) {
        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        scanImages[editingIndex] = {
          dataUrl: finalDataUrl,
          width: canvas.width,
          height: canvas.height
        };
        closeEditorModal();
        renderScanPreviewGallery();
      }
    });
  }
}

function openUploadModal(docType, folderId = null, folderName = '') {
  document.getElementById('upload-error-alert').style.display = 'none';
  document.getElementById('upload-section-type').value = docType;
  document.getElementById('upload-folder-id').value = folderId || '';
  document.getElementById('upload-folder-name').value = folderName;
  
  const titleEl = document.getElementById('modal-upload-title');
  const subjectDisplayGroup = document.getElementById('upload-subject-display-group');
  const subjectDisplayInp = document.getElementById('upload-doc-subject-display');
  const syllabusGroup = document.getElementById('upload-syllabus-subject-group');
  
  // Set upload title heading
  if (docType === 'notes') {
    titleEl.textContent = 'Upload Notes PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'paper') {
    titleEl.textContent = 'Upload Previous Year Paper (PYQ) PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'lab_manual') {
    titleEl.textContent = 'Upload Lab Manual PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'book') {
    titleEl.textContent = 'Upload Book PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'competitive') {
    titleEl.textContent = 'Upload Competitive Exam PYQ PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'simulation' || docType === 'roadmap') {
    titleEl.textContent = 'Upload Simulation File / PDF';
    subjectDisplayGroup.style.display = 'block';
    subjectDisplayInp.value = folderName;
    syllabusGroup.style.display = 'none';
  } else if (docType === 'syllabus') {
    titleEl.textContent = 'Upload Syllabus PDF';
    subjectDisplayGroup.style.display = 'none';
    syllabusGroup.style.display = 'block';
    
    // Load Note Folders to populate syllabus subject tag drop down
    const selectEl = document.getElementById('upload-syllabus-subject-select');
    selectEl.innerHTML = '<option value="Syllabus">General Syllabus</option>';
    notesFoldersList.forEach(n => {
      selectEl.innerHTML += `<option value="${escapeHTML(n.name)}">${escapeHTML(n.name)}</option>`;
    });
  }

  // Reset upload source mode and UI tabs
  uploadSourceMode = 'file';
  const tabFileEl = document.getElementById('tab-upload-file');
  const tabLinkEl = document.getElementById('tab-upload-link');
  const tabScanEl = document.getElementById('tab-upload-scan');
  if (tabFileEl) tabFileEl.classList.add('active');
  if (tabLinkEl) tabLinkEl.classList.remove('active');
  if (tabScanEl) tabScanEl.classList.remove('active');
  
  const groupFileEl = document.getElementById('group-upload-file');
  const groupLinkEl = document.getElementById('group-upload-link');
  const groupScanEl = document.getElementById('group-upload-scan');
  if (groupFileEl) groupFileEl.style.display = 'block';
  if (groupLinkEl) groupLinkEl.style.display = 'none';
  if (groupScanEl) groupScanEl.style.display = 'none';
  
  const linkInputEl = document.getElementById('upload-link-input');
  if (linkInputEl) linkInputEl.value = '';

  // Clear file inputs
  document.getElementById('upload-doc-title').value = '';
  document.getElementById('upload-file-input').value = '';
  document.getElementById('upload-file-label').textContent = 'Click to browse files';
  
  const scanCameraInput = document.getElementById('scan-camera-input');
  const scanGalleryInput = document.getElementById('scan-gallery-input');
  if (scanCameraInput) scanCameraInput.value = '';
  if (scanGalleryInput) scanGalleryInput.value = '';
  scanImages = [];
  renderScanPreviewGallery();
  
  document.getElementById('modal-upload').style.display = 'flex';
}

// --- MY UPLOADS VIEW RENDERER ---
async function renderMyUploadsView() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  container.innerHTML = getListSkeleton();

  try {
    myUploadsDocsList = await api.getMyUploads();

    const uploadsCountEl = document.getElementById('stats-uploads-count');
    const uploadsLikesEl = document.getElementById('stats-uploads-likes');
    
    if (uploadsCountEl) {
      uploadsCountEl.textContent = myUploadsDocsList.length;
    }
    if (uploadsLikesEl) {
      let totalLikes = 0;
      myUploadsDocsList.forEach(doc => {
        totalLikes += doc.likesCount || 0;
      });
      uploadsLikesEl.textContent = totalLikes;
    }

    renderFilteredMyUploads();
  } catch (err) {
    console.error('Error loading my uploads:', err);
    container.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load uploaded documents: ${escapeHTML(err.message)}</div>`;
  }
}

function renderFilteredMyUploads() {
  const container = document.getElementById('my-uploads-list-container');
  if (!container) return;

  const searchInput = document.getElementById('my-uploads-search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = myUploadsDocsList.filter(doc => {
    const title = doc.title || '';
    const subject = doc.subject || '';
    const type = doc.type || '';
    return title.toLowerCase().includes(query) || 
           subject.toLowerCase().includes(query) ||
           type.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${query ? 'No matching documents found.' : 'You have not uploaded any documents yet.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="docs-list">
      ${filtered.map(doc => {
        let displayType = doc.type;
        if (doc.type === 'notes') displayType = 'Note';
        else if (doc.type === 'paper') displayType = 'PYQ/Paper';
        else if (doc.type === 'lab_manual') displayType = 'Lab Manual';
        else if (doc.type === 'book') displayType = 'Book';
        else if (doc.type === 'syllabus') displayType = 'Syllabus';
        else if (doc.type === 'competitive') displayType = 'Competitive Exam PYQ';

        return `
          <div class="doc-card">
            <div class="doc-info">
              <div class="doc-icon-container" style="background-color: var(--primary-accent); color: var(--primary-dark);">
                <i data-lucide="file-text" style="width: 20px; height: 20px;"></i>
              </div>
              <div class="doc-meta">
                <h5>${escapeHTML(doc.title)} <span class="user-tag" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 11px;">${displayType}</span></h5>
                <div class="doc-meta-details">
                  <span>Subject: ${escapeHTML(doc.subject || 'General')}</span>
                  <span>&bull;</span>
                  <span>Year: ${escapeHTML(doc.year || 'N/A')}</span>
                  <span>&bull;</span>
                  <span>Uploaded: ${new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div class="doc-actions">
              <a href="${doc.fileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="padding: 8px 12px;">
                <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
              </a>
              <button class="btn btn-secondary btn-sm btn-edit-uploaded-doc" 
                data-id="${doc.id}" 
                data-title="${escapeHTML(doc.title)}" 
                data-subject="${escapeHTML(doc.subject || '')}" 
                data-year="${escapeHTML(doc.year || '')}"
                style="padding: 8px 12px;">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i> Edit
              </button>
              ${(currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) ? `
                <button class="btn btn-secondary btn-sm btn-move-doc" data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" style="padding: 8px 12px;" title="Shift Document">
                  <i data-lucide="folder-sync" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
              <button class="btn btn-danger btn-sm btn-delete-uploaded-doc" data-id="${doc.id}" style="padding: 8px 12px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach event handlers to dynamic edit buttons
  container.querySelectorAll('.btn-edit-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const subject = btn.getAttribute('data-subject');
      const year = btn.getAttribute('data-year');
      openEditDocumentModal(id, title, subject, year);
    });
  });

  // Attach event handlers to dynamic delete buttons
  container.querySelectorAll('.btn-delete-uploaded-doc').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this document permanently?')) return;
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
      refreshIcons();
      try {
        await api.deleteDocument(id);
        await renderMyUploadsView();
      } catch (err) {
        alert(err.message || 'Failed to delete document');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  });

  refreshIcons();
}

function openEditDocumentModal(docId, title, subject, year) {
  document.getElementById('edit-doc-id').value = docId;
  document.getElementById('edit-doc-title').value = title;
  document.getElementById('edit-doc-subject').value = subject;
  
  const yearSelect = document.getElementById('edit-doc-year');
  if (yearSelect) {
    yearSelect.value = year;
  }
  
  document.getElementById('edit-doc-error-alert').style.display = 'none';
  document.getElementById('modal-edit-document').style.display = 'flex';
}

function openMoveDocumentModal(docId, docTitle) {
  document.getElementById('move-doc-id').value = docId;
  document.getElementById('move-doc-section').value = '';
  document.getElementById('move-doc-folder-group').style.display = 'none';
  document.getElementById('move-doc-folder').removeAttribute('required');
  document.getElementById('move-doc-error-alert').style.display = 'none';
  
  const titleEl = document.querySelector('#modal-move-document .modal-title');
  if (titleEl) {
    titleEl.textContent = `Shift Document: ${docTitle}`;
  }
  
  document.getElementById('modal-move-document').style.display = 'flex';
}

async function loadSupportHistory() {
  const historyList = document.getElementById('support-history-list');
  if (!historyList) return;

  if (!currentUser) {
    return;
  }

  historyList.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 12px 0;">Loading history...</div>';

  try {
    const list = await api.getMyHelpRequests();
    if (list.length === 0) {
      historyList.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px 0;">No support requests submitted yet.</div>';
    } else {
      historyList.innerHTML = list.map(item => {
        const isResolved = item.status === 'resolved';
        return `
          <div style="padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background-color: var(--bg-card); display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
              <h4 style="font-size: 14px; font-weight: 700; color: var(--primary-dark); margin: 0; line-height: 1.4;">
                Subject: ${escapeHTML(item.subject)}
              </h4>
              <span class="user-tag" style="margin: 0; padding: 4px 10px; font-size: 10px; font-weight: 700; border-radius: 20px; background-color: ${isResolved ? '#dcfce7' : '#fee2e2'}; color: ${isResolved ? '#166534' : '#991b1b'}; display: inline-flex; align-items: center; gap: 4px; border: 1px solid ${isResolved ? '#bbf7d0' : '#fecaca'};">
                <i data-lucide="${isResolved ? 'check-circle' : 'clock'}" style="width: 12px; height: 12px;"></i>
                ${isResolved ? 'Resolved' : 'Pending'}
              </span>
            </div>
            <p style="font-size: 13px; color: var(--text-main); margin: 0; white-space: pre-wrap; line-height: 1.5; background-color: rgba(30, 86, 160, 0.02); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(30, 86, 160, 0.05);">${escapeHTML(item.message)}</p>
            <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
              <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
              Submitted: ${new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load support history:', err);
    historyList.innerHTML = '<div style="font-size: 13px; color: var(--danger); text-align: center; padding: 12px 0;">Failed to load support history.</div>';
  }
  refreshIcons();
}

// HELP & SUPPORT VIEW
async function renderSupportView() {
  const errorAlert = document.getElementById('support-error-alert');
  const successAlert = document.getElementById('support-success-alert');

  errorAlert.style.display = 'none';
  successAlert.style.display = 'none';

  const nameInput = document.getElementById('support-user-name');
  const phoneInput = document.getElementById('support-user-phone');
  const roleInput = document.getElementById('support-user-role');

  if (currentUser) {
    nameInput.value = capitalizeName(currentUser.name);
    nameInput.disabled = true;
    phoneInput.value = currentUser.phone;
    phoneInput.disabled = true;
    
    let displayRole = currentUser.role;
    if (currentUser.role === 'educator') displayRole = 'Educator (Teacher)';
    else if (currentUser.role === 'superadmin') displayRole = 'Super Admin';
    roleInput.value = displayRole;
    roleInput.disabled = true;
  } else {
    nameInput.value = '';
    nameInput.disabled = false;
    nameInput.placeholder = 'Enter your name';
    nameInput.required = true;
    
    phoneInput.value = '';
    phoneInput.disabled = false;
    phoneInput.placeholder = 'Enter your phone number';
    phoneInput.required = true;
    
    roleInput.value = '';
    roleInput.disabled = false;
    roleInput.placeholder = 'e.g., student / educator';
    roleInput.required = true;
  }

  // Handle reason query parameter and prefill fields
  const params = getHashQueryParams();
  const noticeBanner = document.getElementById('support-email-request-notice');
  const reqEmailGroup = document.getElementById('support-requested-email-group');
  const reqEmailInput = document.getElementById('support-requested-email');

  if (params.reason === 'add-email') {
    if (noticeBanner) noticeBanner.style.display = 'flex';
    if (reqEmailGroup) reqEmailGroup.style.display = 'block';
    if (reqEmailInput) {
      reqEmailInput.value = '';
      reqEmailInput.required = true;
    }

    if (params.name) {
      nameInput.value = decodeURIComponent(params.name);
      nameInput.disabled = true;
    }
    if (params.phone) {
      phoneInput.value = decodeURIComponent(params.phone);
      phoneInput.disabled = true;
    }
    if (params.role) {
      let r = decodeURIComponent(params.role);
      if (r === 'educator') r = 'Educator (Teacher)';
      else if (r === 'superadmin') r = 'Super Admin';
      roleInput.value = r;
      roleInput.disabled = true;
    }

    document.getElementById('support-subject').value = 'Request to link email for password reset';
    document.getElementById('support-message').value = 'Hello Admin,\n\nI need to reset my password, but my account does not have a registered email address. Please link my email address specified above to my account so I can receive the password reset OTP.\n\nThank you!';
  } else if (params.reason === 'forgot-password') {
    if (noticeBanner) noticeBanner.style.display = 'none';
    if (reqEmailGroup) reqEmailGroup.style.display = 'none';
    if (reqEmailInput) {
      reqEmailInput.value = '';
      reqEmailInput.required = false;
    }
    document.getElementById('support-subject').value = 'Forgot Password Reset Request';
    document.getElementById('support-message').value = 'Hello, I forgot my password. Please reset my password to the default 123456. Thank you!';
  } else {
    if (noticeBanner) noticeBanner.style.display = 'none';
    if (reqEmailGroup) reqEmailGroup.style.display = 'none';
    if (reqEmailInput) {
      reqEmailInput.value = '';
      reqEmailInput.required = false;
    }
    document.getElementById('support-subject').value = '';
    document.getElementById('support-message').value = '';
  }

  const showHistoryBtn = document.getElementById('btn-show-support-history');
  if (showHistoryBtn) {
    showHistoryBtn.style.display = currentUser ? 'block' : 'none';
  }

  refreshIcons();
}

// --- MOBILE BOTTOM NAV ANIMATION ENGINE (MENISCUS LIQUID NAVIGATION) ---
const Meniscus = {
  initialized: false,
  x: 0,
  v: 0,
  target: 0,
  dragging: false,
  raf: 0,
  last: 0,
  current: 0,
  suppressClick: false,
  pid: null,
  startX: 0,
  
  G: { W: 0, H: 0, R: 17, D: 46, RB: 29, S: 10, CY: 0, slots: [], span: 80 },
  
  reach(s, rb, by) {
    return Math.sqrt(Math.max((s + rb) ** 2 - (s - by) ** 2, 1));
  },
  
  clamp(v, a, b) {
    return (v < a ? a : v > b ? b : v);
  },
  
  smooth(t) {
    return t * t * (3 - 2 * t);
  },
  
  mixRGB(a, b, t) {
    return `${Math.round(a[0] + (b[0] - a[0]) * t)} ${Math.round(a[1] + (b[1] - a[1]) * t)} ${Math.round(a[2] + (b[2] - a[2]) * t)}`;
  },

  measure() {
    const dock = document.getElementById('dock');
    const svg = document.getElementById('skin');
    if (!dock || !svg) return false;
    
    const r = dock.getBoundingClientRect();
    const W = Math.round(r.width);
    const H = Math.round(r.height);
    if (W < 40 || H < 30) return false;

    if (this._lastW === W && this._lastH === H) {
      return true;
    }
    this._lastW = W;
    this._lastH = H;

    const tabs = [...document.querySelectorAll('.mobile-bottom-nav-item')];
    this.G.slots = tabs.map((t) => {
      const b = t.getBoundingClientRect();
      return b.left - r.left + b.width / 2;
    });
    this.G.span = this.G.slots.length > 1 ? this.G.slots[1] - this.G.slots[0] : W;

    this.G.W = W;
    this.G.H = H;
    this.G.R = this.clamp(H * 0.20, 13, 20);
    this.G.CY = 0;

    let D = Math.min(H * 0.68, this.G.span * 0.78);
    const room = this.G.slots[0] - this.G.R - 6;
    for (let i = 0; i < 3; i++) {
      const hw = this.reach(D * 0.22, D / 2 + 6, this.G.CY);
      if (hw <= room) break;
      D *= room / hw;
    }
    this.G.D = Math.max(Math.round(D), 30);
    this.G.S = this.G.D * 0.22;
    this.G.RB = this.G.D / 2 + 6;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    dock.style.setProperty('--dock-r', `${this.G.R.toFixed(1)}px`);
    dock.style.setProperty('--bead-d', `${this.G.D}px`);
    dock.style.setProperty('--bead-cy', `${this.G.CY}px`);
    dock.style.setProperty('--rise', `${(H / 2 - this.G.CY).toFixed(1)}px`);
    return true;
  },

  trough(bx, by, rb, sL, sR) {
    const { W, H, R } = this.G;
    const wing = (s, side) => {
      const L = s + rb;
      const half = this.reach(s, rb, by);
      const sx = bx + side * half;
      return { sx, s, tx: sx + ((bx - sx) / L) * s, ty: s + ((by - s) / L) * s };
    };
    const A = wing(sL, -1);
    const B = wing(sR, +1);

    const a0 = Math.atan2(A.ty - by, A.tx - bx);
    const a1 = Math.atan2(B.ty - by, B.tx - bx);
    let sweep = ((a0 - a1) * 180) / Math.PI;
    while (sweep < 0) sweep += 360;
    const large = sweep > 180 ? 1 : 0;

    const n = (v) => v.toFixed(2);
    return (
      `M0 ${n(R)}` +
      `A${n(R)} ${n(R)} 0 0 1 ${n(R)} 0` +
      `L${n(this.clamp(A.sx, R, W - R))} 0` +
      `A${n(sL)} ${n(sL)} 0 0 1 ${n(A.tx)} ${n(A.ty)}` +
      `A${n(rb)} ${n(rb)} 0 ${large} 0 ${n(B.tx)} ${n(B.ty)}` +
      `A${n(sR)} ${n(sR)} 0 0 1 ${n(this.clamp(B.sx, R, W - R))} 0` +
      `L${n(W - R)} 0` +
      `A${n(R)} ${n(R)} 0 0 1 ${n(W)} ${n(R)}` +
      `L${n(W)} ${n(H - R)}` +
      `A${n(R)} ${n(R)} 0 0 1 ${n(W - R)} ${n(H)}` +
      `L${n(R)} ${n(H)}` +
      `A${n(R)} ${n(R)} 0 0 1 0 ${n(H - R)}` +
      `Z`
    );
  },

  paint() {
    const fillP = document.getElementById('skinFill');
    const bead = document.getElementById('bead');
    const tabs = [...document.querySelectorAll('.mobile-bottom-nav-item')];
    if (!fillP || !bead) return;
    if (typeof this.x !== 'number' || isNaN(this.x)) return;

    const q = this.clamp(this.v / 1100, -1, 1) * (this.dragging ? 0.5 : 1);
    const mag = Math.abs(q);

    const sL = this.clamp(this.G.S * (1 + 0.06 * mag + 0.40 * q), this.G.S * 0.55, this.G.S * 2.1);
    const sR = this.clamp(this.G.S * (1 + 0.06 * mag - 0.40 * q), this.G.S * 0.55, this.G.S * 2.1);

    const d = this.trough(this.x, this.G.CY, this.G.RB, sL, sR);
    fillP.setAttribute('d', d);

    const sx = 1 + 0.07 * mag;
    bead.style.transform = `translate3d(${this.x.toFixed(2)}px,0,0) scale(${sx.toFixed(3)},${(1 / sx).toFixed(3)})`;

    for (let i = 0; i < tabs.length; i++) {
      const dx = Math.abs(this.x - this.G.slots[i]);
      tabs[i].style.setProperty('--t', this.smooth(this.clamp(1 - dx / (this.G.span * 0.55), 0, 1)).toFixed(3));
    }
  },

  loop(now) {
    this.raf = 0;
    const dt = Math.min((now - this.last) / 1000, 1 / 30);
    this.last = now;

    const K = this.dragging ? 900 : 680;
    const C = this.dragging ? 52 : 36;
    let step = dt;
    while (step > 0) {
      const h = Math.min(step, 1 / 240);
      this.v += (-K * (this.x - this.target) - C * this.v) * h;
      this.x += this.v * h;
      step -= h;
    }

    this.paint();
    if (Math.abs(this.x - this.target) > 0.05 || Math.abs(this.v) > 0.6 || this.dragging) {
      this.run();
    } else {
      this.x = this.target;
      this.v = 0;
      this.paint();
    }
  },

  run() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame((now) => this.loop(now));
  },

  jump(to) {
    this.target = to;
    this.run();
  },

  select(i, { focus = false, animate = true, triggerNavigate = true } = {}) {
    const tabs = [...document.querySelectorAll('.mobile-bottom-nav-item')];
    if (tabs.length === 0) return;
    this.current = (i + tabs.length) % tabs.length;
    
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === this.current));
      t.tabIndex = n === this.current ? 0 : -1;
    });

    if (triggerNavigate) {
      const targetPath = tabs[this.current].getAttribute('href');
      if (targetPath) {
        let cleanTargetPath = targetPath;
        if (cleanTargetPath.startsWith('#/')) cleanTargetPath = cleanTargetPath.slice(1);
        else if (cleanTargetPath.startsWith('#')) cleanTargetPath = cleanTargetPath.slice(1);
        if (!cleanTargetPath.startsWith('/')) cleanTargetPath = '/' + cleanTargetPath;
        cleanTargetPath = cleanTargetPath.split('?')[0];

        let currentPath = window.location.pathname || '/';
        if (window.location.hash && window.location.hash.startsWith('#/')) {
          currentPath = window.location.hash.slice(1);
        } else if (window.location.hash && window.location.hash.startsWith('#') && window.location.hash.includes('/')) {
          currentPath = window.location.hash.slice(1);
        }
        currentPath = currentPath.split('?')[0];
        if (currentPath.endsWith('/') && currentPath.length > 1) {
          currentPath = currentPath.slice(0, -1);
        }
        if (!currentPath.startsWith('/')) {
          currentPath = '/' + currentPath;
        }

        const profileRoutes = [
          '/profile', '/reset-password', '/appearance', '/reviews', 
          '/contributors', '/my-uploads', '/my-contributions', 
          '/teacher-dashboard', '/support', '/generators', '/privacy', '/terms'
        ];
        if (currentPath.startsWith('/admin') || profileRoutes.includes(currentPath)) {
          currentPath = '/profile';
        }

        if (currentPath !== cleanTargetPath) {
          navigate(targetPath);
        }
      }
    }

    if (focus) tabs[this.current].focus();
    if (animate) {
      this.jump(this.G.slots[this.current]);
    } else {
      this.x = this.target = this.G.slots[this.current];
      this.v = 0;
      this.paint();
    }
  },

  init() {
    const dock = document.getElementById('dock');
    if (!dock) return;
    
    if (this.initialized) return;
    this.initialized = true;

    const tabs = [...document.querySelectorAll('.mobile-bottom-nav-item')];
    
    tabs.forEach((t, i) => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.suppressClick) {
          return;
        }
        this.select(i);
      });
    });

    dock.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.pid = e.pointerId;
      this.startX = e.clientX;
      this.suppressClick = false;
    });

    dock.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.pid) return;
      if (!this.dragging && Math.abs(e.clientX - this.startX) < 7) return;
      if (!this.dragging) {
        this.dragging = true;
        this.suppressClick = true;
        dock.classList.add('is-dragging');
        dock.setPointerCapture(this.pid);
      }
      e.preventDefault();
      const left = dock.getBoundingClientRect().left;
      this.target = this.clamp(e.clientX - left, this.G.slots[0], this.G.slots[this.G.slots.length - 1]);
      this.run();
    });

    const release = (e) => {
      if (e.pointerId !== this.pid) return;
      this.pid = null;
      if (!this.dragging) return;
      this.dragging = false;
      dock.classList.remove('is-dragging');
      let near = 0, nd = Infinity;
      this.G.slots.forEach((s, i) => {
        const d = Math.abs(this.target - s);
        if (d < nd) {
          nd = d;
          near = i;
        }
      });
      this.select(near);
      setTimeout(() => { this.suppressClick = false; }, 50);
    };

    dock.addEventListener('pointerup', release);
    dock.addEventListener('pointercancel', release);

    const layout = (animate) => {
      if (!this.measure()) return;
      if (animate) this.jump(this.G.slots[this.current]);
      else {
        this.x = this.target = this.G.slots[this.current];
        this.v = 0;
        this.paint();
      }
      dock.classList.add('is-ready');
    };

    layout(false);
    let resizeRaf = 0;
    new ResizeObserver(() => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        layout(false);
        resizeRaf = 0;
      });
    }).observe(dock);
    document.fonts?.ready.then(() => layout(false));
    
    // Sync initial state
    let cleanPath = window.location.pathname || '/';
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      cleanPath = window.location.hash.slice(1);
    } else if (window.location.hash && window.location.hash.startsWith('#') && window.location.hash.includes('/')) {
      cleanPath = window.location.hash.slice(1);
    }
    cleanPath = cleanPath.split('?')[0];
    if (cleanPath.endsWith('/') && cleanPath.length > 1) {
      cleanPath = cleanPath.slice(0, -1);
    }
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    // Map sub-sections to Profile tab
    const profileRoutes = [
      '/profile', '/reset-password', '/appearance', '/reviews', 
      '/contributors', '/my-uploads', '/my-contributions', 
      '/teacher-dashboard', '/support', '/generators', '/privacy', '/terms'
    ];
    if (cleanPath.startsWith('/admin') || profileRoutes.includes(cleanPath)) {
      cleanPath = '/profile';
    }

    const activeIndex = tabs.findIndex(tab => {
      let href = tab.getAttribute('href');
      if (href) {
        if (href.startsWith('#/')) href = href.slice(1);
        else if (href.startsWith('#')) href = href.slice(1);
        if (!href.startsWith('/')) href = '/' + href;
        href = href.split('?')[0];
        return href === cleanPath;
      }
      return false;
    });

    if (activeIndex !== -1 && this.G.slots.length > 0) {
      this.select(activeIndex, { animate: false, triggerNavigate: false });
    } else {
      this.select(2, { animate: false, triggerNavigate: false }); // Default to Home index
    }
  }
};

function updateMobileBottomNavPosition() {
  const tabs = [...document.querySelectorAll('.mobile-bottom-nav-item')];
  if (tabs.length === 0) return;
  
  if (!Meniscus.initialized) {
    Meniscus.init();
  }
  
  if (Meniscus.G.slots.length === 0) return;
  
  let cleanPath = window.location.pathname || '/';
  if (window.location.hash && window.location.hash.startsWith('#/')) {
    cleanPath = window.location.hash.slice(1);
  } else if (window.location.hash && window.location.hash.startsWith('#') && window.location.hash.includes('/')) {
    cleanPath = window.location.hash.slice(1);
  }
  cleanPath = cleanPath.split('?')[0];
  if (cleanPath.endsWith('/') && cleanPath.length > 1) {
    cleanPath = cleanPath.slice(0, -1);
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // Map sub-sections to Profile tab
  const profileRoutes = [
    '/profile', '/reset-password', '/appearance', '/reviews', 
    '/contributors', '/my-uploads', '/my-contributions', 
    '/teacher-dashboard', '/support', '/generators', '/privacy', '/terms'
  ];
  if (cleanPath.startsWith('/admin') || profileRoutes.includes(cleanPath)) {
    cleanPath = '/profile';
  }

  const activeIndex = tabs.findIndex(tab => {
    let href = tab.getAttribute('href');
    if (href) {
      if (href.startsWith('#/')) href = href.slice(1);
      else if (href.startsWith('#')) href = href.slice(1);
      if (!href.startsWith('/')) href = '/' + href;
      href = href.split('?')[0];
      return href === cleanPath;
    }
    return false;
  });

  if (activeIndex !== -1) {
    Meniscus.select(activeIndex, { animate: false, triggerNavigate: false });
  } else {
    Meniscus.select(2, { animate: false, triggerNavigate: false }); // Default to Home index
  }
}

// --- REVIEWS VIEW LOGIC ---
let selectedReviewRating = 0;

function initReviewEventHandlers() {
  const form = document.getElementById('form-review');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const comment = document.getElementById('review-comment').value;
      const errorAlert = document.getElementById('review-error-alert');
      const successAlert = document.getElementById('review-success-alert');
      const btnSubmit = document.getElementById('btn-submit-review');
      
      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';

      if (selectedReviewRating === 0) {
        errorAlert.textContent = 'Please select a rating (1-5 stars)';
        errorAlert.style.display = 'block';
        return;
      }

      btnSubmit.disabled = true;
      const originalHTML = btnSubmit.innerHTML;
      btnSubmit.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Submitting...';
      refreshIcons();

      try {
        await api.submitReview(selectedReviewRating, comment);
        successAlert.textContent = 'Thank you! Your review has been submitted successfully.';
        successAlert.style.display = 'block';
        form.reset();
        selectedReviewRating = 0;
        updateStarRatingDisplay(0);
        setTimeout(async () => {
          await renderReviewsView();
        }, 1500);
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to submit review';
        errorAlert.style.display = 'block';
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }

  // Star rating tap interaction
  const stars = document.querySelectorAll('.star-rating-input .star-btn');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      selectedReviewRating = val;
      document.getElementById('review-rating-value').value = val;
      updateStarRatingDisplay(val);
    });

    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.getAttribute('data-value'));
      updateStarRatingDisplay(val, true);
    });

    star.addEventListener('mouseleave', () => {
      updateStarRatingDisplay(selectedReviewRating);
    });
  });
}

function updateStarRatingDisplay(rating, isHover = false) {
  const stars = document.querySelectorAll('.star-rating-input .star-btn');
  stars.forEach((star, index) => {
    const starIcon = star.querySelector('svg') || star.querySelector('i');
    if (index < rating) {
      star.style.color = 'var(--warning)';
      if (starIcon) {
        starIcon.style.fill = 'var(--warning)';
      }
    } else {
      star.style.color = '#cbd5e1';
      if (starIcon) {
        starIcon.style.fill = 'none';
      }
    }
  });
}

// --- EMAIL LINK & UPDATE MODAL CONTROLLER ---
let isEmailModalCompulsory = false;

function checkCompulsoryEmail() {
  if (currentUser && !currentUser.email) {
    setTimeout(() => {
      openEmailModal({ compulsory: true });
    }, 250);
  }
}

function openEmailModal({ compulsory = false } = {}) {
  const modal = document.getElementById('modal-email');
  const titleText = document.getElementById('modal-email-title-text');
  const closeBtn = document.getElementById('modal-email-close');
  const cancelBtn = document.getElementById('btn-modal-email-cancel');
  const noticeEl = document.getElementById('modal-email-notice');
  const errorEl = document.getElementById('modal-email-error');
  const successEl = document.getElementById('modal-email-success');
  const inputEmail = document.getElementById('input-modal-email');
  const submitText = document.getElementById('text-modal-email-submit');

  if (!modal || !inputEmail) return;

  isEmailModalCompulsory = !!compulsory;

  if (errorEl) errorEl.style.display = 'none';
  if (successEl) successEl.style.display = 'none';

  if (isEmailModalCompulsory) {
    if (titleText) titleText.textContent = 'Link Email Address';
    if (closeBtn) closeBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (noticeEl) noticeEl.style.display = 'flex';
    if (submitText) submitText.textContent = 'Save Email';
    inputEmail.value = '';
  } else {
    if (titleText) titleText.textContent = 'Update Email Address';
    if (closeBtn) closeBtn.style.display = 'flex';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    if (noticeEl) noticeEl.style.display = 'none';
    if (submitText) submitText.textContent = 'Update Email';
    inputEmail.value = currentUser ? (currentUser.email || '') : '';
  }

  modal.style.display = 'flex';
  refreshIcons();
  setTimeout(() => inputEmail.focus(), 100);
}

function closeEmailModal() {
  if (isEmailModalCompulsory && currentUser && !currentUser.email) {
    return;
  }
  const modal = document.getElementById('modal-email');
  if (modal) {
    modal.style.display = 'none';
  }
}

function initEmailModalEventHandlers() {
  const closeBtn = document.getElementById('modal-email-close');
  const cancelBtn = document.getElementById('btn-modal-email-cancel');
  const modal = document.getElementById('modal-email');
  const form = document.getElementById('form-update-email');

  if (closeBtn) closeBtn.addEventListener('click', closeEmailModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeEmailModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEmailModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        closeEmailModal();
      }
    });
  }

  // Delegated click on Update buttons (PC dropdown & Mobile profile)
  document.addEventListener('click', (e) => {
    const updateBtn = e.target.closest('.btn-open-update-email');
    if (updateBtn) {
      e.preventDefault();
      e.stopPropagation();
      const profileMenu = document.getElementById('profile-dropdown-menu');
      if (profileMenu) profileMenu.classList.remove('show');
      openEmailModal({ compulsory: false });
    }
  });

  // Submit email update / link form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('input-modal-email');
      const errorEl = document.getElementById('modal-email-error');
      const successEl = document.getElementById('modal-email-success');
      const submitBtn = document.getElementById('btn-modal-email-submit');
      const submitText = document.getElementById('text-modal-email-submit');

      if (!emailInput) return;
      const email = emailInput.value.trim();

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        if (errorEl) {
          errorEl.textContent = 'Please enter a valid email address (e.g. example@gmail.com)';
          errorEl.style.display = 'block';
        }
        return;
      }

      if (errorEl) errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';

      submitBtn.disabled = true;
      const originalText = submitText ? submitText.textContent : 'Save Email';
      if (submitText) submitText.textContent = 'Saving...';

      try {
        const res = await api.updateEmail(email);
        if (res.user) {
          currentUser = res.user;
          localStorage.setItem('user', JSON.stringify(currentUser));
        } else if (currentUser) {
          currentUser.email = email.toLowerCase();
          localStorage.setItem('user', JSON.stringify(currentUser));
        }

        isEmailModalCompulsory = false;

        // Refresh UI
        updateNavbar();
        const profileView = document.getElementById('view-profile');
        if (profileView && profileView.style.display !== 'none' && typeof renderProfileView === 'function') {
          renderProfileView();
        }

        if (successEl) {
          successEl.textContent = res.message || 'Email successfully saved!';
          successEl.style.display = 'block';
        }

        setTimeout(() => {
          closeEmailModal();
        }, 700);
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message || 'Failed to save email address';
          errorEl.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = originalText;
        refreshIcons();
      }
    });
  }
}

// --- FORGOT PASSWORD CONTROLLER (SERVER-AUTHORITATIVE) ---
const forgotPasswordState = {
  verificationId: null,
  maskedEmail: '',
  resetToken: null,
  timerInterval: null,
  countdown: 60
};

function getOtpBoxes() {
  return Array.from(document.querySelectorAll('.otp-box'));
}

function getOtpValue() {
  return getOtpBoxes().map(b => b.value.trim()).join('');
}

function clearOtpBoxes() {
  const boxes = getOtpBoxes();
  boxes.forEach(b => { b.value = ''; });
  const first = document.querySelector('.otp-box[data-idx="0"]');
  if (first) setTimeout(() => first.focus(), 100);
}

function renderForgotPasswordView() {
  const stepPhone = document.getElementById('forgot-step-phone');
  const stepOtp = document.getElementById('forgot-step-otp');
  const stepNewPass = document.getElementById('forgot-step-newpass');

  const phoneError = document.getElementById('forgot-phone-error-alert');
  const otpError = document.getElementById('forgot-otp-error-alert');
  const otpSuccess = document.getElementById('forgot-otp-success-alert');
  const newPassError = document.getElementById('forgot-newpass-error-alert');
  const newPassSuccess = document.getElementById('forgot-newpass-success-alert');

  const phoneInput = document.getElementById('forgot-phone-input');
  const newPassInput = document.getElementById('forgot-new-password');
  const confirmPassInput = document.getElementById('forgot-confirm-password');

  if (forgotPasswordState.timerInterval) {
    clearInterval(forgotPasswordState.timerInterval);
    forgotPasswordState.timerInterval = null;
  }

  if (stepPhone) stepPhone.style.display = 'block';
  if (stepOtp) stepOtp.style.display = 'none';
  if (stepNewPass) stepNewPass.style.display = 'none';

  if (phoneError) phoneError.style.display = 'none';
  if (otpError) otpError.style.display = 'none';
  if (otpSuccess) otpSuccess.style.display = 'none';
  if (newPassError) newPassError.style.display = 'none';
  if (newPassSuccess) newPassSuccess.style.display = 'none';

  if (phoneInput) {
    phoneInput.value = currentUser ? currentUser.phone : '';
  }

  clearOtpBoxes();

  if (newPassInput) {
    newPassInput.value = '';
    newPassInput.type = 'password';
  }
  if (confirmPassInput) {
    confirmPassInput.value = '';
    confirmPassInput.type = 'password';
  }

  forgotPasswordState.verificationId = null;
  forgotPasswordState.maskedEmail = '';
  forgotPasswordState.resetToken = null;

  refreshIcons();
}

function startOtpResendTimer(seconds = 60) {
  if (forgotPasswordState.timerInterval) {
    clearInterval(forgotPasswordState.timerInterval);
  }

  forgotPasswordState.countdown = seconds;
  const timerText = document.getElementById('forgot-otp-timer');
  const timerCount = document.getElementById('forgot-timer-count');
  const resendBtn = document.getElementById('btn-resend-forgot-otp');

  if (timerText) timerText.style.display = 'inline';
  if (timerCount) timerCount.textContent = String(seconds);
  if (resendBtn) resendBtn.style.display = 'none';

  forgotPasswordState.timerInterval = setInterval(() => {
    forgotPasswordState.countdown -= 1;
    if (timerCount) timerCount.textContent = String(forgotPasswordState.countdown);

    if (forgotPasswordState.countdown <= 0) {
      clearInterval(forgotPasswordState.timerInterval);
      forgotPasswordState.timerInterval = null;
      if (timerText) timerText.style.display = 'none';
      if (resendBtn) {
        resendBtn.style.display = 'inline';
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    }
  }, 1000);
}

function initForgotPasswordEventHandlers() {
  const formPhone = document.getElementById('form-forgot-phone');
  const formOtp = document.getElementById('form-forgot-otp');
  const formNewPass = document.getElementById('form-forgot-newpass');
  const resendBtn = document.getElementById('btn-resend-forgot-otp');
  const backToPhoneBtn = document.getElementById('btn-back-to-phone');
  const showNewPassBtn = document.getElementById('btn-show-forgot-new-pass');
  const showConfirmPassBtn = document.getElementById('btn-show-forgot-confirm-pass');
  const otpBoxes = getOtpBoxes();

  // Setup 6-box OTP behaviors (auto-advance, backspace, paste, arrow keys)
  otpBoxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val.charAt(0) : '';

      if (val && idx < otpBoxes.length - 1) {
        otpBoxes[idx + 1].focus();
        otpBoxes[idx + 1].select();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!e.target.value && idx > 0) {
          otpBoxes[idx - 1].focus();
          otpBoxes[idx - 1].value = '';
        }
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        otpBoxes[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < otpBoxes.length - 1) {
        otpBoxes[idx + 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData('text');
      const digits = pastedData.replace(/\D/g, '').slice(0, 6);
      if (!digits) return;

      digits.split('').forEach((d, i) => {
        if (otpBoxes[i]) {
          otpBoxes[i].value = d;
        }
      });

      const focusIdx = Math.min(digits.length, otpBoxes.length - 1);
      otpBoxes[focusIdx].focus();
    });
  });

  // Password visibility toggles for Step 3
  if (showNewPassBtn) {
    showNewPassBtn.addEventListener('click', () => {
      const input = document.getElementById('forgot-new-password');
      const icon = showNewPassBtn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  if (showConfirmPassBtn) {
    showConfirmPassBtn.addEventListener('click', () => {
      const input = document.getElementById('forgot-confirm-password');
      const icon = showConfirmPassBtn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  // Back to phone button
  if (backToPhoneBtn) {
    backToPhoneBtn.addEventListener('click', () => {
      document.getElementById('forgot-step-phone').style.display = 'block';
      document.getElementById('forgot-step-otp').style.display = 'none';
      document.getElementById('forgot-step-newpass').style.display = 'none';
      if (forgotPasswordState.timerInterval) {
        clearInterval(forgotPasswordState.timerInterval);
        forgotPasswordState.timerInterval = null;
      }
      clearOtpBoxes();
      refreshIcons();
    });
  }

  // STEP 1: Phone submission (Requests OTP from Server)
  if (formPhone) {
    formPhone.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('forgot-phone-input');
      const errorAlert = document.getElementById('forgot-phone-error-alert');
      const submitBtn = document.getElementById('btn-send-forgot-otp');
      const btnContent = document.getElementById('btn-send-forgot-otp-content');

      if (!phoneInput) return;
      const phone = phoneInput.value.trim();

      if (!/^\d{10,15}$/.test(phone)) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter a valid 10-digit registered phone number.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      if (errorAlert) errorAlert.style.display = 'none';
      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Dispathing code...';
      refreshIcons();

      try {
        const res = await api.forgotPassword(phone);

        if (!res.hasEmail) {
          // No email registered in DB -> Navigate to Support Page with prefilled application
          const supportUrl = `/support?reason=add-email&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(res.name || '')}&role=${encodeURIComponent(res.role || '')}`;
          navigate(supportUrl);
          return;
        }

        // Store server-issued verification session ID
        forgotPasswordState.verificationId = res.verificationId;
        forgotPasswordState.maskedEmail = res.maskedEmail || 'registered email';

        // Switch to Step 2 (Verify OTP)
        document.getElementById('forgot-step-phone').style.display = 'none';
        document.getElementById('forgot-step-otp').style.display = 'block';
        document.getElementById('forgot-step-newpass').style.display = 'none';
        document.getElementById('forgot-masked-email').textContent = forgotPasswordState.maskedEmail;

        clearOtpBoxes();
        startOtpResendTimer(res.cooldownSeconds || 60);
        refreshIcons();
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to process verification request.';
          errorAlert.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }

  // STEP 2: Verify OTP Only (Server-authoritative check)
  if (formOtp) {
    formOtp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('forgot-otp-error-alert');
      const successAlert = document.getElementById('forgot-otp-success-alert');
      const submitBtn = document.getElementById('btn-verify-forgot-otp');
      const btnContent = document.getElementById('btn-verify-forgot-otp-content');

      const otp = getOtpValue();

      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      if (!/^\d{6}$/.test(otp)) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter the complete 6-digit numeric verification code.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Verifying Code...';
      refreshIcons();

      try {
        const res = await api.verifyResetOtp(forgotPasswordState.verificationId, otp);

        if (forgotPasswordState.timerInterval) {
          clearInterval(forgotPasswordState.timerInterval);
          forgotPasswordState.timerInterval = null;
        }

        forgotPasswordState.resetToken = res.resetToken;

        // Transition from Step 2 to Step 3 (Set New Password)
        document.getElementById('forgot-step-otp').style.display = 'none';
        document.getElementById('forgot-step-newpass').style.display = 'block';

        const newPassInput = document.getElementById('forgot-new-password');
        if (newPassInput) setTimeout(() => newPassInput.focus(), 100);
        refreshIcons();
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Verification code failed. Please check the code and try again.';
          errorAlert.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }

  // STEP 3: Update Password (Submits verified resetToken)
  if (formNewPass) {
    formNewPass.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassInput = document.getElementById('forgot-new-password');
      const confirmPassInput = document.getElementById('forgot-confirm-password');
      const errorAlert = document.getElementById('forgot-newpass-error-alert');
      const successAlert = document.getElementById('forgot-newpass-success-alert');
      const submitBtn = document.getElementById('btn-submit-reset-password');
      const btnContent = document.getElementById('btn-submit-reset-password-content');

      const newPassword = newPassInput ? newPassInput.value : '';
      const confirmPassword = confirmPassInput ? confirmPassInput.value : '';

      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      if (newPassword.length < 6) {
        if (errorAlert) {
          errorAlert.textContent = 'New password must be at least 6 characters long.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (errorAlert) {
          errorAlert.textContent = 'Passwords do not match. Please verify and re-enter.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Updating Password...';
      refreshIcons();

      try {
        const res = await api.resetPasswordFinal(
          forgotPasswordState.resetToken, 
          newPassword, 
          confirmPassword
        );

        if (successAlert) {
          successAlert.innerHTML = `<strong>Success!</strong> ${res.message || 'Password updated successfully!'}`;
          successAlert.style.display = 'block';
        }

        setTimeout(() => {
          if (currentUser) {
            navigate('/profile');
          } else {
            navigate('/login');
          }
        }, 1500);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to update password. Please try resetting your password again.';
          errorAlert.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }

  // Resend Code button (Calls Server-Side Resend API)
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const errorAlert = document.getElementById('forgot-otp-error-alert');
      const successAlert = document.getElementById('forgot-otp-success-alert');
      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';

      try {
        const res = await api.resendOtp(forgotPasswordState.verificationId);

        if (successAlert) {
          successAlert.textContent = res.message || 'A new verification code has been dispatched to your email.';
          successAlert.style.display = 'block';
        }
        clearOtpBoxes();
        startOtpResendTimer(res.cooldownSeconds || 60);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to resend code.';
          errorAlert.style.display = 'block';
        }
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    });
  }

  // Back to Phone Step
  if (backToPhoneBtn) {
    backToPhoneBtn.addEventListener('click', () => {
      renderForgotPasswordView();
    });
  }

  // Password visibility toggles
  if (showNewPassBtn) {
    showNewPassBtn.addEventListener('click', () => {
      const input = document.getElementById('forgot-new-password');
      const icon = showNewPassBtn.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        if (icon) icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  if (showConfirmPassBtn) {
    showConfirmPassBtn.addEventListener('click', () => {
      const input = document.getElementById('forgot-confirm-password');
      const icon = showConfirmPassBtn.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        if (icon) icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }
}

// --- ADMIN EDIT USER EMAIL MODAL CONTROLLER ---
function openAdminEditEmailModal({ userId, phone, name, email }) {
  const modal = document.getElementById('modal-admin-edit-email');
  const errorAlert = document.getElementById('admin-edit-email-error');
  const successAlert = document.getElementById('admin-edit-email-success');
  const idInput = document.getElementById('admin-edit-email-user-id');
  const phoneInput = document.getElementById('admin-edit-email-user-phone');
  const nameEl = document.getElementById('admin-edit-email-user-name');
  const phoneEl = document.getElementById('admin-edit-email-user-phone-display');
  const emailInput = document.getElementById('admin-edit-email-input');

  if (!modal) return;

  if (errorAlert) errorAlert.style.display = 'none';
  if (successAlert) successAlert.style.display = 'none';

  if (idInput) idInput.value = userId || '';
  if (phoneInput) phoneInput.value = phone || '';
  if (nameEl) nameEl.textContent = capitalizeName(name || 'User');
  if (phoneEl) phoneEl.textContent = phone || 'N/A';
  if (emailInput) {
    emailInput.value = email || '';
    setTimeout(() => emailInput.focus(), 150);
  }

  modal.style.display = 'flex';
  refreshIcons();
}

function closeAdminEditEmailModal() {
  const modal = document.getElementById('modal-admin-edit-email');
  if (modal) modal.style.display = 'none';
}

function initAdminEmailModalEventHandlers() {
  const modal = document.getElementById('modal-admin-edit-email');
  const closeBtn = document.getElementById('modal-admin-edit-email-close');
  const cancelBtn = document.getElementById('btn-admin-edit-email-cancel');
  const form = document.getElementById('form-admin-edit-email');

  if (closeBtn) closeBtn.addEventListener('click', closeAdminEditEmailModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeAdminEditEmailModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAdminEditEmailModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        closeAdminEditEmailModal();
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('admin-edit-email-user-id').value;
      const phone = document.getElementById('admin-edit-email-user-phone').value;
      const emailInput = document.getElementById('admin-edit-email-input');
      const errorAlert = document.getElementById('admin-edit-email-error');
      const successAlert = document.getElementById('admin-edit-email-success');
      const submitBtn = document.getElementById('btn-admin-edit-email-submit');

      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      if (!email || !emailRegex.test(email)) {
        if (errorAlert) {
          errorAlert.textContent = 'Please enter a valid email address.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i> Saving...';
      refreshIcons();

      try {
        let res;
        if (userId) {
          res = await api.adminUpdateUserEmail(userId, email);
        } else if (phone) {
          res = await api.adminUpdateUserEmailByPhone(phone, email);
        } else {
          throw new Error('Missing user ID or phone number.');
        }

        if (successAlert) {
          successAlert.textContent = res.message || 'Email updated successfully!';
          successAlert.style.display = 'block';
        }

        // Refresh admin dashboard to show updated email
        setTimeout(async () => {
          closeAdminEditEmailModal();
          if (typeof renderAdminDashboardView === 'function') {
            await renderAdminDashboardView();
          }
        }, 800);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to update email.';
          errorAlert.style.display = 'block';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }
}

async function renderReviewsView() {
  const form = document.getElementById('form-review');
  const existingContainer = document.getElementById('existing-review-container');
  const errorAlert = document.getElementById('review-error-alert');
  const successAlert = document.getElementById('review-success-alert');

  if (errorAlert) errorAlert.style.display = 'none';
  if (successAlert) successAlert.style.display = 'none';

  if (!currentUser) {
    navigate('/login');
    return;
  }

  try {
    const res = await api.getMyReview();
    if (res.hasSubmitted) {
      if (form) form.style.display = 'none';
      if (existingContainer) {
        existingContainer.style.display = 'block';
        
        // Render stars
        const starsContainer = document.getElementById('existing-review-stars');
        if (starsContainer) {
          let starsHTML = '';
          for (let i = 1; i <= 5; i++) {
            const fillAttr = i <= res.review.rating ? 'fill="var(--warning)"' : 'fill="none"';
            const color = i <= res.review.rating ? 'var(--warning)' : '#cbd5e1';
            starsHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${i <= res.review.rating ? 'var(--warning)' : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
          }
          starsContainer.innerHTML = starsHTML;
        }
        const commentEl = document.getElementById('existing-review-comment');
        if (commentEl) commentEl.textContent = res.review.comment || 'No comment provided.';
        const dateEl = document.getElementById('existing-review-date');
        if (dateEl) dateEl.textContent = new Date(res.review.createdAt).toLocaleString();
      }
    } else {
      if (form) form.style.display = 'block';
      if (existingContainer) existingContainer.style.display = 'none';
      selectedReviewRating = 0;
      updateStarRatingDisplay(0);
    }
  } catch (err) {
    if (errorAlert) {
      errorAlert.textContent = err.message || 'Error checking review status';
      errorAlert.style.display = 'block';
    }
  }
  refreshIcons();
}

async function renderContributorsView() {
  const loading = document.getElementById('contributors-loading');
  const errorAlert = document.getElementById('contributors-error-alert');
  const wrapper = document.getElementById('contributors-list-wrapper');
  const list = document.getElementById('contributors-ranking-list');

  if (loading) loading.style.display = 'block';
  if (errorAlert) errorAlert.style.display = 'none';
  if (wrapper) wrapper.style.display = 'none';



  try {
    const contributors = await api.getContributors();
    
    if (loading) loading.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';
    
    if (!contributors || contributors.length === 0) {
      if (list) {
        list.innerHTML = `
          <div style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
            <i data-lucide="users" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 12px; stroke-width: 1.5;"></i>
            <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: var(--text-main);">No Contributors Yet</h4>
            <p style="margin: 0; font-size: 13px;">Upload notes, lab manuals or PYQs to see your name on the board!</p>
          </div>
        `;
      }
      refreshIcons();
      return;
    }

    const showStats = currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');
    let html = '';
    contributors.forEach((c, index) => {
      const isTop3 = index < 3;
      const rankColors = ['#f59e0b', '#94a3b8', '#b45309']; // Gold, Silver, Bronze
      const rankBadge = isTop3 
        ? `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${rankColors[index]}15; color: ${rankColors[index]}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 1.5px solid ${rankColors[index]}40;">
            ${index + 1}
           </div>`
        : `<div style="width: 28px; height: 28px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px;">
            ${index + 1}
           </div>`;

      const statsHTML = showStats ? `
          <div style="display: flex; align-items: center; gap: 16px; flex-shrink: 0;">
            <div style="text-align: right;">
              <span style="font-size: 11px; color: var(--text-muted); display: block;">Approved Uploads</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${c.uploads}</span>
            </div>
            
            <div style="width: 58px; text-align: center; background: var(--primary-accent); padding: 6px 8px; border-radius: var(--radius-sm); border: 1.5px solid rgba(37, 99, 235, 0.15); display: flex; flex-direction: column; align-items: center; gap: 2px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--primary); letter-spacing: 0.5px;">Pts</span>
              <span style="font-size: 15px; font-weight: 800; color: var(--primary); line-height: 1;">${c.points}</span>
            </div>
          </div>
      ` : '';

      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-color); background: ${isTop3 ? 'rgba(248, 250, 252, 0.5)' : 'transparent'};">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            ${rankBadge}
            <div style="min-width: 0;">
              <div style="font-weight: 700; font-size: 14px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                ${escapeHTML(capitalizeName(c.name))}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                Joined ${new Date(c.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
          ${statsHTML}
        </div>
      `;
    });

    if (list) list.innerHTML = html;
    refreshIcons();
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (errorAlert) {
      errorAlert.textContent = err.message || 'Failed to load contributors leaderboard';
      errorAlert.style.display = 'block';
    }
  }
}

// --- FILE TOOLS / GENERATORS PAGE LOGIC ---

let indexRows = [];
let collegeLogoBase64 = '';

async function renderGeneratorsView() {
  // Populate student info defaults from currentUser if logged in
  if (currentUser) {
    const fpStudentName = document.getElementById('fp-student-name');
    const fpStudentRoll = document.getElementById('fp-student-roll');
    
    if (fpStudentName && !fpStudentName.value) fpStudentName.value = currentUser.name;
    if (fpStudentRoll && !fpStudentRoll.value) fpStudentRoll.value = currentUser.phone;
  }

  const btnTabFp = document.getElementById('btn-tab-frontpage');
  const btnTabIdx = document.getElementById('btn-tab-indexpage');
  const sectionFp = document.getElementById('form-section-frontpage');
  const sectionIdx = document.getElementById('form-section-indexpage');

  // Set initial tab styling
  if (btnTabFp && btnTabIdx && sectionFp && sectionIdx) {
    btnTabFp.classList.add('active');
    btnTabIdx.classList.remove('active');
    btnTabFp.style.background = 'var(--primary)';
    btnTabFp.style.color = 'var(--white)';
    btnTabIdx.style.background = 'transparent';
    btnTabIdx.style.color = 'var(--text-main)';
    sectionFp.style.display = 'block';
    sectionIdx.style.display = 'none';
  }

  // Tab switching logic
  if (btnTabFp && btnTabIdx && sectionFp && sectionIdx) {
    btnTabFp.onclick = () => {
      btnTabFp.classList.add('active');
      btnTabIdx.classList.remove('active');
      btnTabFp.style.background = 'var(--primary)';
      btnTabFp.style.color = 'var(--white)';
      btnTabIdx.style.background = 'transparent';
      btnTabIdx.style.color = 'var(--text-main)';
      sectionFp.style.display = 'block';
      sectionIdx.style.display = 'none';
      updatePreview();
    };
    btnTabIdx.onclick = () => {
      btnTabIdx.classList.add('active');
      btnTabFp.classList.remove('active');
      btnTabIdx.style.background = 'var(--primary)';
      btnTabIdx.style.color = 'var(--white)';
      btnTabFp.style.background = 'transparent';
      btnTabFp.style.color = 'var(--text-main)';
      sectionFp.style.display = 'none';
      sectionIdx.style.display = 'block';
      updatePreview();
    };
  }

  // Logo upload setup
  const logoInput = document.getElementById('fp-logo-input');
  const btnClearLogo = document.getElementById('btn-clear-fp-logo');
  if (logoInput && btnClearLogo) {
    logoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert('Image size exceeds 2MB limit.');
          logoInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          collegeLogoBase64 = event.target.result;
          btnClearLogo.style.display = 'inline-flex';
          updatePreview();
        };
        reader.readAsDataURL(file);
      }
    };

    btnClearLogo.onclick = () => {
      collegeLogoBase64 = '';
      logoInput.value = '';
      btnClearLogo.style.display = 'none';
      updatePreview();
    };

    if (collegeLogoBase64) {
      btnClearLogo.style.display = 'inline-flex';
    } else {
      btnClearLogo.style.display = 'none';
    }
  }

  // Dynamic Index Entries Setup
  const container = document.getElementById('idx-rows-input-container');
  if (container) {
    if (indexRows.length === 0) {
      // Seed default 3 rows
      indexRows = [
        { sno: '1', title: 'Study of Basic Logic Gates', pageNo: '1-4', datePerf: '2026-02-10', remark: 'Good' },
        { sno: '2', title: 'Implementation of Half Adder & Full Adder', pageNo: '5-9', datePerf: '2026-02-24', remark: 'Completed' },
        { sno: '3', title: 'Design of 4-bit Binary Counter', pageNo: '10-15', datePerf: '2026-03-10', remark: 'Done' }
      ];
    }
    renderIndexInputs();
  }

  // Bind change/input listeners for real-time preview updates
  const fpInputs = [
    'fp-college-name', 'fp-department', 'fp-branch', 'fp-subject-name', 
    'fp-title', 'fp-student-name', 'fp-student-roll', 
    'fp-student-sem', 'fp-teacher-name', 'fp-teacher-title', 'fp-session', 'fp-template'
  ];
  fpInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updatePreview;
      el.onchange = updatePreview;
    }
  });

  const idxInputs = ['idx-template'];
  idxInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.oninput = updatePreview;
      el.onchange = updatePreview;
    }
  });

  // Dynamic Add Row click
  const btnAddRow = document.getElementById('btn-add-idx-row');
  if (btnAddRow) {
    btnAddRow.onclick = () => {
      const nextSno = indexRows.length + 1;
      indexRows.push({ sno: nextSno.toString(), title: '', pageNo: '', datePerf: '', remark: '' });
      renderIndexInputs();
      updatePreview();
    };
  }

  // Generate Frontpage PDF click
  const btnGenFpPdf = document.getElementById('btn-generate-fp-pdf');
  if (btnGenFpPdf) {
    btnGenFpPdf.onclick = downloadFrontPagePDF;
  }

  // Generate Index PDF click
  const btnGenIdxPdf = document.getElementById('btn-generate-idx-pdf');
  if (btnGenIdxPdf) {
    btnGenIdxPdf.onclick = downloadIndexPDF;
  }

  // Initial update
  updatePreview();
  refreshIcons();
}

function renderIndexInputs() {
  const container = document.getElementById('idx-rows-input-container');
  if (!container) return;

  container.innerHTML = indexRows.map((row, idx) => `
    <div class="idx-row-input-group" data-index="${idx}">
      <span style="font-size: 11px; font-weight: bold; text-align: center;">${idx + 1}</span>
      <input type="text" class="form-input row-title" placeholder="Experiment Title" value="${escapeHTML(row.title)}" />
      <input type="text" class="form-input row-page-no" placeholder="Page.no" value="${escapeHTML(row.pageNo)}" />
      <input type="date" class="form-input row-date-perf" value="${row.datePerf}" />
      <input type="text" class="form-input row-remark" placeholder="Remark" value="${escapeHTML(row.remark || '')}" />
      <button type="button" class="btn btn-danger btn-sm btn-delete-idx-row" style="padding: 4px; height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;" title="Delete Row">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    </div>
  `).join('');

  // Wire input listeners inside dynamic rows
  container.querySelectorAll('.idx-row-input-group').forEach(group => {
    const idx = parseInt(group.getAttribute('data-index'));
    const titleInput = group.querySelector('.row-title');
    const pageInput = group.querySelector('.row-page-no');
    const dateInput = group.querySelector('.row-date-perf');
    const remarkInput = group.querySelector('.row-remark');
    const deleteBtn = group.querySelector('.btn-delete-idx-row');

    if (titleInput) {
      titleInput.oninput = (e) => {
        indexRows[idx].title = e.target.value;
        updatePreview();
      };
    }
    if (pageInput) {
      pageInput.oninput = (e) => {
        indexRows[idx].pageNo = e.target.value;
        updatePreview();
      };
    }
    if (dateInput) {
      dateInput.onchange = (e) => {
        indexRows[idx].datePerf = e.target.value;
        updatePreview();
      };
    }
    if (remarkInput) {
      remarkInput.oninput = (e) => {
        indexRows[idx].remark = e.target.value;
        updatePreview();
      };
    }
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        indexRows.splice(idx, 1);
        // Re-index Sno
        indexRows.forEach((r, i) => r.sno = (i + 1).toString());
        renderIndexInputs();
        updatePreview();
      };
    }
  });

  refreshIcons();
}

function updatePreview() {
  const sheet = document.getElementById('a4-preview-sheet');
  if (!sheet) return;

  const btnTabFp = document.getElementById('btn-tab-frontpage');
  const isFp = btnTabFp && btnTabFp.classList.contains('active');

  if (isFp) {
    const college = document.getElementById('fp-college-name').value.toUpperCase();
    const dept = document.getElementById('fp-department').value.toUpperCase();
    const branch = document.getElementById('fp-branch').value;
    const subjName = document.getElementById('fp-subject-name').value.toUpperCase();
    const title = document.getElementById('fp-title').value.toUpperCase();
    const studentName = document.getElementById('fp-student-name').value;
    const studentRoll = document.getElementById('fp-student-roll').value;
    const studentSem = document.getElementById('fp-student-sem').value;
    const teacherName = document.getElementById('fp-teacher-name').value;
    const session = document.getElementById('fp-session').value;
    const template = document.getElementById('fp-template').value;

    let innerHTML = '';

    if (template === 'classic') {
      innerHTML = `
        <div class="preview-classic-border">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 4cqw; font-weight: 800; line-height: 1.2; margin-bottom: 0.8cqw; font-family: 'Times New Roman', serif;">${escapeHTML(college)}</div>
            <div style="font-size: 2.8cqw; font-weight: bold; color: #555; margin-bottom: 2cqw;">${escapeHTML(dept)}</div>
            <div style="display: flex; justify-content: center; margin: 2cqw 0;">
              ${collegeLogoBase64 ? `
                <img src="${collegeLogoBase64}" style="width: 22cqw; height: 22cqw; object-fit: contain;" />
              ` : `
                <svg width="22cqw" height="22cqw" viewBox="0 0 100 100" style="fill: none; stroke: currentColor; stroke-width: 2;">
                  <circle cx="50" cy="50" r="45" stroke="#000" stroke-width="2"/>
                  <circle cx="50" cy="50" r="40" stroke="#000" stroke-width="1" stroke-dasharray="2,2"/>
                  <path d="M30 45 L50 30 L70 45 L70 65 L30 65 Z" fill="#f1f5f9" stroke="#000"/>
                  <path d="M50 30 L50 65" stroke="#000"/>
                  <path d="M35 52 L65 52" stroke="#000"/>
                  <text x="50" y="80" font-size="9" font-family="Helvetica" font-weight="bold" text-anchor="middle" fill="#000">BTKIT</text>
                </svg>
              `}
            </div>
          </div>

          <div style="text-align: center; width: 100%; margin: 2cqw 0;">
            <div style="font-size: 3cqw; font-weight: bold; text-decoration: underline; margin-bottom: 1.5cqw; letter-spacing: 0.1cqw;">${escapeHTML(title)}</div>
            <div style="font-size: 2.5cqw; font-weight: normal; margin-bottom: 0.8cqw;">SUBJECT: <strong>${escapeHTML(subjName)}</strong></div>
            <div style="font-size: 2.3cqw; font-weight: normal;">BRANCH: <strong>${escapeHTML(branch)}</strong></div>
          </div>

          <div style="text-align: center; line-height: 1.5; font-size: 2.4cqw; border-top: 1px solid #000; padding-top: 2cqw; width: 100%;">
            <div><strong>SUBMITTED TO:</strong> ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div style="margin-top: 0.5cqw;"><strong>SUBMITTED BY:</strong> ${escapeHTML(studentName || 'Student Name')}</div>
            <div><strong>ROLL NO:</strong> ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div><strong>YEAR/SEMESTER:</strong> ${escapeHTML(studentSem)}</div>
          </div>

          <div style="text-align: center; font-size: 2.3cqw; font-weight: bold; width: 100%;">
            ACADEMIC SESSION: ${escapeHTML(session)}
          </div>
        </div>
      `;
    } else if (template === 'modern') {
      innerHTML = `
        <div class="preview-modern-accent" style="font-family: Arial, Helvetica, sans-serif;">
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="text-align: left; flex: 1;">
              <div style="font-size: 4.2cqw; font-weight: 900; color: var(--primary-dark); line-height: 1.1; margin-bottom: 0.6cqw;">${escapeHTML(college)}</div>
              <div style="font-size: 2.5cqw; font-weight: 600; color: var(--primary); text-transform: uppercase; tracking: 0.5px;">${escapeHTML(dept)}</div>
              <div style="width: 12cqw; height: 1cqw; background: var(--primary); margin-top: 2cqw;"></div>
            </div>
            ${collegeLogoBase64 ? `
              <img src="${collegeLogoBase64}" style="width: 18cqw; height: 18cqw; object-fit: contain; margin-left: 2cqw;" />
            ` : ''}
          </div>

          <div style="width: 100%; text-align: left; margin: 4cqw 0;">
            <span style="font-size: 2.2cqw; font-weight: 700; color: #64748b; text-transform: uppercase;">Assignment File</span>
            <div style="font-size: 4.8cqw; font-weight: 900; margin: 1cqw 0 3cqw 0; line-height: 1.2; border-bottom: 2px solid #e2e8f0; padding-bottom: 2cqw;">${escapeHTML(subjName)}</div>
            <div style="font-size: 2.4cqw; color: #475569; display: flex; flex-direction: column; gap: 0.6cqw;">
              <div>Stream: <strong>${escapeHTML(branch)}</strong></div>
              <div>Type: <strong>${escapeHTML(title)}</strong></div>
            </div>
          </div>

          <div style="text-align: center; line-height: 1.5; font-size: 2.3cqw; background: #f8fafc; padding: 2.5cqw; border-radius: 8px; border: 1px solid #e2e8f0; width: 100%;">
            <div><strong>SUBMITTED TO:</strong> ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div style="margin-top: 0.5cqw;"><strong>SUBMITTED BY:</strong> ${escapeHTML(studentName || 'Student Name')}</div>
            <div><strong>ROLL NO:</strong> ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div><strong>YEAR/SEMESTER:</strong> ${escapeHTML(studentSem)}</div>
          </div>

          <div style="display: flex; justify-content: space-between; width: 100%; border-top: 2px solid #e2e8f0; padding-top: 2.5cqw; font-size: 2.2cqw; color: #64748b; font-weight: bold;">
            <span>SESSION: ${escapeHTML(session)}</span>
            <span>BTKIT DWARAHAT</span>
          </div>
        </div>
      `;
    } else if (template === 'tech') {
      innerHTML = `
        <div class="preview-tech-border" style="font-family: 'Courier New', Courier, monospace;">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 3.6cqw; font-weight: bold; letter-spacing: 0.1cqw; margin-bottom: 1cqw;">[ ${escapeHTML(college)} ]</div>
            <div style="font-size: 2.4cqw; color: #333;">// ${escapeHTML(dept)}</div>
            ${collegeLogoBase64 ? `
              <div style="display: flex; justify-content: center; margin-top: 2cqw;">
                <img src="${collegeLogoBase64}" style="width: 16cqw; height: 16cqw; object-fit: contain; filter: grayscale(100%);" />
              </div>
            ` : ''}
          </div>

          <div style="border: 1px dashed #000; width: 100%; padding: 4cqw 2cqw; text-align: center; box-sizing: border-box; background: rgba(0,0,0,0.01); margin: 2cqw 0;">
            <div style="font-size: 4cqw; font-weight: bold; margin-bottom: 2cqw;">&lt; ${escapeHTML(title)} &gt;</div>
            <div style="font-size: 2.8cqw; margin-bottom: 1cqw;">SUBJECT: ${escapeHTML(subjName)}</div>
            <div style="font-size: 2.5cqw;">BRANCH: ${escapeHTML(branch)}</div>
          </div>

          <div style="width: 100%; text-align: center; font-size: 2.3cqw; border-top: 1px dashed #000; padding-top: 3cqw; line-height: 1.5;">
            <div>* SUBMITTED_TO: ${escapeHTML(teacherName || 'Instructor Name')}</div>
            <div>* SUBMITTED_BY: ${escapeHTML(studentName || 'Student Name')}</div>
            <div>* ROLL_NO: ${escapeHTML(studentRoll || 'Student Roll')}</div>
            <div>* YEAR_SEMESTER: ${escapeHTML(studentSem)}</div>
          </div>

          <div style="text-align: center; font-size: 2.2cqw; font-weight: bold;">
            // SESSION: ${escapeHTML(session)} //
          </div>
        </div>
      `;
    }

    sheet.innerHTML = innerHTML;
  } else {
    // Index Preview (no details displayed, only standard headers, entries table, and teacher signature)
    const template = document.getElementById('idx-template').value;
    const useZebra = template === 'modern';

    sheet.innerHTML = `
      <div style="padding: 4cqw; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Times New Roman', Times, serif;">
        
        <div style="width: 100%;">
          <div style="font-size: 3.5cqw; font-weight: 800; text-align: center; text-decoration: underline; margin-bottom: 4cqw; text-transform: uppercase;">INDEX SHEET</div>
        </div>

        <div style="flex: 1; width: 100%; overflow: hidden; margin-top: 1cqw;">
          <table style="width: 100%; border-collapse: collapse; font-size: 2cqw; text-align: left;">
            <thead>
              <tr style="background: ${useZebra ? 'var(--primary)' : '#e2e8f0'}; color: ${useZebra ? '#fff' : '#000'}; border: 1px solid #000;">
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 8%;">S.No.</th>
                <th style="border: 1px solid #000; padding: 1cqw; width: 42%;">Title</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 12%;">Page.no</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 15%;">Date</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 10%;">Remark</th>
                <th style="border: 1px solid #000; padding: 1cqw; text-align: center; width: 13%;">Teacher's Signature</th>
              </tr>
            </thead>
            <tbody>
              ${indexRows.map((row, i) => `
                <tr style="background: ${useZebra && i % 2 === 1 ? '#f8fafc' : '#fff'}; border: 1px solid #000;">
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.sno)}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; font-weight: bold;">${escapeHTML(row.title || 'Experiment Title')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.pageNo)}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.datePerf ? formatDateStr(row.datePerf) : '')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw; text-align: center;">${escapeHTML(row.remark || '')}</td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                </tr>
              `).join('')}
              ${Array.from({ length: Math.max(0, 12 - indexRows.length) }).map(() => `
                <tr style="border: 1px solid #000; height: 3.5cqw;">
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                  <td style="border: 1px solid #000; padding: 1cqw;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; width: 100%; font-size: 2.2cqw; margin-top: 3cqw; border-top: 1px dashed #bbb; padding-top: 2cqw;">
          <span>Signature of Teacher</span>
        </div>

      </div>
    `;
  }
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function downloadFrontPagePDF() {
  await ensureJsPDFLoaded();
  const { jsPDF } = window.jspdf;
  const college = document.getElementById('fp-college-name').value.toUpperCase();
  const dept = document.getElementById('fp-department').value.toUpperCase();
  const branch = document.getElementById('fp-branch').value;
  const subjName = document.getElementById('fp-subject-name').value.toUpperCase();
  const title = document.getElementById('fp-title').value.toUpperCase();
  const studentName = document.getElementById('fp-student-name').value;
  const studentRoll = document.getElementById('fp-student-roll').value;
  const studentSem = document.getElementById('fp-student-sem').value;
  const teacherName = document.getElementById('fp-teacher-name').value;
  const session = document.getElementById('fp-session').value;
  const template = document.getElementById('fp-template').value;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  if (template === 'classic') {
    doc.setDrawColor(0);
    doc.setLineWidth(1.2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.4);
    doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    const collegeLines = doc.splitTextToSize(college, pageWidth - 36);
    let currentY = 24;
    collegeLines.forEach(line => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 8;
    });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(dept, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0);

    currentY += 12;
    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth / 2 - 18, currentY, 36, 36);
    } else {
      doc.setLineWidth(0.6);
      doc.circle(pageWidth / 2, currentY + 15, 18);
      doc.setLineDash([1, 1], 0);
      doc.circle(pageWidth / 2, currentY + 15, 16);
      doc.setLineDash([], 0);
      
      doc.setLineWidth(0.4);
      doc.line(pageWidth / 2 - 10, currentY + 15, pageWidth / 2 + 10, currentY + 15);
      doc.line(pageWidth / 2, currentY + 5, pageWidth / 2, currentY + 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("BTKIT", pageWidth / 2, currentY + 29, { align: 'center' });
    }

    currentY += 45;
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    const titleWidth = doc.getTextWidth(title);
    doc.line(pageWidth / 2 - titleWidth / 2, currentY + 1, pageWidth / 2 + titleWidth / 2, currentY + 1);

    currentY += 16;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("SUBJECT: " + subjName, pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    doc.text("COURSE/BRANCH: " + branch, pageWidth / 2, currentY, { align: 'center' });

    currentY = 225;
    doc.line(16, currentY - 5, pageWidth - 16, currentY - 5);
    
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("SUBMITTED TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, currentY, { align: 'center' });
    doc.text("SUBMITTED BY: " + (studentName || 'Student Name'), pageWidth / 2, currentY + 7, { align: 'center' });
    doc.text("ROLL NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, currentY + 14, { align: 'center' });
    doc.text("YEAR/SEMESTER: " + studentSem, pageWidth / 2, currentY + 21, { align: 'center' });

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.text("ACADEMIC SESSION: " + session, pageWidth / 2, 272, { align: 'center' });

  } else if (template === 'modern') {
    // 1cm border on all sides in primary blue
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(1.0);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth - 45, 18, 28, 28);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    const wrapWidth = collegeLogoBase64 ? pageWidth - 75 : pageWidth - 40;
    const collegeLines = doc.splitTextToSize(college, wrapWidth);
    let currentY = 30;
    collegeLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 9;
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(dept, 20, currentY);

    currentY += 8;
    doc.setFillColor(37, 99, 235);
    doc.rect(20, currentY, 30, 2, 'F');

    currentY += 35;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC COURSE WORK FILE", 20, currentY);

    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    const subjLines = doc.splitTextToSize(subjName, pageWidth - 45);
    subjLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 9;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(20, currentY, pageWidth - 20, currentY);

    currentY += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text("Stream / Branch: " + branch, 20, currentY);
    currentY += 7;
    doc.text("File Description: " + title, 20, currentY);

    currentY = 205;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(pageWidth / 2 - 50, currentY, 100, 42, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("SUBMITTED TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, currentY + 10, { align: 'center' });
    doc.text("SUBMITTED BY: " + (studentName || 'Student Name'), pageWidth / 2, currentY + 18, { align: 'center' });
    doc.text("ROLL NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, currentY + 26, { align: 'center' });
    doc.text("YEAR/SEMESTER: " + studentSem, pageWidth / 2, currentY + 34, { align: 'center' });

    currentY = 270;
    doc.line(20, currentY, pageWidth - 20, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("ACADEMIC SESSION: " + session, 20, currentY + 8);
    doc.text("BTKIT DWARAHAT", pageWidth - 20, currentY + 8, { align: 'right' });

  } else if (template === 'tech') {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineDash([2, 2], 0);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    doc.setLineDash([], 0);

    doc.setFont("courier", "bold");
    doc.setFontSize(15);
    doc.text("[ " + college + " ]", pageWidth / 2, 25, { align: 'center' });

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    doc.text("// " + dept, pageWidth / 2, 33, { align: 'center' });

    let currentY = 38;
    if (collegeLogoBase64) {
      let format = 'PNG';
      if (collegeLogoBase64.startsWith('data:image/jpeg') || collegeLogoBase64.startsWith('data:image/jpg')) {
        format = 'JPEG';
      }
      doc.addImage(collegeLogoBase64, format, pageWidth / 2 - 15, currentY, 30, 30);
      currentY += 35;
    } else {
      currentY += 5;
    }

    doc.rect(16, currentY, pageWidth - 32, 70);
    doc.setLineDash([1, 2], 0);
    doc.line(16, currentY + 20, pageWidth - 16, currentY + 20);
    doc.line(16, currentY + 50, pageWidth - 16, currentY + 50);
    doc.setLineDash([], 0);

    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text("< " + title + " >", pageWidth / 2, currentY + 12, { align: 'center' });

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    doc.text("SUBJECT: " + subjName, pageWidth / 2, currentY + 35, { align: 'center' });

    doc.text("BRANCH: " + branch, pageWidth / 2, currentY + 60, { align: 'center' });

    let blockY = currentY + 80;
    doc.line(16, blockY, pageWidth - 16, blockY);
    
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("* SUBMITTED_TO: " + (teacherName || 'Instructor Name'), pageWidth / 2, blockY + 10, { align: 'center' });
    doc.text("* SUBMITTED_BY: " + (studentName || 'Student Name'), pageWidth / 2, blockY + 18, { align: 'center' });
    doc.text("* ROLL_NO: " + (studentRoll || 'Student Roll'), pageWidth / 2, blockY + 26, { align: 'center' });
    doc.text("* YEAR_SEMESTER: " + studentSem, pageWidth / 2, blockY + 34, { align: 'center' });

    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("// SESSION: " + session + " //", pageWidth / 2, 265, { align: 'center' });
  }

  const outName = studentName ? studentName : "Student";
  doc.save(outName.replace(/\s+/g, "_") + "_FrontPage.pdf");
}

async function downloadIndexPDF() {
  await ensureJsPDFLoaded();
  const { jsPDF } = window.jspdf;
  const template = document.getElementById('idx-template').value;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("INDEX SHEET", pageWidth / 2, 22, { align: 'center' });
  const titleWidth = doc.getTextWidth("INDEX SHEET");
  doc.line(pageWidth / 2 - titleWidth / 2, 23.5, pageWidth / 2 + titleWidth / 2, 23.5);

  let currentY = 32;
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setLineWidth(0.3);

  currentY += 8;
  const tableWidth = pageWidth - (margin * 2);
  const colWidths = {
    sno: 12,
    title: 83,
    page: 18,
    date: 22,
    remark: 20,
    sig: 25
  };

  doc.setFont("times", "bold");
  doc.setFontSize(10);
  
  if (template === 'modern') {
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, currentY, tableWidth, 8, 'F');
    doc.setTextColor(255);
  } else {
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, currentY, tableWidth, 8, 'F');
    doc.setTextColor(0);
  }

  doc.rect(margin, currentY, tableWidth, 8);
  let colX = margin;
  doc.text("S.No.", colX + colWidths.sno / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.sno;
  doc.text("Title", colX + 4, currentY + 5.5);
  
  colX += colWidths.title;
  doc.text("Page.no", colX + colWidths.page / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.page;
  doc.text("Date", colX + colWidths.date / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.date;
  doc.text("Remark", colX + colWidths.remark / 2, currentY + 5.5, { align: 'center' });
  
  colX += colWidths.remark;
  doc.text("Teacher's Signature", colX + colWidths.sig / 2, currentY + 5.5, { align: 'center' });

  doc.setTextColor(0);
  currentY += 8;

  doc.setFont("times", "normal");
  const rowHeight = 10;
  
  const allRows = [...indexRows];
  const minRows = 15;
  while (allRows.length < minRows) {
    allRows.push({ sno: '', title: '', pageNo: '', datePerf: '', remark: '' });
  }

  allRows.forEach((row, i) => {
    if (currentY + rowHeight > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
      
      if (template === 'modern') {
        doc.setFillColor(37, 99, 235);
        doc.rect(margin, currentY, tableWidth, 8, 'F');
        doc.setTextColor(255);
      } else {
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, currentY, tableWidth, 8, 'F');
        doc.setTextColor(0);
      }
      doc.rect(margin, currentY, tableWidth, 8);
      let tempX = margin;
      doc.text("S.No.", tempX + colWidths.sno / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.sno;
      doc.text("Title", tempX + 4, currentY + 5.5);
      
      tempX += colWidths.title;
      doc.text("Page.no", tempX + colWidths.page / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.page;
      doc.text("Date", tempX + colWidths.date / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.date;
      doc.text("Remark", tempX + colWidths.remark / 2, currentY + 5.5, { align: 'center' });
      
      tempX += colWidths.remark;
      doc.text("Teacher's Signature", tempX + colWidths.sig / 2, currentY + 5.5, { align: 'center' });
      
      doc.setTextColor(0);
      currentY += 8;
    }

    if (template === 'modern' && i % 2 === 1 && row.title) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
    }

    doc.rect(margin, currentY, tableWidth, rowHeight);
    
    let drawX = margin;
    doc.text(row.sno, drawX + colWidths.sno / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.sno;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.setFont("times", row.title ? "bold" : "normal");
    const wrappedTitle = doc.splitTextToSize(row.title, colWidths.title - 8);
    doc.text(wrappedTitle, drawX + 4, currentY + 6);
    
    drawX += colWidths.title;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.setFont("times", "normal");
    doc.text(row.pageNo, drawX + colWidths.page / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.page;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    const formattedDate = row.datePerf ? formatDateStr(row.datePerf) : '';
    doc.text(formattedDate, drawX + colWidths.date / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.date;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);
    doc.text(row.remark || '', drawX + colWidths.remark / 2, currentY + 6.5, { align: 'center' });
    
    drawX += colWidths.remark;
    doc.line(drawX, currentY, drawX, currentY + rowHeight);

    currentY += rowHeight;
  });

  currentY += 12;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("SIGNATURE OF TEACHER", pageWidth - margin - 50, currentY);

  doc.save("IndexSheet.pdf");
}

// --- FORM AND DOM INTERACTIVE HANDLERS ---

function initEventHandlers() {
  
  // Mobile Hamburger Toggle
  const btnHamburger = document.getElementById('btn-hamburger');
  const mobMenu = document.getElementById('mobile-nav-menu');
  const mobOverlay = document.getElementById('mobile-nav-overlay');
  if (btnHamburger && mobMenu && mobOverlay) {
    btnHamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      mobMenu.classList.add('open');
      mobOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // PREVENT BACKGROUND SCROLL
    });
    // Close menu when clicking on the overlay
    mobOverlay.addEventListener('click', () => {
      mobMenu.classList.remove('open');
      mobOverlay.classList.remove('open');
      document.body.style.overflow = ''; // RESTORE BACKGROUND SCROLL
    });
    mobMenu.addEventListener('click', (e) => {
      const trigger = e.target.closest('.btn-download-app-trigger');
      if (trigger) {
        e.preventDefault();
        mobMenu.classList.remove('open');
        mobOverlay.classList.remove('open');
        document.body.style.overflow = '';
        
        const modal = document.getElementById('modal-download-app');
        const errAlert = document.getElementById('download-app-error');
        if (modal) {
          if (errAlert) errAlert.style.display = 'none';
          modal.style.display = 'flex';
        }
        return;
      }
      
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !link.hasAttribute('download') && link.getAttribute('target') !== '_blank') {
          const isRoute = href.startsWith('/') || href.startsWith('#/');
          if (isRoute) {
            e.preventDefault();
            mobMenu.classList.remove('open');
            mobOverlay.classList.remove('open');
            document.body.style.overflow = '';
            
            let targetPath = href;
            if (targetPath.startsWith('#/')) {
              targetPath = targetPath.slice(1);
            }
            navigate(targetPath);
            return;
          }
        }
      }
      
      e.stopPropagation();
    });
  }

  // Admin User Directory Search Events
  const adminSearchInput = document.getElementById('admin-user-search-input');
  const adminSearchBtn = document.getElementById('btn-admin-user-search');
  const adminSearchClearBtn = document.getElementById('btn-admin-user-search-clear');

  if (adminSearchInput && adminSearchBtn && adminSearchClearBtn) {
    const triggerSearch = () => {
      adminUserSearchQuery = adminSearchInput.value || '';
      directoryVisibleCount = 5; // Reset page size on new search
      renderAdminDashboardView();
    };

    adminSearchBtn.addEventListener('click', triggerSearch);
    adminSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        triggerSearch();
      }
    });

    adminSearchClearBtn.addEventListener('click', () => {
      adminSearchInput.value = '';
      adminUserSearchQuery = '';
      directoryVisibleCount = 5; // Reset page size
      renderAdminDashboardView();
    });
  }

  // History and Hash Routing
  window.addEventListener('popstate', router);
  window.addEventListener('hashchange', router);

  // Global click interceptor for clean pathname routing
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !link.hasAttribute('download') && link.getAttribute('target') !== '_blank') {
        const isRoute = href.startsWith('/') || href.startsWith('#/');
        if (isRoute) {
          e.stopPropagation();
          e.preventDefault();
          let targetPath = href;
          if (targetPath.startsWith('#/')) {
            targetPath = targetPath.slice(1);
          }
          navigate(targetPath);
        }
      }
    }
  });

  // Footer Year
  const footerYear = document.getElementById('footer-year');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // Download App Modal Listeners for Desktop Navbar
  document.addEventListener('click', async (e) => {
    // Dropdown toggle click
    const btnMore = e.target.closest('.btn-more-options');
    if (btnMore) {
      e.stopPropagation();
      const docId = btnMore.getAttribute('data-id');
      const dropdown = document.getElementById(`dropdown-${docId}`);
      if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        // Close all other dropdowns
        document.querySelectorAll('.more-options-dropdown').forEach(el => el.style.display = 'none');
        // Toggle this one
        dropdown.style.display = isVisible ? 'none' : 'block';
      }
      return;
    }

    // Close dropdowns if clicked outside
    if (!e.target.closest('.more-options-container')) {
      document.querySelectorAll('.more-options-dropdown').forEach(el => el.style.display = 'none');
    }

    // Pin document click
    const btnPin = e.target.closest('.btn-pin-doc');
    if (btnPin) {
      e.stopPropagation();
      const docId = btnPin.getAttribute('data-id');
      btnPin.disabled = true;
      try {
        const res = await api.togglePinDocument(docId);
        alert(res.message || 'Updated pin status');
        await router();
      } catch (err) {
        alert(err.message || 'Failed to toggle pin');
        btnPin.disabled = false;
      }
      return;
    }

    // Capture profile logout button click
    const logoutBtn = e.target.closest('#btn-profile-logout');
    if (logoutBtn) {
      api.logout();
      currentUser = null;

      updateNavbar();
      navigate('/');
      return;
    }

    // Intercept terms of service link clicks
    const termsLink = e.target.closest('a[href="/terms"]');
    if (termsLink) {
      e.preventDefault();
      showTermsModal();
      return;
    }

    // Intercept privacy policy link clicks
    const privacyLink = e.target.closest('a[href="/privacy"]');
    if (privacyLink) {
      e.preventDefault();
      showPrivacyModal();
      return;
    }

    // Only capture triggers for downloading the app
    const trigger = e.target.closest('.btn-download-app-trigger');
    if (trigger) {
      e.preventDefault();
      const modal = document.getElementById('modal-download-app');
      const errAlert = document.getElementById('download-app-error');
      if (modal) {
        if (errAlert) errAlert.style.display = 'none';
        modal.style.display = 'flex';
      }
      return;
    }

    // Capture shift/move document button clicks (for admins)
    const moveTrigger = e.target.closest('.btn-move-doc');
    if (moveTrigger) {
      e.preventDefault();
      const id = moveTrigger.getAttribute('data-id');
      const title = moveTrigger.getAttribute('data-title');
      openMoveDocumentModal(id, title);
    }
  });

  const btnDownloadAndroid = document.getElementById('btn-download-android');
  if (btnDownloadAndroid) {
    btnDownloadAndroid.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = '/studyhub.apk';
      link.download = 'studyhub.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      const modal = document.getElementById('modal-download-app');
      if (modal) modal.style.display = 'none';
    });
  }

  const btnDownloadIos = document.getElementById('btn-download-ios');
  const downloadErrAlert = document.getElementById('download-app-error');
  if (btnDownloadIos && downloadErrAlert) {
    btnDownloadIos.addEventListener('click', () => {
      downloadErrAlert.textContent = 'App for iOS is Under development.';
      downloadErrAlert.style.display = 'block';
    });
  }


  const btnCancelDownload = document.getElementById('modal-download-app-cancel');
  if (btnCancelDownload) {
    btnCancelDownload.addEventListener('click', () => {
      const modal = document.getElementById('modal-download-app');
      if (modal) modal.style.display = 'none';
    });
  }

  // Populate dynamic upload academic years
  const uploadYearSel = document.getElementById('upload-doc-year');
  const years = getAcademicYears();
  uploadYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');

  // 1. ANNOUNCEMENT POST FORM
  const addAnnBtn = document.getElementById('btn-add-announcement');
  const annForm = document.getElementById('form-announcement');
  const addAnnText = document.getElementById('text-add-announcement');

  addAnnBtn.addEventListener('click', () => {
    if (annForm.style.display === 'none') {
      annForm.style.display = 'block';
      addAnnText.textContent = 'Cancel';
    } else {
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
    }
  });

  annForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();
    const docUrl = document.getElementById('ann-link').value.trim();
    if (!title || !content) return;

    const submitBtn = annForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      await api.createAnnouncement(title, content, docUrl || null);
      document.getElementById('ann-title').value = '';
      document.getElementById('ann-content').value = '';
      document.getElementById('ann-link').value = '';
      annForm.style.display = 'none';
      addAnnText.textContent = 'Add Announcement';
      await renderHomeView();
    } catch (err) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 2. LOGIN FORM
  const loginForm = document.getElementById('form-login');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const errorAlert = document.getElementById('login-error-alert');
    const btnContent = document.getElementById('login-btn-content');

    errorAlert.style.display = 'none';
    btnContent.innerHTML = 'Logging in...';

    try {
      const res = await api.login(phone, password);
      currentUser = res.user;
      updateNavbar();
      startNotificationPolling();
      navigate('/');
      checkCompulsoryEmail();
      if (res.isNewUser) {
        // Automatically download user manual for new users
        downloadUserManual();
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to login';
      errorAlert.style.display = 'block';
      if (err.message && err.message.includes('pending')) {
        errorAlert.className = 'alert alert-warning';
      } else {
        errorAlert.className = 'alert alert-danger';
      }
      btnContent.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px;"></i> Login';
      refreshIcons();
    }
  });

  // Password Visibility Toggles
  const btnShowLoginPass = document.getElementById('btn-show-login-password');
  if (btnShowLoginPass) {
    btnShowLoginPass.addEventListener('click', () => {
      const input = document.getElementById('login-password');
      const icon = btnShowLoginPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowSignupPass = document.getElementById('btn-show-signup-password');
  if (btnShowSignupPass) {
    btnShowSignupPass.addEventListener('click', () => {
      const input = document.getElementById('signup-password');
      const icon = btnShowSignupPass.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  // Reset Password Visibility Toggles
  const btnShowResetOld = document.getElementById('btn-show-reset-old-password');
  if (btnShowResetOld) {
    btnShowResetOld.addEventListener('click', () => {
      const input = document.getElementById('reset-old-password');
      const icon = btnShowResetOld.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowResetNew = document.getElementById('btn-show-reset-new-password');
  if (btnShowResetNew) {
    btnShowResetNew.addEventListener('click', () => {
      const input = document.getElementById('reset-new-password');
      const icon = btnShowResetNew.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  const btnShowResetConfirm = document.getElementById('btn-show-reset-confirm-password');
  if (btnShowResetConfirm) {
    btnShowResetConfirm.addEventListener('click', () => {
      const input = document.getElementById('reset-confirm-password');
      const icon = btnShowResetConfirm.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      refreshIcons();
    });
  }

  // Reset Password Form Submit
  const resetPasswordForm = document.getElementById('form-reset-password');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('reset-old-password').value;
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;

      const errorAlert = document.getElementById('reset-password-error-alert');
      const successAlert = document.getElementById('reset-password-success-alert');
      const btnContent = document.getElementById('reset-password-btn-content');

      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';
      btnContent.innerHTML = 'Changing Password...';

      if (newPassword.length < 6) {
        errorAlert.textContent = 'New password must be at least 6 characters';
        errorAlert.style.display = 'block';
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
        return;
      }

      if (newPassword !== confirmPassword) {
        errorAlert.textContent = 'New passwords do not match';
        errorAlert.style.display = 'block';
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
        return;
      }

      try {
        const res = await api.resetPassword(oldPassword, newPassword, confirmPassword);
        successAlert.textContent = res.message || 'Password successfully changed!';
        successAlert.style.display = 'block';
        
        // Clear input fields
        document.getElementById('reset-old-password').value = '';
        document.getElementById('reset-new-password').value = '';
        document.getElementById('reset-confirm-password').value = '';
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to reset password';
        errorAlert.style.display = 'block';
      } finally {
        btnContent.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px;"></i> Change Password';
        refreshIcons();
      }
    });
  }

  // Forgot password button on reset-password page
  const btnResetForgot = document.getElementById('btn-reset-page-forgot');
  if (btnResetForgot) {
    btnResetForgot.addEventListener('click', () => {
      navigate('/forgot-password');
    });
  }

  // 3. SIGNUP FORM
  const signupForm = document.getElementById('form-signup');
  const roleSelect = document.getElementById('signup-role');
  const roleHint = document.getElementById('signup-role-hint');

  // Dropdown role hint changer
  if (roleSelect && roleHint) {
    roleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'student') {
        roleHint.textContent = 'âœ“ Instant approval. Get immediate access.';
      } else {
        roleHint.textContent = 'âš  Requires Admin manual approval before logging in.';
      }
    });
  }

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const email = document.getElementById('signup-email') ? document.getElementById('signup-email').value.trim() : '';
    const password = document.getElementById('signup-password').value;
    const role = roleSelect ? roleSelect.value : 'student';

    const errorAlert = document.getElementById('signup-error-alert');
    const successAlert = document.getElementById('signup-success-alert');
    const successText = document.getElementById('signup-success-text');
    const btnContent = document.getElementById('signup-btn-content');

    errorAlert.style.display = 'none';
    successAlert.style.display = 'none';
    btnContent.innerHTML = 'Creating Account...';

    if (phone.length < 10) {
      errorAlert.textContent = 'Phone number must be at least 10 digits';
      errorAlert.style.display = 'block';
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      refreshIcons();
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      errorAlert.textContent = 'Please enter a valid email address (e.g. example@gmail.com)';
      errorAlert.style.display = 'block';
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      refreshIcons();
      return;
    }

    try {
      const res = await api.signup(name, phone, email, password, role);
      if (res.requiresApproval) {
        successText.textContent = res.message;
        successAlert.style.display = 'flex';
        signupForm.style.display = 'none';
      } else {
        currentUser = res.user;
        updateNavbar();
        startNotificationPolling();
        navigate('/');
        // Automatically download user manual for new users
        downloadUserManual();
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to sign up';
      errorAlert.style.display = 'block';
    } finally {
      btnContent.innerHTML = '<i data-lucide="user-plus" style="width:18px;height:18px;"></i> Register';
      refreshIcons();
    }
  });

  // 4. FOLDER OPERATION MODAL FORM
  const folderForm = document.getElementById('form-folder');
  
  // Close / Cancel modal listeners
  document.getElementById('modal-folder-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-folder-cancel').addEventListener('click', closeAllModals);

  folderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const folderId = document.getElementById('modal-folder-id').value;
    const name = document.getElementById('modal-folder-name').value.trim();
    const sectionType = document.getElementById('modal-folder-section-type').value;

    if (!name) return;

    const submitBtn = folderForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      if (folderId) {
        // Rename folder
        await api.renameFolder(folderId, name);
      } else {
        // Create new folder
        await api.createFolder(name, sectionType);
      }
      closeAllModals();

      // Reload active view state
      if (sectionType === 'notes') {
        await renderNotesView();
      } else if (sectionType === 'papers') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      alert(err.message || 'Failed to save subject folder');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // 5. DOCUMENT UPLOAD MODAL FORM
  const uploadForm = document.getElementById('form-upload');
  const dragBox = document.getElementById('upload-drag-box');
  const fileInput = document.getElementById('upload-file-input');
  const fileLabel = document.getElementById('upload-file-label');

  document.getElementById('modal-upload-close').addEventListener('click', closeAllModals);
  document.getElementById('modal-upload-cancel').addEventListener('click', closeAllModals);

  // File trigger click
  dragBox.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      fileLabel.textContent = file.name;
    } else {
      fileLabel.textContent = 'Click to browse files';
    }
  });

  // Source Mode tab switcher events
  const tabUploadFile = document.getElementById('tab-upload-file');
  const tabUploadLink = document.getElementById('tab-upload-link');
  const tabUploadScan = document.getElementById('tab-upload-scan');
  const groupUploadFile = document.getElementById('group-upload-file');
  const groupUploadLink = document.getElementById('group-upload-link');
  const groupUploadScan = document.getElementById('group-upload-scan');
  const uploadLinkInput = document.getElementById('upload-link-input');
  const uploadErrorAlert = document.getElementById('upload-error-alert');

  if (tabUploadFile && tabUploadLink && tabUploadScan) {
    tabUploadFile.addEventListener('click', () => {
      uploadSourceMode = 'file';
      tabUploadFile.classList.add('active');
      tabUploadLink.classList.remove('active');
      tabUploadScan.classList.remove('active');
      if (groupUploadFile) groupUploadFile.style.display = 'block';
      if (groupUploadLink) groupUploadLink.style.display = 'none';
      if (groupUploadScan) groupUploadScan.style.display = 'none';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
      const galleryWrapper = document.getElementById('scan-gallery-and-actions');
      if (streamWrapper) streamWrapper.style.display = 'none';
      if (galleryWrapper) galleryWrapper.style.display = 'block';
    });

    tabUploadLink.addEventListener('click', () => {
      uploadSourceMode = 'link';
      tabUploadFile.classList.remove('active');
      tabUploadLink.classList.add('active');
      tabUploadScan.classList.remove('active');
      if (groupUploadFile) groupUploadFile.style.display = 'none';
      if (groupUploadLink) groupUploadLink.style.display = 'block';
      if (groupUploadScan) groupUploadScan.style.display = 'none';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
      const galleryWrapper = document.getElementById('scan-gallery-and-actions');
      if (streamWrapper) streamWrapper.style.display = 'none';
      if (galleryWrapper) galleryWrapper.style.display = 'block';
    });

    tabUploadScan.addEventListener('click', () => {
      uploadSourceMode = 'scan';
      tabUploadFile.classList.remove('active');
      tabUploadLink.classList.remove('active');
      tabUploadScan.classList.add('active');
      if (groupUploadFile) groupUploadFile.style.display = 'none';
      if (groupUploadLink) groupUploadLink.style.display = 'none';
      if (groupUploadScan) groupUploadScan.style.display = 'block';
      if (uploadErrorAlert) uploadErrorAlert.style.display = 'none';
    });
  }

  // Scan file input & button events
  const btnScanCamera = document.getElementById('btn-scan-camera');
  const btnScanGallery = document.getElementById('btn-scan-gallery');
  const btnScanClear = document.getElementById('btn-scan-clear');
  const btnScanCapture = document.getElementById('btn-scan-capture');
  const btnScanStop = document.getElementById('btn-scan-stop');
  const scanVideo = document.getElementById('scan-video');
  const streamWrapper = document.getElementById('scan-camera-stream-wrapper');
  const galleryWrapper = document.getElementById('scan-gallery-and-actions');
  const scanGalleryInput = document.getElementById('scan-gallery-input');

  const handleScanFiles = async (files, triggerButton) => {
    if (!files.length) return;
    
    const originalText = triggerButton.innerHTML;
    triggerButton.disabled = true;
    triggerButton.innerHTML = 'Compressing...';
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImage(file);
        scanImages.push(compressed);
      }
      renderScanPreviewGallery();
    } catch (err) {
      console.error(err);
      alert('Error processing one or more photos.');
    } finally {
      triggerButton.disabled = false;
      triggerButton.innerHTML = originalText;
    }
  };

  if (btnScanCamera && streamWrapper && galleryWrapper) {
    btnScanCamera.addEventListener('click', async () => {
      // Insecure Context Fallback or getUserMedia not supported (e.g. HTTP non-localhost IP browsing)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia is not supported or context is insecure. Falling back to native capture dialog.');
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'file';
        fallbackInput.accept = 'image/*';
        fallbackInput.capture = 'environment';
        fallbackInput.addEventListener('change', async (e) => {
          await handleScanFiles(Array.from(e.target.files), btnScanCamera);
        });
        fallbackInput.click();
        return;
      }

      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
        });
        if (scanVideo) {
          scanVideo.srcObject = cameraStream;
          scanVideo.play();
        }
        streamWrapper.style.display = 'block';
        galleryWrapper.style.display = 'none';
      } catch (err) {
        console.error('Camera access error:', err);
        // Automatic fallback on permissions failure or hardware lock
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'file';
        fallbackInput.accept = 'image/*';
        fallbackInput.capture = 'environment';
        fallbackInput.addEventListener('change', async (e) => {
          await handleScanFiles(Array.from(e.target.files), btnScanCamera);
        });
        fallbackInput.click();
      }
    });
  }

  if (btnScanStop && streamWrapper && galleryWrapper) {
    btnScanStop.addEventListener('click', () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      streamWrapper.style.display = 'none';
      galleryWrapper.style.display = 'block';
    });
  }

  if (btnScanCapture && scanVideo) {
    btnScanCapture.addEventListener('click', () => {
      if (!cameraStream) return;
      
      const canvas = document.createElement('canvas');
      const width = scanVideo.videoWidth || 1280;
      const height = scanVideo.videoHeight || 960;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(scanVideo, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      scanImages.push({
        dataUrl,
        width,
        height
      });
      
      // Snap flash visual effect
      scanVideo.style.opacity = '0.3';
      setTimeout(() => {
        scanVideo.style.opacity = '1';
      }, 100);
      
      renderScanPreviewGallery();
    });
  }

  if (btnScanGallery && scanGalleryInput) {
    btnScanGallery.addEventListener('click', () => scanGalleryInput.click());
  }

  if (scanGalleryInput) {
    scanGalleryInput.addEventListener('change', async (e) => {
      await handleScanFiles(Array.from(e.target.files), btnScanGallery);
      scanGalleryInput.value = '';
    });
  }

  if (btnScanClear) {
    btnScanClear.addEventListener('click', () => {
      scanImages = [];
      renderScanPreviewGallery();
    });
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorAlert = document.getElementById('upload-error-alert');
    const docType = document.getElementById('upload-section-type').value;
    const folderId = document.getElementById('upload-folder-id').value;
    const title = document.getElementById('upload-doc-title').value.trim();
    const year = document.getElementById('upload-doc-year').value;
    const uploadBtnSubmit = document.getElementById('btn-upload-submit');

    errorAlert.style.display = 'none';

    if (!title) {
      errorAlert.textContent = 'Please enter a document title';
      errorAlert.style.display = 'block';
      return;
    }

    // Determine subject tag
    let subject = document.getElementById('upload-folder-name').value;
    if (docType === 'syllabus') {
      subject = document.getElementById('upload-syllabus-subject-select').value;
    }

    uploadBtnSubmit.disabled = true;
    uploadBtnSubmit.textContent = 'Processing...';

    try {
      if (uploadSourceMode === 'file') {
        const file = fileInput.files[0];
        if (!file) {
          errorAlert.textContent = 'Please select a PDF file to upload';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          errorAlert.textContent = 'Only PDF documents are allowed';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        // Check file size (10 MB = 10485760 bytes)
        const MAX_FILE_SIZE = 10485760;
        if (file.size > MAX_FILE_SIZE) {
          errorAlert.textContent = `File size too large. Got ${file.size}. Maximum is ${MAX_FILE_SIZE}.`;
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('title', title);
        formData.append('type', docType);
        formData.append('folderId', folderId || '');
        formData.append('subject', subject || '');
        formData.append('year', year || '');

        await request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      } else if (uploadSourceMode === 'scan') {
        if (scanImages.length === 0) {
          errorAlert.textContent = 'Please add/capture at least one photo';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        uploadBtnSubmit.textContent = 'Compiling PDF...';

        await ensureJsPDFLoaded();
        const { jsPDF } = window.jspdf;

        const first = scanImages[0];
        const doc = new jsPDF({
          orientation: first.width > first.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [first.width, first.height]
        });
        doc.addImage(first.dataUrl, 'JPEG', 0, 0, first.width, first.height);

        for (let i = 1; i < scanImages.length; i++) {
          const img = scanImages[i];
          doc.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
          doc.addImage(img.dataUrl, 'JPEG', 0, 0, img.width, img.height);
        }

        const pdfBlob = doc.output('blob');

        const MAX_FILE_SIZE = 10485760;
        if (pdfBlob.size > MAX_FILE_SIZE) {
          errorAlert.textContent = `Generated PDF is too large (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed is 10 MB. Please clear and scan fewer/smaller images.`;
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        uploadBtnSubmit.textContent = 'Uploading PDF...';

        const formData = new FormData();
        formData.append('pdf', pdfBlob, title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf');
        formData.append('title', title);
        formData.append('type', docType);
        formData.append('folderId', folderId || '');
        formData.append('subject', subject || '');
        formData.append('year', year || '');

        await request('/documents/upload', {
          method: 'POST',
          body: formData
        });
      } else {
        const fileUrl = uploadLinkInput.value.trim();
        if (!fileUrl) {
          errorAlert.textContent = 'Please enter a valid document URL';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
          errorAlert.textContent = 'URL must start with http:// or https://';
          errorAlert.style.display = 'block';
          uploadBtnSubmit.disabled = false;
          uploadBtnSubmit.textContent = 'Upload';
          return;
        }

        await request('/documents/upload', {
          method: 'POST',
          body: {
            title,
            type: docType,
            folderId: folderId && folderId !== 'null' ? folderId : null,
            subject: subject || null,
            year: year || null,
            fileUrl,
            fileName: title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf'
          }
        });
      }

      closeAllModals();
      
      // Reload corresponding view
      if (docType === 'notes') {
        await renderNotesView();
      } else if (docType === 'paper') {
        await renderPapersView();
      } else {
        await renderResourcesView();
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Failed to process document';
      errorAlert.style.display = 'block';
    } finally {
      uploadBtnSubmit.disabled = false;
      uploadBtnSubmit.textContent = 'Upload';
    }
  });

  // 6. EDIT DOCUMENT MODAL FORM
  const editDocForm = document.getElementById('form-edit-document');
  const editDocYearSel = document.getElementById('edit-doc-year');
  if (editDocYearSel) {
    editDocYearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  }

  const closeEditDocModal = () => {
    document.getElementById('modal-edit-document').style.display = 'none';
  };

  const btnCloseEditDoc = document.getElementById('modal-edit-document-close');
  if (btnCloseEditDoc) {
    btnCloseEditDoc.addEventListener('click', closeEditDocModal);
  }
  const btnCancelEditDoc = document.getElementById('modal-edit-document-cancel');
  if (btnCancelEditDoc) {
    btnCancelEditDoc.addEventListener('click', closeEditDocModal);
  }

  if (editDocForm) {
    editDocForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('edit-doc-error-alert');
      const docId = document.getElementById('edit-doc-id').value;
      const title = document.getElementById('edit-doc-title').value.trim();
      const subject = document.getElementById('edit-doc-subject').value.trim();
      const year = editDocYearSel.value;
      const saveBtnSubmit = document.getElementById('btn-edit-document-submit');

      errorAlert.style.display = 'none';

      if (!title) {
        errorAlert.textContent = 'Document title is required';
        errorAlert.style.display = 'block';
        return;
      }

      saveBtnSubmit.disabled = true;
      saveBtnSubmit.textContent = 'Saving changes...';

      try {
        await api.updateDocument(docId, title, subject, year);
        closeEditDocModal();
        
        // Refresh active views
        const hash = window.location.hash || '#/';
        if (hash === '#/my-uploads') {
          await renderMyUploadsView();
        } else if (hash === '#/notes') {
          await renderNotesView();
        } else if (hash === '#/papers') {
          await renderPapersView();
        } else if (hash === '#/resources') {
          await renderResourcesView();
        }
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to save changes';
        errorAlert.style.display = 'block';
      } finally {
        saveBtnSubmit.disabled = false;
        saveBtnSubmit.textContent = 'Save Changes';
      }
    });
  }

    // Move Document Modal Handlers (Admin Only)
    const moveDocForm = document.getElementById('form-move-document');
    const closeMoveDocModal = () => {
      document.getElementById('modal-move-document').style.display = 'none';
    };

    const btnCloseMoveDoc = document.getElementById('modal-move-document-close');
    if (btnCloseMoveDoc) {
      btnCloseMoveDoc.addEventListener('click', closeMoveDocModal);
    }
    const btnCancelMoveDoc = document.getElementById('modal-move-document-cancel');
    if (btnCancelMoveDoc) {
      btnCancelMoveDoc.addEventListener('click', closeMoveDocModal);
    }

    // Handle section selection change
    const moveDocSectionSel = document.getElementById('move-doc-section');
    if (moveDocSectionSel) {
      moveDocSectionSel.addEventListener('change', async (e) => {
        const section = e.target.value;
        const folderGroup = document.getElementById('move-doc-folder-group');
        const folderSelect = document.getElementById('move-doc-folder');

        if (!section || section === 'syllabus') {
          folderGroup.style.display = 'none';
          folderSelect.removeAttribute('required');
        } else {
          folderSelect.innerHTML = '<option value="">Loading folders...</option>';
          folderGroup.style.display = 'block';
          folderSelect.setAttribute('required', 'required');

          try {
            const folders = await api.getFolders(section);
            if (folders.length === 0) {
              folderSelect.innerHTML = '<option value="">No folders available in this section</option>';
            } else {
              folderSelect.innerHTML = '<option value="">Select Target Folder</option>' +
                folders.map(f => `<option value="${f.id}">${escapeHTML(f.name)}</option>`).join('');
            }
          } catch (err) {
            console.error('Error loading folders for move:', err);
            folderSelect.innerHTML = '<option value="">Error loading folders</option>';
          }
        }
      });
    }

    if (moveDocForm) {
      moveDocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorAlert = document.getElementById('move-doc-error-alert');
        const docId = document.getElementById('move-doc-id').value;
        const section = document.getElementById('move-doc-section').value;
        const folderId = document.getElementById('move-doc-folder').value;
        const saveBtnSubmit = document.getElementById('btn-move-document-submit');

        errorAlert.style.display = 'none';

        if (!section) {
          errorAlert.textContent = 'Target section is required';
          errorAlert.style.display = 'block';
          return;
        }

        if (section !== 'syllabus' && !folderId) {
          errorAlert.textContent = 'Target folder is required';
          errorAlert.style.display = 'block';
          return;
        }

        // Map section to targetType for API
        let apiType = '';
        if (section === 'notes') apiType = 'notes';
        else if (section === 'papers') apiType = 'paper';
        else if (section === 'lab_manuals') apiType = 'lab_manual';
        else if (section === 'books') apiType = 'book';
        else if (section === 'simulations' || section === 'roadmaps') apiType = 'simulation';
        else if (section === 'syllabus') apiType = 'syllabus';
        else if (section === 'competitive') apiType = 'competitive';

        saveBtnSubmit.disabled = true;
        saveBtnSubmit.textContent = 'Shifting document...';

        try {
          await api.moveDocument(docId, apiType, folderId || null);
          closeMoveDocModal();

          // Refresh active views
          const hash = window.location.hash || '#/';
          if (hash === '#/my-uploads') {
            await renderMyUploadsView();
          } else if (hash === '#/notes') {
            await renderNotesView();
          } else if (hash === '#/papers') {
            await renderPapersView();
          } else if (hash === '#/resources') {
            await renderResourcesView();
          }
        } catch (err) {
          errorAlert.textContent = err.message || 'Failed to move document';
          errorAlert.style.display = 'block';
        } finally {
          saveBtnSubmit.disabled = false;
          saveBtnSubmit.textContent = 'Shift Document';
        }
      });
    }

  // SEND MESSAGE MODAL (Admin Only)
  const sendMessageForm = document.getElementById('form-send-message');
  const closeSendMessageModal = () => {
    document.getElementById('modal-send-message').style.display = 'none';
  };

  const btnCloseSendMessage = document.getElementById('modal-send-message-close');
  if (btnCloseSendMessage) {
    btnCloseSendMessage.addEventListener('click', closeSendMessageModal);
  }
  const btnCancelSendMessage = document.getElementById('modal-send-message-cancel');
  if (btnCancelSendMessage) {
    btnCancelSendMessage.addEventListener('click', closeSendMessageModal);
  }

  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorAlert = document.getElementById('send-message-error-alert');
      const userId = document.getElementById('send-message-user-id').value;
      const message = document.getElementById('send-message-body').value.trim();
      const submitBtn = document.getElementById('btn-send-message-submit');

      errorAlert.style.display = 'none';

      if (!message) {
        errorAlert.textContent = 'Message body is required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';

      try {
        await api.sendNotification(userId, message);
        closeSendMessageModal();
        alert('Message sent successfully!');
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to send message';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  const btnSaveTemplate = document.getElementById('btn-save-as-template');
  if (btnSaveTemplate) {
    btnSaveTemplate.addEventListener('click', () => {
      const textarea = document.getElementById('send-message-body');
      if (!textarea || !textarea.value.trim()) {
        alert('Please write some text in the message body first to save as a template.');
        return;
      }
      const name = prompt('Enter a name for this template:');
      if (name && name.trim()) {
        saveMessageTemplate(name.trim(), textarea.value.trim());
      }
    });
  }

  // 7. MY UPLOADS SEARCH
  const myUploadsSearch = document.getElementById('my-uploads-search');
  if (myUploadsSearch) {
    myUploadsSearch.addEventListener('input', renderFilteredMyUploads);
  }

  // 8. HELP & SUPPORT SUBMISSION
  const supportForm = document.getElementById('form-support');
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const subject = document.getElementById('support-subject').value.trim();
      const message = document.getElementById('support-message').value.trim();
      const errorAlert = document.getElementById('support-error-alert');
      const successAlert = document.getElementById('support-success-alert');
      const submitBtn = supportForm.querySelector('button[type="submit"]');
      const btnContent = document.getElementById('support-btn-content');

      errorAlert.style.display = 'none';
      successAlert.style.display = 'none';

      const reqEmailGroup = document.getElementById('support-requested-email-group');
      const isAddEmailRequest = reqEmailGroup && reqEmailGroup.style.display !== 'none';
      let requestedEmail = null;

      if (isAddEmailRequest) {
        const reqEmailInput = document.getElementById('support-requested-email');
        requestedEmail = reqEmailInput ? reqEmailInput.value.trim().toLowerCase() : '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!requestedEmail || !emailRegex.test(requestedEmail)) {
          errorAlert.textContent = 'Please enter a valid email address to link to your account.';
          errorAlert.style.display = 'block';
          return;
        }
      }

      if (!subject || !message) {
        errorAlert.textContent = 'Subject and message are required';
        errorAlert.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      const originalHTML = btnContent.innerHTML;
      btnContent.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 18px; height: 18px;"></i> Submitting...';
      refreshIcons();

      try {
        const name = document.getElementById('support-user-name').value.trim();
        const phone = document.getElementById('support-user-phone').value.trim();
        const role = document.getElementById('support-user-role').value.trim();

        await api.submitHelpRequest(subject, message, name, phone, role, requestedEmail);
        
        if (isAddEmailRequest) {
          successAlert.innerHTML = `
            <div style="font-size: 14px; line-height: 1.5;">
              <strong style="display: block; margin-bottom: 4px;">Application Submitted Successfully!</strong>
              Your application is submitted. Our admin team will update your email in the system. Please try resetting your password again in 2 days.
              <div style="margin-top: 12px;">
                <a href="#/login" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-weight: 600;">
                  <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i> Back to Login
                </a>
              </div>
            </div>
          `;
          const reqEmailInput = document.getElementById('support-requested-email');
          if (reqEmailInput) reqEmailInput.value = '';
        } else {
          successAlert.textContent = 'Your help and support request has been submitted successfully!';
        }
        successAlert.style.display = 'block';
        document.getElementById('support-subject').value = '';
        document.getElementById('support-message').value = '';

        if (!currentUser) {
          document.getElementById('support-user-name').value = '';
          document.getElementById('support-user-phone').value = '';
          document.getElementById('support-user-role').value = '';
        }
        
        // Scroll support container to top to show success alert
        const supportCard = document.querySelector('.support-card');
        if (supportCard) supportCard.scrollTop = 0;

        await loadSupportHistory();
      } catch (err) {
        errorAlert.textContent = err.message || 'Failed to submit help request';
        errorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        btnContent.innerHTML = originalHTML;
        refreshIcons();
      }
    });
  }

  // Show History Modal Trigger
  const btnShowHistory = document.getElementById('btn-show-support-history');
  const modalSupportHistory = document.getElementById('modal-support-history');
  const modalSupportHistoryClose = document.getElementById('modal-support-history-close');
  const btnSupportHistoryClose = document.getElementById('btn-support-history-close');

  if (btnShowHistory && modalSupportHistory) {
    btnShowHistory.addEventListener('click', async () => {
      modalSupportHistory.style.display = 'flex';
      await loadSupportHistory();
    });

    const handleClose = () => {
      modalSupportHistory.style.display = 'none';
    };

    if (modalSupportHistoryClose) modalSupportHistoryClose.addEventListener('click', handleClose);
    if (btnSupportHistoryClose) btnSupportHistoryClose.addEventListener('click', handleClose);
  }
}

// Helper to escape HTML characters
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to capitalize first letter of each word in a name
function capitalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// --- NOTIFICATION POLLING SYSTEM ---
let notificationPollInterval = null;
let isNotificationModalActive = false;

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Play double chime: E5 (659Hz) then A5 (880Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.start(now);
    osc1.stop(now + 0.35);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.error("Failed to play notification sound:", err);
  }
}

async function checkNotifications() {
  // If not logged in, or already displaying a notification modal, do nothing
  if (!localStorage.getItem('token') || isNotificationModalActive) return;

  try {
    const unread = await api.getUnreadNotifications();
    if (unread && unread.length > 0) {
      // Pick the first unread notification to show
      const notif = unread[0];
      showNotificationModal(notif);
    }
  } catch (err) {
    console.error('Error polling notifications:', err);
  }
}

function showNotificationModal(notif) {
  isNotificationModalActive = true;
  
  // Play the chime
  playNotificationSound();
  
  const modal = document.getElementById('modal-view-notification');
  const contentEl = document.getElementById('notification-message-content');
  
  if (modal && contentEl) {
    contentEl.textContent = notif.message;
    modal.style.display = 'flex';
    refreshIcons(); // trigger icon rendering inside modal
    
    // Bind dismiss handlers
    const closeBtn = document.getElementById('modal-view-notification-close');
    const ackBtn = document.getElementById('btn-notification-acknowledge');
    
    const handleClose = async () => {
      modal.style.display = 'none';
      isNotificationModalActive = false;
      try {
        await api.markNotificationRead(notif.id);
        // check again for any more queued unread notifications
        setTimeout(checkNotifications, 1000);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    };
    
    if (closeBtn) closeBtn.onclick = handleClose;
    if (ackBtn) ackBtn.onclick = handleClose;
  }
}

function startNotificationPolling() {
  if (notificationPollInterval) clearInterval(notificationPollInterval);
  
  // Check immediately
  checkNotifications();
  
  // Poll every 8 seconds
  notificationPollInterval = setInterval(checkNotifications, 8000);
}

function stopNotificationPolling() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval);
    notificationPollInterval = null;
  }
}

// --- MESSAGE TEMPLATES SYSTEM ---
let messageTemplatesList = [];

async function saveMessageTemplate(name, content) {
  try {
    await api.saveMessageTemplate(name, content);
    await renderMessageTemplates();
  } catch (err) {
    alert(err.message || 'Failed to save template');
  }
}

async function renderMessageTemplates() {
  const container = document.getElementById('quick-templates-container');
  if (!container) return;
  
  container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">Loading templates...</span>';

  try {
    messageTemplatesList = await api.getMessageTemplates();
    if (messageTemplatesList.length === 0) {
      container.innerHTML = '<span style="font-size: 11px; color: var(--text-muted);">No templates saved.</span>';
      return;
    }

    container.innerHTML = messageTemplatesList.map((t, idx) => `
      <button type="button" class="btn btn-secondary btn-sm btn-select-template" data-index="${idx}" style="font-size: 11px; padding: 4px 8px; background-color: #f1f5f9; border-color: #e2e8f0; color: #475569;">
        ${escapeHTML(t.name)}
      </button>
    `).join('');
    
    container.querySelectorAll('.btn-select-template').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        const target = messageTemplatesList[idx];
        const textarea = document.getElementById('send-message-body');
        if (textarea && target) {
          textarea.value = target.content;
        }
      });
    });
  } catch (err) {
    console.error('Error rendering templates:', err);
    container.innerHTML = '<span style="font-size: 11px; color: var(--danger);">Failed to load templates.</span>';
  }
}

// --- INITIALIZE APPLICATION ---
async function initApp() {
  // Block pinch-to-zoom
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Restore view states from localStorage
  try {
    const savedNotesFolder = localStorage.getItem('currentNotesFolder');
    if (savedNotesFolder && savedNotesFolder !== 'null') currentNotesFolder = JSON.parse(savedNotesFolder);
  } catch (e) { console.error('Error restoring currentNotesFolder:', e); }

  try {
    const savedPapersFolder = localStorage.getItem('currentPapersFolder');
    if (savedPapersFolder && savedPapersFolder !== 'null') currentPapersFolder = JSON.parse(savedPapersFolder);
  } catch (e) { console.error('Error restoring currentPapersFolder:', e); }

  try {
    const savedResourcesFolder = localStorage.getItem('currentResourcesFolder');
    if (savedResourcesFolder && savedResourcesFolder !== 'null') currentResourcesFolder = JSON.parse(savedResourcesFolder);
  } catch (e) { console.error('Error restoring currentResourcesFolder:', e); }

  try {
    const savedSimStack = localStorage.getItem('simulationFolderStack') || localStorage.getItem('roadmapFolderStack');
    if (savedSimStack) {
      simulationFolderStack = JSON.parse(savedSimStack);
      roadmapFolderStack = simulationFolderStack;
    }
  } catch (e) { console.error('Error restoring simulationFolderStack:', e); }

  const savedResourcesSection = localStorage.getItem('currentResourcesSection');
  if (savedResourcesSection) {
    currentResourcesSection = savedResourcesSection === 'roadmaps' ? 'simulations' : savedResourcesSection;
  }

  // Initialize and run the elegant cursive calligraphy loading animation
  const loaderAnimPromise = initCursiveLoader();

  const token = localStorage.getItem('token');
  const loaderEl = document.getElementById('view-loading');
  if (loaderEl) loaderEl.style.display = 'flex';
  const adSpace = document.getElementById('site-ad-space');
  if (adSpace) adSpace.style.display = 'none';

  if (token) {
    try {
      currentUser = await api.getMe();
      localStorage.setItem('user', JSON.stringify(currentUser));
      startNotificationPolling();
    } catch (err) {
      console.error('Session validation failed:', err.message);
      if (err.status === 401 || err.status === 403) {
        api.logout();
        currentUser = null;
      } else {
        // Fallback to cached localStorage user if server is offline or reconnecting
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            currentUser = JSON.parse(userStr);
            startNotificationPolling();
          } catch (e) {
            api.logout();
            currentUser = null;
          }
        } else {
          api.logout();
          currentUser = null;
        }
      }
    }
  }

  // Pre-load note folders in memory for dropdown tagging inside syllabus upload (non-blocking)
  api.getFolders('notes')
    .then(list => { notesFoldersList = list; })
    .catch(err => console.error('Failed pre-loading subjects list', err));
  
  updateNavbar();
  initEventHandlers();

  initContributionEventHandlers();
  initEditorEventHandlers();
  initReviewEventHandlers();
  initEmailModalEventHandlers();
  initForgotPasswordEventHandlers();
  initAdminEmailModalEventHandlers();

  // Update mobile bottom nav position on window resizing
  window.addEventListener('resize', updateMobileBottomNavPosition);

  // Initialize PC navbar scroll animation (anime.js powered)
  initDesktopScrollNav();
  
  // Initialize Scroll Progress Bar
  initScrollProgressBar();
  
  // Clear legacy color theme overrides to ensure StudyHub classic blue default
  clearLegacyColorTheme();

  // Initialize Font Style from localStorage
  const savedFontKey = localStorage.getItem('studyhub-app-font') || 'inter';
  applyFontStyle(savedFontKey, false);

  // Initialize Theme Mode (Light / Dark)
  if (typeof initThemeModeToggle === 'function') {
    initThemeModeToggle();
  }
  
  // Run routing trigger to render current view behind loading screen
  await router();

  // Check if logged-in account needs to link an email address
  checkCompulsoryEmail();

  // Ensure handwriting animation and initial float finish smoothly before transitioning
  try {
    await loaderAnimPromise;
  } catch (e) {}

  // Smooth cinematic GSAP fade-out transition into the website
  if (loaderEl && typeof gsap !== 'undefined') {
    gsap.to(loaderEl, {
      opacity: 0,
      scale: 1.02,
      duration: 0.55,
      ease: 'power2.inOut',
      onComplete: () => {
        const wrapper = document.getElementById('sh-cursive-wrapper');
        if (wrapper) gsap.killTweensOf(wrapper);
        loaderEl.style.display = 'none';
        loaderEl.style.opacity = '0';
        if (adSpace) adSpace.style.display = '';
      }
    });
  } else if (loaderEl) {
    loaderEl.style.display = 'none';
    if (adSpace) adSpace.style.display = '';
  }
}

let cursiveLoaderPromise = null;
let animStarted = false;

function initCursiveLoader() {
  if (cursiveLoaderPromise) return cursiveLoaderPromise;

  cursiveLoaderPromise = new Promise(resolve => {
    let resolved = false;
    const safeResolve = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    // Safety timeout: Never hang for more than 3.5s if GSAP CDN fails or network hangs
    const safetyTimer = setTimeout(safeResolve, 3500);

    function start() {
      if (animStarted) return;
      animStarted = true;

      const clipRect = document.getElementById('sh-clip-rect');
      const penTip = document.getElementById('sh-pen-tip');
      const subtitle = document.getElementById('sh-loader-subtitle');
      const wrapper = document.getElementById('sh-cursive-wrapper');

      if (!clipRect || !penTip || !wrapper || typeof gsap === 'undefined') {
        clearTimeout(safetyTimer);
        safeResolve();
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeout(safetyTimer);
          safeResolve();
        }
      });

      // Pen tracer starts at the letter 'S' (16%)
      tl.set(penTip, { left: '16%', top: '50%', opacity: 1, scale: 0.5 })
        .to(penTip, { scale: 1, duration: 0.2, ease: "back.out(2)" })
        // 1. Handwriting animation: sweep clip rect across letters while pen traces wave
        .to(clipRect, {
          attr: { width: 480 },
          duration: 1.6,
          ease: "power1.inOut"
        }, "-=0.1")
        .to(penTip, {
          left: '84%',
          duration: 1.6,
          ease: "power1.inOut"
        }, "<")
        // Micro-oscillations on pen tip vertical to simulate writing strokes
        .to(penTip, {
          y: "-=13",
          repeat: 7,
          yoyo: true,
          duration: 0.1,
          ease: "sine.inOut"
        }, "<")
        // Pen tip flourish fade out
        .to(penTip, {
          opacity: 0,
          scale: 2.2,
          duration: 0.3,
          ease: "power2.out"
        })
        // Subtitle soft fade in
        .to(subtitle, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.2")
        // Start continuous gentle floating and breathing pulse
        .call(() => {
          gsap.to(wrapper, {
            y: -7,
            scale: 1.02,
            duration: 1.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }, null, "-=0.2");
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    }
    setTimeout(start, 250);
  });

  return cursiveLoaderPromise;
}

/* ============================================================
   AUTH PAGE — REAL 3D OPEN BOOK DESIGN & CONTINUOUS PAGE FLIP
   ============================================================ */
let _currentAuthBookMode = 'login'; // 'login' | 'signup'
let _bookFlipInProgress = false;

function spawnAuthParticles() { initAuthScene(); } // legacy alias

function setAuthFlipDirection(dir) { /* no-op alias */ }

/* ── setAuthBookMode: Instantly or cleanly sets the book to Login or Signup ── */
function setAuthBookMode(targetMode, animate = false) {
  if (animate && targetMode !== _currentAuthBookMode) {
    flipAuthPage(targetMode);
    return;
  }

  _currentAuthBookMode = targetMode;

  const panelLogin = document.getElementById('auth-panel-login');
  const panelSignup = document.getElementById('auth-panel-signup');
  const headerTitle = document.getElementById('book-header-page-title');
  const headerPage = document.getElementById('book-header-page-num');
  const btnToggleText = document.getElementById('btn-turn-page-text');
  const curlLabel = document.getElementById('curl-label-text');
  const footerSection = document.getElementById('book-footer-section-text');

  if (targetMode === 'signup') {
    if (panelLogin) panelLogin.classList.remove('active');
    if (panelSignup) panelSignup.classList.add('active');
    if (headerTitle) headerTitle.textContent = 'SCHOLAR REGISTRATION';
    if (headerPage) headerPage.textContent = 'PAGE 3';
    if (btnToggleText) btnToggleText.textContent = 'Turn Page to Login';
    if (curlLabel) curlLabel.textContent = 'LOGIN ➔';
    if (footerSection) footerSection.textContent = '• SECTION B : NEW ENROLLMENT •';
  } else {
    if (panelSignup) panelSignup.classList.remove('active');
    if (panelLogin) panelLogin.classList.add('active');
    if (headerTitle) headerTitle.textContent = 'STUDENT ACCESS';
    if (headerPage) headerPage.textContent = 'PAGE 2';
    if (btnToggleText) btnToggleText.textContent = 'Turn Page to Sign Up';
    if (curlLabel) curlLabel.textContent = 'SIGN UP ➔';
    if (footerSection) footerSection.textContent = '• SECTION B : PORTAL CREDENTIALS •';
  }

  // Ensure scene atmosphere is running
  initAuthScene();
}

/* ── flipAuthPage: Continuous, photorealistic 3D page turn around center spine ── */
function flipAuthPage(targetMode) {
  if (_bookFlipInProgress || targetMode === _currentAuthBookMode) return;
  _bookFlipInProgress = true;

  const leaf = document.getElementById('book-turning-leaf');
  const frontLight = document.getElementById('leaf-front-lighting');
  const backLight = document.getElementById('leaf-back-lighting');
  const castShadow = document.getElementById('leaf-cast-shadow');
  const bookCasing = document.querySelector('.real-book-casing');

  // Fallback if elements not found or GSAP missing
  if (!leaf || typeof gsap === 'undefined') {
    setAuthBookMode(targetMode, false);
    window.location.hash = targetMode === 'signup' ? '#/signup' : '#/login';
    _bookFlipInProgress = false;
    return;
  }

  const isMobile = window.innerWidth <= 860;
  if (isMobile) {
    // Clean, crisp responsive slide on mobile screens
    setAuthBookMode(targetMode, false);
    window.location.hash = targetMode === 'signup' ? '#/signup' : '#/login';
    _bookFlipInProgress = false;
    return;
  }

  // ── FORWARD FLIP: LOGIN ➔ SIGNUP ──
  if (targetMode === 'signup') {
    // 1. Reveal Signup panel immediately on base page underneath the leaf
    const panelLogin = document.getElementById('auth-panel-login');
    const panelSignup = document.getElementById('auth-panel-signup');
    if (panelLogin) panelLogin.classList.remove('active');
    if (panelSignup) panelSignup.classList.add('active');

    // 2. Set Leaf initial state resting flat on right page
    gsap.set(leaf, {
      visibility: 'visible',
      rotateY: 0,
      skewY: 0,
      scaleY: 1,
      transformOrigin: 'left center',
      transformPerspective: 2200,
      zIndex: 25,
    });
    if (frontLight) gsap.set(frontLight, { opacity: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 80%)' });
    if (backLight) gsap.set(backLight, { opacity: 0.6, background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 80%)' });
    if (castShadow) gsap.set(castShadow, { opacity: 0.1, scaleX: 0.8, transformOrigin: 'left center' });

    // Update text labels
    const headerTitle = document.getElementById('book-header-page-title');
    const headerPage = document.getElementById('book-header-page-num');
    const btnToggleText = document.getElementById('btn-turn-page-text');
    const curlLabel = document.getElementById('curl-label-text');
    const footerSection = document.getElementById('book-footer-section-text');

    if (headerTitle) headerTitle.textContent = 'SCHOLAR REGISTRATION';
    if (headerPage) headerPage.textContent = 'PAGE 3';
    if (btnToggleText) btnToggleText.textContent = 'Turn Page to Login';
    if (curlLabel) curlLabel.textContent = 'LOGIN ➔';
    if (footerSection) footerSection.textContent = '• SECTION B : NEW ENROLLMENT •';

    // 3. Play GSAP Physics Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(leaf, { visibility: 'hidden' });
        if (castShadow) gsap.set(castShadow, { opacity: 0 });
        _currentAuthBookMode = 'signup';
        _bookFlipInProgress = false;
        window.location.hash = '#/signup';
      }
    });

    // Step A: Lift & paper curl (0deg ➔ -90deg)
    tl.to(leaf, {
      rotateY: -90,
      skewY: -6,
      scaleY: 1.025,
      duration: 0.42,
      ease: 'power2.in',
    }, 0)
    .to(frontLight, { opacity: 0.65, duration: 0.38, ease: 'power2.in' }, 0)
    .to(castShadow, { opacity: 0.6, scaleX: 1.15, duration: 0.38, ease: 'power2.in' }, 0)
    .to(bookCasing, { rotateY: -1.5, duration: 0.42, ease: 'power1.inOut' }, 0);

    // Step B: Sweep over spine & settle onto left page (-90deg ➔ -180deg)
    tl.to(leaf, {
      rotateY: -180,
      skewY: 0,
      scaleY: 1,
      duration: 0.45,
      ease: 'power3.out',
    }, 0.42)
    .to(backLight, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.42)
    .to(castShadow, { opacity: 0, scaleX: 0.5, duration: 0.35, ease: 'power2.out' }, 0.42)
    .to(bookCasing, { rotateY: 0, duration: 0.48, ease: 'back.out(1.4)' }, 0.42);

  } else {
    // ── BACKWARD FLIP: SIGNUP ➔ LOGIN ──
    const panelLogin = document.getElementById('auth-panel-login');
    const panelSignup = document.getElementById('auth-panel-signup');
    if (panelSignup) panelSignup.classList.remove('active');
    if (panelLogin) panelLogin.classList.add('active');

    gsap.set(leaf, {
      visibility: 'visible',
      rotateY: -180,
      skewY: 0,
      scaleY: 1,
      transformOrigin: 'left center',
      transformPerspective: 2200,
      zIndex: 25,
    });
    if (backLight) gsap.set(backLight, { opacity: 0.6, background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 80%)' });
    if (frontLight) gsap.set(frontLight, { opacity: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 80%)' });
    if (castShadow) gsap.set(castShadow, { opacity: 0.5, scaleX: 1.1, transformOrigin: 'left center' });

    const headerTitle = document.getElementById('book-header-page-title');
    const headerPage = document.getElementById('book-header-page-num');
    const btnToggleText = document.getElementById('btn-turn-page-text');
    const curlLabel = document.getElementById('curl-label-text');
    const footerSection = document.getElementById('book-footer-section-text');

    if (headerTitle) headerTitle.textContent = 'STUDENT ACCESS';
    if (headerPage) headerPage.textContent = 'PAGE 2';
    if (btnToggleText) btnToggleText.textContent = 'Turn Page to Sign Up';
    if (curlLabel) curlLabel.textContent = 'SIGN UP ➔';
    if (footerSection) footerSection.textContent = '• SECTION B : PORTAL CREDENTIALS •';

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(leaf, { visibility: 'hidden' });
        if (castShadow) gsap.set(castShadow, { opacity: 0 });
        _currentAuthBookMode = 'login';
        _bookFlipInProgress = false;
        window.location.hash = '#/login';
      }
    });

    // Lift off left page (-180deg ➔ -90deg)
    tl.to(leaf, {
      rotateY: -90,
      skewY: 6,
      scaleY: 1.025,
      duration: 0.42,
      ease: 'power2.in',
    }, 0)
    .to(backLight, { opacity: 0.7, duration: 0.38, ease: 'power2.in' }, 0)
    .to(castShadow, { opacity: 0.65, scaleX: 1.2, duration: 0.38, ease: 'power2.in' }, 0)
    .to(bookCasing, { rotateY: 1.5, duration: 0.42, ease: 'power1.inOut' }, 0);

    // Settle onto right page (-90deg ➔ 0deg)
    tl.to(leaf, {
      rotateY: 0,
      skewY: 0,
      scaleY: 1,
      duration: 0.46,
      ease: 'back.out(1.2)',
    }, 0.42)
    .to(frontLight, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0.42)
    .to(castShadow, { opacity: 0, scaleX: 0.6, duration: 0.38, ease: 'power2.out' }, 0.42)
    .to(bookCasing, { rotateY: 0, duration: 0.48, ease: 'back.out(1.4)' }, 0.42);
  }
}

/* ── initAuthScene: Atmosphere, Lucide icons, event listeners, and 3D desk tilt ── */
function initAuthScene() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Remove stale bubbles
  document.querySelectorAll('.auth-bubble, .auth-sparkle').forEach(el => el.remove());

  const scene = document.querySelector('.auth-scene');
  if (!scene) return;

  // ── Spawn Floating Study Bubbles ──
  const BUBBLE_COUNT = 20;
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const b = document.createElement('div');
    b.className = 'auth-bubble';
    const size = 14 + Math.random() * 38;
    const bx = (Math.random() - 0.5) * 80;
    const bx2 = (Math.random() - 0.5) * 60;
    b.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      bottom:-${size + 10}px;
      --bx:${bx}px; --bx2:${bx2}px;
      animation-duration:${12 + Math.random() * 20}s;
      animation-delay:-${Math.random() * 16}s;
      opacity:${0.4 + Math.random() * 0.5};
    `;
    scene.appendChild(b);
  }

  // ── Spawn Sparkles ──
  const SPARKLE_COUNT = 14;
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const s = document.createElement('div');
    s.className = 'auth-sparkle';
    const size = 3 + Math.random() * 5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation-duration:${2 + Math.random() * 4}s;
      animation-delay:-${Math.random() * 4}s;
      opacity:${0.5 + Math.random() * 0.5};
      background: hsl(${210 + Math.random() * 30}, 85%, 65%);
    `;
    scene.appendChild(s);
  }

  // ── 3D Desk Mouse Tilt (Desktop only) ──
  const bookStand = document.querySelector('.real-book-stand');
  if (bookStand && window.innerWidth > 860 && !bookStand._tiltBound) {
    bookStand._tiltBound = true;

    const onMouseMove = (e) => {
      const r = bookStand.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      gsap
        ? gsap.to(bookStand, { rotateX: -dy * 3.5, rotateY: dx * 4.5, duration: 0.35, ease: 'power2.out', transformPerspective: 2200 })
        : (bookStand.style.transform = `perspective(2200px) rotateX(${-dy * 3.5}deg) rotateY(${dx * 4.5}deg)`);
    };

    const onMouseLeave = () => {
      gsap
        ? gsap.to(bookStand, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' })
        : (bookStand.style.transform = '');
    };

    document.addEventListener('mousemove', onMouseMove);
    bookStand.addEventListener('mouseleave', onMouseLeave);

    bookStand._tiltCleanup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      bookStand.removeEventListener('mouseleave', onMouseLeave);
      if (gsap) gsap.killTweensOf(bookStand);
      bookStand.style.transform = '';
      bookStand._tiltBound = false;
    };
  }

  // ── Wire Interactive Flip Triggers ──
  const btnToggle = document.getElementById('btn-turn-page-toggle');
  if (btnToggle && !btnToggle._flipBound) {
    btnToggle._flipBound = true;
    btnToggle.addEventListener('click', () => {
      flipAuthPage(_currentAuthBookMode === 'login' ? 'signup' : 'login');
    });
  }

  const linkToSignup = document.getElementById('link-switch-to-signup');
  if (linkToSignup && !linkToSignup._flipBound) {
    linkToSignup._flipBound = true;
    linkToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      flipAuthPage('signup');
    });
  }

  const linkToLogin = document.getElementById('link-switch-to-login');
  if (linkToLogin && !linkToLogin._flipBound) {
    linkToLogin._flipBound = true;
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      flipAuthPage('login');
    });
  }

  const cornerCurl = document.getElementById('corner-curl-trigger');
  if (cornerCurl && !cornerCurl._flipBound) {
    cornerCurl._flipBound = true;
    cornerCurl.addEventListener('click', () => {
      flipAuthPage(_currentAuthBookMode === 'login' ? 'signup' : 'login');
    });
  }
}

// Launch app
window.addEventListener('DOMContentLoaded', initApp);

async function handleLikeToggle(e, viewRefreshCallback) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const docId = btn.getAttribute('data-id');
  if (!docId) return;

  btn.disabled = true;
  try {
    await api.toggleLikeDocument(docId);
    await viewRefreshCallback();
  } catch (err) {
    alert(err.message || 'Failed to toggle like');
    btn.disabled = false;
  }
}

async function renderTeacherDashboardView() {
  const statsOwnUploads = document.getElementById('stats-own-uploads');
  const statsOwnLikes = document.getElementById('stats-own-likes');
  const statsTotalTeacherUploads = document.getElementById('stats-total-teacher-uploads');
  const rankingListContainer = document.getElementById('dashboard-ranking-list');

  if (!statsOwnUploads || !statsOwnLikes || !statsTotalTeacherUploads || !rankingListContainer) return;

  statsOwnUploads.textContent = '...';
  statsOwnLikes.textContent = '...';
  statsTotalTeacherUploads.textContent = '...';
  rankingListContainer.innerHTML = getListSkeleton();

  try {
    const stats = await api.getTeacherStats();
    statsOwnUploads.textContent = stats.ownFilesCount;
    statsOwnLikes.textContent = stats.ownLikesCount;
    statsTotalTeacherUploads.textContent = stats.totalTeacherFiles;

    const ranking = await api.getTeacherRanking();
    if (ranking.length === 0) {
      rankingListContainer.innerHTML = '<div class="empty-state">No educators registered yet.</div>';
      return;
    }

    rankingListContainer.innerHTML = ranking.map((t, index) => {
      const rankNum = index + 1;
      let trophy = '';
      if (rankNum === 1) trophy = '🏆';
      else if (rankNum === 2) trophy = '🥈';
      else if (rankNum === 3) trophy = '🥉';

      const isSelf = currentUser && currentUser.id === t.id;
      const highlightStyle = isSelf ? 'border-left: 4px solid var(--success); background-color: rgba(34, 197, 94, 0.05);' : '';

      return `
        <div class="card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; ${highlightStyle}">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 18px; font-weight: 800; min-width: 70px; display: flex; align-items: center; gap: 4px;">
              #${rankNum} ${trophy}
            </div>
            <div>
              <h4 style="margin: 0; color: var(--primary-dark); font-size: 15px;">
                ${escapeHTML(capitalizeName(t.name))}
                ${isSelf ? '<span class="user-tag" style="background-color: var(--success-accent); color: var(--success); font-size: 10px; padding: 2px 6px;">You</span>' : ''}
              </h4>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">
                ${t.uploads} uploads &bull; ${t.likes} likes
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="user-tag" style="font-weight: 700; font-size: 13px; background-color: var(--primary-accent); color: var(--primary-dark); padding: 4px 10px;">
              ${t.points} pts
            </span>
          </div>
        </div>
      `;
    }).join('');

    refreshIcons();
  } catch (err) {
    console.error('Error loading teacher stats/ranking:', err);
    rankingListContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load stats/ranking: ${escapeHTML(err.message)}</div>`;
  }
}

async function renderPendingContributions() {
  const pendingDocsCount = document.getElementById('pending-docs-count');
  const pendingDocsContainer = document.getElementById('pending-docs-list-container');
  if (!pendingDocsContainer) return;

  pendingDocsContainer.innerHTML = getListSkeleton();

  try {
    const pendingDocs = await api.getPendingDocuments();
    if (pendingDocsCount) pendingDocsCount.textContent = pendingDocs.length;

    if (pendingDocs.length === 0) {
      pendingDocsContainer.innerHTML = '<div class="empty-state" style="padding: 30px;">No pending contributions to verify.</div>';
    } else {
      pendingDocsContainer.innerHTML = pendingDocs.map(d => {
        const displayType = d.type === 'notes' ? 'Notes' : (d.type === 'paper' ? 'PYQ/Paper' : (d.type === 'lab_manual' ? 'Lab Manual' : (d.type === 'book' ? 'Book' : (d.type === 'syllabus' ? 'Syllabus' : (d.type === 'roadmap' ? 'Roadmap' : (d.type === 'competitive' ? 'Competitive Exam PYQ' : d.type))))));
        return `
          <div class="doc-card pending-doc-card" style="margin-bottom: 12px;">
            <div class="doc-info">
              <div class="doc-icon-container">
                <i data-lucide="file-text"></i>
              </div>
              <div class="doc-meta">
                <h5 style="font-size: 16px; margin-bottom: 4px; color: var(--primary-dark); font-weight: 700;">${escapeHTML(d.title)}</h5>
                <p style="font-size: 13px; color: var(--text-main); margin-bottom: 4px;">
                  Category: <strong>${escapeHTML(displayType)}</strong> &bull; Subject: <strong>${escapeHTML(d.subject || 'N/A')}</strong>
                </p>
                <p style="font-size: 12px; color: var(--text-muted);">
                  Contributor: <strong>${escapeHTML(d.contributorName)}</strong> (${escapeHTML(d.contributorPhone)}) &bull; Year: ${escapeHTML(d.year || 'N/A')}
                </p>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                  Submitted: ${new Date(d.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div class="pending-doc-actions">
              <a href="${escapeHTML(d.fileUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View File
              </a>
              <button class="btn btn-primary btn-sm btn-approve-doc" data-id="${d.id}" style="background-color: var(--success); border: none; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="check" style="width: 14px; height: 14px;"></i> Accept
              </button>
              <button class="btn btn-danger btn-sm btn-reject-doc" data-id="${d.id}" style="display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Bind approve handlers
      pendingDocsContainer.querySelectorAll('.btn-approve-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.getAttribute('data-id');
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.approveDocument(docId);
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Failed to approve resource');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });

      // Bind reject handlers
      pendingDocsContainer.querySelectorAll('.btn-reject-doc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const docId = btn.getAttribute('data-id');
          if (!confirm('Are you sure you want to reject and delete this contribution?')) return;
          const originalHTML = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = '<i data-lucide="loader-2" class="spin-animation" style="width: 14px; height: 14px;"></i>';
          refreshIcons();
          try {
            await api.rejectDocument(docId);
            await renderAdminDashboardView();
          } catch (err) {
            alert(err.message || 'Failed to reject resource');
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            refreshIcons();
          }
        });
      });
    }
  } catch (err) {
    console.error('Error rendering pending contributions:', err);
    pendingDocsContainer.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load contributions: ${escapeHTML(err.message)}</div>`;
  }
}

function initContributionEventHandlers() {
  const floatingBtn = document.getElementById('btn-floating-contribute');
  const contributeModal = document.getElementById('modal-contribute');
  const closeBtn = document.getElementById('modal-contribute-close');
  const cancelBtn = document.getElementById('modal-contribute-cancel');
  const contributeForm = document.getElementById('form-contribute');
  const categorySelect = document.getElementById('contribute-category');
  const subjectSelect = document.getElementById('contribute-subject');
  const yearSelect = document.getElementById('contribute-doc-year');
  const tabFile = document.getElementById('tab-contribute-file');
  const tabLink = document.getElementById('tab-contribute-link');
  const groupFile = document.getElementById('group-contribute-file');
  const groupLink = document.getElementById('group-contribute-link');
  const linkInput = document.getElementById('contribute-link-input');
  const fileInput = document.getElementById('contribute-file-input');
  const dragBox = document.getElementById('contribute-drag-box');
  const fileLabel = document.getElementById('contribute-file-label');
  const errorAlert = document.getElementById('contribute-error-alert');
  const successAlert = document.getElementById('contribute-success-alert');
  const submitBtn = document.getElementById('btn-contribute-submit');

  const closeContribute = () => {
    if (contributeModal) contributeModal.style.display = 'none';
  };

  async function populateFoldersForCategory(category, preselectedFolderId = null) {
    if (!subjectSelect) return;
    subjectSelect.disabled = true;
    subjectSelect.innerHTML = '<option value="" disabled selected>Loading folders...</option>';

    if (!category) {
      subjectSelect.innerHTML = '<option value="" disabled selected>Select Target Folder</option>';
      return;
    }

    try {
      if (category === 'syllabus') {
        subjectSelect.innerHTML = '<option value="general" selected>General Syllabus (No Folder Required)</option>';
        subjectSelect.disabled = false;
        return;
      }

      // Fetch all folders for this category
      const folders = await api.getAllFolders(category);
      if (!folders || folders.length === 0) {
        subjectSelect.innerHTML = `<option value="general" selected>General / Root ${escapeHTML(capitalizeName(category))} (No Subfolder)</option>`;
        subjectSelect.disabled = false;
      } else {
        let optionsHTML = '<option value="" disabled selected>Select Target Folder</option>';
        folders.forEach(f => {
          const isSelected = preselectedFolderId && String(f.id) === String(preselectedFolderId);
          optionsHTML += `<option value="${f.id}" ${isSelected ? 'selected' : ''}>${escapeHTML(f.name)}</option>`;
        });
        subjectSelect.innerHTML = optionsHTML;
        subjectSelect.disabled = false;
        if (preselectedFolderId) {
          subjectSelect.value = preselectedFolderId;
        }
      }
    } catch (err) {
      console.error('Failed to load folders for category:', err);
      subjectSelect.innerHTML = '<option value="" disabled selected>Error loading folders</option>';
    }
  }

  function openContributeModal(targetCategory = null, targetFolderId = null) {
    if (!contributeModal) return;
    contributeModal.style.display = 'flex';
    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) successAlert.style.display = 'none';
    if (contributeForm) contributeForm.reset();

    // Populate contributor name
    const contributorNameInput = document.getElementById('contribute-user-name');
    if (contributorNameInput && currentUser) {
      contributorNameInput.value = currentUser.name;
    }

    // Populate academic years
    if (yearSelect) {
      const years = getAcademicYears();
      yearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    }

    // Reset tab states
    contributeSourceMode = 'file';
    if (tabFile) tabFile.classList.add('active');
    if (tabLink) tabLink.classList.remove('active');
    if (groupFile) groupFile.style.display = 'block';
    if (groupLink) groupLink.style.display = 'none';
    if (fileLabel) fileLabel.textContent = 'Click to browse files';

    // Auto-detect current active view and folder context if not explicitly provided
    let autoCat = targetCategory;
    let autoFolderId = targetFolderId;
    if (!autoCat) {
      if (currentNotesFolder) {
        autoCat = 'notes';
        autoFolderId = currentNotesFolder.id;
      } else if (currentPapersFolder) {
        autoCat = 'papers';
        autoFolderId = currentPapersFolder.id;
      } else if (currentResourcesFolder) {
        if (currentResourcesSection.startsWith('lab_manuals')) autoCat = 'lab_manuals';
        else if (currentResourcesSection.startsWith('books')) autoCat = 'books';
        else if (currentResourcesSection.startsWith('simulations') || currentResourcesSection.startsWith('roadmaps')) autoCat = 'simulations';
        else if (currentResourcesSection.startsWith('competitive')) autoCat = 'competitive';
        autoFolderId = currentResourcesFolder.id;
      } else if (currentResourcesSection === 'syllabus') {
        autoCat = 'syllabus';
      }
    }

    if (autoCat && categorySelect) {
      categorySelect.value = autoCat;
      populateFoldersForCategory(autoCat, autoFolderId);
    } else if (subjectSelect) {
      subjectSelect.disabled = true;
      subjectSelect.innerHTML = '<option value="" disabled selected>Select Target Folder</option>';
    }

    refreshIcons();
  }

  window.openContributeModal = openContributeModal;

  if (floatingBtn) {
    floatingBtn.addEventListener('click', () => {
      openContributeModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeContribute);
  if (cancelBtn) cancelBtn.addEventListener('click', closeContribute);

  if (categorySelect && subjectSelect) {
    categorySelect.addEventListener('change', () => {
      populateFoldersForCategory(categorySelect.value);
    });
  }

  let contributeSourceMode = 'file';
  if (tabFile && tabLink) {
    tabFile.addEventListener('click', () => {
      contributeSourceMode = 'file';
      tabFile.classList.add('active');
      tabLink.classList.remove('active');
      if (groupFile) groupFile.style.display = 'block';
      if (groupLink) groupLink.style.display = 'none';
      if (errorAlert) errorAlert.style.display = 'none';
    });
    tabLink.addEventListener('click', () => {
      contributeSourceMode = 'link';
      tabFile.classList.remove('active');
      tabLink.classList.add('active');
      if (groupFile) groupFile.style.display = 'none';
      if (groupLink) groupLink.style.display = 'block';
      if (errorAlert) errorAlert.style.display = 'none';
    });
  }

  if (dragBox && fileInput) {
    dragBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileLabel.textContent = file.name;
      } else {
        fileLabel.textContent = 'Click to browse files';
      }
    });
  }

  if (contributeForm) {
    contributeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';
      if (successAlert) successAlert.style.display = 'none';

      const title = document.getElementById('contribute-doc-title').value.trim();
      const category = categorySelect.value;
      const folderId = subjectSelect.value;
      const year = yearSelect.value;
      
      if (!title || !category || !folderId) {
        if (errorAlert) {
          errorAlert.textContent = 'All fields (Title, Category, Subject) are required.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      let docType = 'notes';
      if (category === 'papers') docType = 'paper';
      else if (category === 'lab_manuals') docType = 'lab_manual';
      else if (category === 'books') docType = 'book';
      else if (category === 'simulations' || category === 'roadmaps') docType = 'simulation';
      else if (category === 'competitive') docType = 'competitive';
      else if (category === 'syllabus') docType = 'syllabus';

      const folderOption = subjectSelect.options[subjectSelect.selectedIndex];
      const subject = (folderOption && folderOption.value !== 'general')
        ? folderOption.text
        : (categorySelect.options[categorySelect.selectedIndex] ? categorySelect.options[categorySelect.selectedIndex].text : category);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
      }

      try {
        if (contributeSourceMode === 'file') {
          const file = fileInput.files[0];
          if (!file) {
            throw new Error('Please select a PDF file to upload');
          }
          if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error('Only PDF files are allowed');
          }
          if (file.size > 10485760) {
            throw new Error('File size exceeds the 10 MB limit.');
          }

          const formData = new FormData();
          formData.append('pdf', file);
          formData.append('title', title);
          formData.append('type', docType);
          formData.append('folderId', folderId);
          formData.append('subject', subject);
          formData.append('year', year);

          await api.contributeDocument(formData);
        } else {
          const link = linkInput.value.trim();
          if (!link) {
            throw new Error('Please enter a document URL');
          }
          if (!link.startsWith('http://') && !link.startsWith('https://')) {
            throw new Error('Please enter a valid URL starting with http:// or https://');
          }

          const formData = new FormData();
          formData.append('title', title);
          formData.append('type', docType);
          formData.append('folderId', folderId);
          formData.append('subject', subject);
          formData.append('year', year);
          formData.append('fileUrl', link);
          formData.append('fileName', 'Link Resource');

          await api.contributeDocument(formData);
        }

        if (successAlert) {
          successAlert.textContent = 'Thank you! Your resource has been submitted and is pending admin approval.';
          successAlert.style.display = 'block';
        }
        
        contributeForm.reset();
        if (fileLabel) fileLabel.textContent = 'Click to browse files';
        if (subjectSelect) {
          subjectSelect.disabled = true;
          subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject Folder</option>';
        }

        setTimeout(() => {
          closeContribute();
        }, 2500);

      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Failed to submit contribution';
          errorAlert.style.display = 'block';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload';
        }
      }
    });
  }
}

async function renderMyContributionsView() {
  const container = document.getElementById('view-my-contributions');
  if (!container) return;

  container.innerHTML = `
    <div class="folder-page-header">
      <div class="folder-breadcrumbs">
        <span class="breadcrumb-active" style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="award" style="color: var(--primary); width: 22px; height: 22px;"></i> 
          My Contribution Dashboard
        </span>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <p style="color: var(--text-muted); font-size: 15px; margin: 0;">
        Track your contributed files, approval status, and likes received from other students.
      </p>
    </div>

    <!-- Analytics Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px;">
      <div class="card" style="padding: 24px; text-align: center; border-left: 4px solid var(--success);">
        <div style="color: var(--text-muted); font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Accepted Contributions</div>
        <div id="stats-contributions-accepted" style="font-size: 36px; font-weight: 800; color: var(--success);">0</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Files approved by Admin</p>
      </div>
      <div class="card" style="padding: 24px; text-align: center; border-left: 4px solid var(--primary);">
        <div style="color: var(--text-muted); font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Total Likes Received</div>
        <div id="stats-contributions-likes" style="font-size: 36px; font-weight: 800; color: var(--primary-dark);">0</div>
        <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Likes on your approved resources</p>
      </div>
    </div>

    <!-- Contributed Files list -->
    <div style="border-top: 1px solid var(--border-color); padding-top: 30px;">
      <h3 class="section-title" style="margin-bottom: 16px; font-size: 20px;">
        <i data-lucide="file-text" style="color: var(--primary); width: 22px; height: 22px;"></i>
        Your Contribution Submissions
      </h3>
      <div id="student-contributions-list" class="docs-list">
        ${getListSkeleton()}
      </div>
    </div>
  `;

  refreshIcons();

  const acceptedEl = document.getElementById('stats-contributions-accepted');
  const likesEl = document.getElementById('stats-contributions-likes');
  const listEl = document.getElementById('student-contributions-list');

  try {
    const response = await request('/documents/my-contributions');
    const contributions = response || [];

    const acceptedFiles = contributions.filter(c => c.status === 'approved');
    const totalAccepted = acceptedFiles.length;
    let totalLikes = 0;
    acceptedFiles.forEach(f => {
      totalLikes += f.likesCount || 0;
    });

    if (acceptedEl) acceptedEl.textContent = totalAccepted;
    if (likesEl) likesEl.textContent = totalLikes;

    if (contributions.length === 0) {
      if (listEl) listEl.innerHTML = '<div class="empty-state">You haven\'t contributed any resources yet. Use the "+" button to start contributing!</div>';
    } else {
      if (listEl) {
        listEl.innerHTML = contributions.map(c => {
          const displayType = c.type === 'notes' ? 'Notes' : (c.type === 'paper' ? 'PYQ/Paper' : (c.type === 'lab_manual' ? 'Lab Manual' : (c.type === 'book' ? 'Book' : (c.type === 'syllabus' ? 'Syllabus' : (c.type === 'roadmap' ? 'Roadmap' : (c.type === 'competitive' ? 'Competitive Exam PYQ' : c.type))))));
          
          let statusBadge = '';
          if (c.status === 'pending') {
            statusBadge = `<span style="font-size: 11px; font-weight: 700; background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 12px; border: 1px solid #fde68a;">Pending Approval</span>`;
          } else {
            statusBadge = `<span style="font-size: 11px; font-weight: 700; background-color: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; border: 1px solid #86efac;">Approved & Live</span>`;
          }

          return `
            <div class="doc-card" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div class="doc-info">
                <div class="doc-icon-container" style="background-color: ${c.status === 'pending' ? '#fffbeb' : '#f0fdf4'}; color: ${c.status === 'pending' ? '#d97706' : '#16a34a'};">
                  <i data-lucide="file-text"></i>
                </div>
                <div class="doc-meta">
                  <h5 style="font-size: 15px; font-weight: 700; color: var(--primary-dark); margin: 0 0 4px 0;">${escapeHTML(c.title)}</h5>
                  <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 4px 0;">
                    Category: <strong>${escapeHTML(displayType)}</strong> &bull; Subject: <strong>${escapeHTML(c.subject || 'N/A')}</strong>
                  </p>
                  <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
                    Submitted: ${new Date(c.createdAt).toLocaleDateString()} &bull; Likes: ${c.likesCount}
                  </p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                ${statusBadge}
                ${c.status === 'approved' ? `
                  <a href="${escapeHTML(c.fileUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 6px 12px;"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    }
    refreshIcons();
  } catch (err) {
    console.error('Error fetching student contributions stats:', err);
    if (listEl) listEl.innerHTML = `<div class="empty-state" style="color: var(--danger);">Failed to load contributions details: ${escapeHTML(err.message)}</div>`;
  }
}



/* --- THEME MODE CONTROLLER (LIGHT / DARK) --- */
function initThemeModeToggle() {
  const currentTheme = localStorage.getItem('studyhub-theme-mode') || 'light';
  syncThemeCheckboxes(currentTheme === 'dark');

  const toggles = document.querySelectorAll('#theme-mode-toggle, #theme-mode-toggle-mobile, #theme-mode-toggle-appearance');
  toggles.forEach(toggle => {
    toggle.onchange = (e) => {
      const isDark = e.target.checked;
      setThemeMode(isDark ? 'dark' : 'light', true);
    };
  });
}

function syncThemeCheckboxes(isDark) {
  const toggles = document.querySelectorAll('#theme-mode-toggle, #theme-mode-toggle-mobile, #theme-mode-toggle-appearance');
  toggles.forEach(t => {
    t.checked = isDark;
  });

  // Highlight active labels in top switcher bar
  const lightLabels = document.querySelectorAll('.ui-toggle-label.light-label');
  const darkLabels = document.querySelectorAll('.ui-toggle-label.dark-label');
  lightLabels.forEach(l => {
    l.style.color = !isDark ? 'var(--primary)' : 'var(--text-muted)';
    l.style.fontWeight = !isDark ? '700' : '500';
  });
  darkLabels.forEach(d => {
    d.style.color = isDark ? '#93c5fd' : 'var(--text-muted)';
    d.style.fontWeight = isDark ? '700' : '500';
  });
}

function setThemeMode(mode, animate = true) {
  const isDark = (mode === 'dark');
  localStorage.setItem('studyhub-theme-mode', isDark ? 'dark' : 'light');

  syncThemeCheckboxes(isDark);

  const applyMode = () => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (document.body) {
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
    const root = document.documentElement;
    root.style.removeProperty('--primary');
    root.style.removeProperty('--primary-dark');
    root.style.removeProperty('--primary-light');
    root.style.removeProperty('--primary-accent');
    root.style.removeProperty('--primary-rgb');
    root.style.removeProperty('--primary-glow');
    if (isDark) {
      root.style.setProperty('--bg-gradient', 'radial-gradient(ellipse at 50% -10%, #10214a 0%, #0a142c 45%, #040711 100%)');
    } else {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  if (!animate) {
    applyMode();
    if (typeof refreshIcons === 'function') refreshIcons();
    return;
  }

  const overlay = document.getElementById('theme-transition-overlay');
  if (overlay) {
    overlay.style.opacity = '0.7';
    overlay.style.pointerEvents = 'all';
  }

  requestAnimationFrame(() => {
    applyMode();
    setTimeout(() => {
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
    }, 120);
  });
}
