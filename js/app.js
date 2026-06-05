/**
 * Student Administrative Portal - Main Logic
 * All data stored in localStorage
 */

// ============================================
// MOCK DATA INITIALIZATION
// ============================================

const DEFAULT_USERS = [
  {
    nim: "11223344",
    password: "rahasia123",
    name: "Budi Santoso"
  },
  {
    nim: "11223345",
    password: "password456",
    name: "Ani Wijaya"
  }
];

const DEFAULT_COURSES = [
  { code: "MK001", name: "Algoritma & Pemrograman", sks: 3, day: "Senin", time: "08:00-10:00", room: "R.201", lecturer: "Dr. Andi" },
  { code: "MK002", name: "Basis Data", sks: 3, day: "Selasa", time: "10:00-12:00", room: "R.302", lecturer: "Dr. Sari" },
  { code: "MK003", name: "Kalkulus", sks: 2, day: "Rabu", time: "08:00-10:00", room: "R.101", lecturer: "Prof. Budi" },
  { code: "MK004", name: "Sistem Operasi", sks: 3, day: "Kamis", time: "13:00-15:00", room: "R.205", lecturer: "Dr. Rina" },
  { code: "MK005", name: "Jaringan Komputer", sks: 3, day: "Jumat", time: "10:00-12:00", room: "Lab.1", lecturer: "Dr. Ahmad" },
  { code: "MK006", name: "Pemrograman Web", sks: 3, day: "Senin", time: "13:00-15:00", room: "Lab.2", lecturer: "Dr. Maya" },
  { code: "MK007", name: "Kecerdasan Buatan", sks: 3, day: "Selasa", time: "08:00-10:00", room: "R.303", lecturer: "Prof. Dedi" },
  { code: "MK008", name: "Statistika", sks: 2, day: "Rabu", time: "10:00-12:00", room: "R.102", lecturer: "Dr. Lisa" }
];

const DEFAULT_PROFILE = {
  nim: "11223344",
  name: "Budi Santoso",
  address: "Jl. Diponegoro No. 12, Salatiga",
  phone: "081234567890",
  bank: "BCA",
  accountNumber: "1234567890",
  accountName: "Budi Santoso"
};

const DEFAULT_GRADES = [
  { code: "MK001", name: "Algoritma & Pemrograman", sks: 3, grade: "A", weight: 4.0 },
  { code: "MK003", name: "Kalkulus", sks: 2, grade: "B+", weight: 3.5 },
  { code: "MK005", name: "Jaringan Komputer", sks: 3, grade: "B", weight: 3.0 }
];

// ============================================
// INITIALIZATION FUNCTIONS
// ============================================

function initMockData() {
  if (!localStorage.getItem('mock_users')) {
    localStorage.setItem('mock_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('available_courses')) {
    localStorage.setItem('available_courses', JSON.stringify(DEFAULT_COURSES));
  }
  if (!localStorage.getItem('student_profile')) {
    localStorage.setItem('student_profile', JSON.stringify(DEFAULT_PROFILE));
  }
  if (!localStorage.getItem('student_grades')) {
    localStorage.setItem('student_grades', JSON.stringify(DEFAULT_GRADES));
  }
  if (!localStorage.getItem('my_krs')) {
    localStorage.setItem('my_krs', JSON.stringify(["MK001", "MK002", "MK003"]));
  }
  if (!localStorage.getItem('attendance_log')) {
    localStorage.setItem('attendance_log', JSON.stringify([]));
  }
  if (!localStorage.getItem('krs_status')) {
    localStorage.setItem('krs_status', JSON.stringify('Draft'));
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function login(nim, password) {
  const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
  const user = users.find(u => u.nim === nim && u.password === password);
  
  if (user) {
    const session = {
      nim: user.nim,
      name: user.name,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem('active_session', JSON.stringify(session));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('active_session');
  window.location.href = 'login.html';
}

function checkSession() {
  const session = localStorage.getItem('active_session');
  if (session) {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === '') {
      window.location.href = 'index.html';
    }
    return JSON.parse(session);
  } else {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'login.html') {
      window.location.href = 'login.html';
    }
    return null;
  }
}

function getCurrentUser() {
  const session = localStorage.getItem('active_session');
  return session ? JSON.parse(session) : null;
}

// ============================================
// KRS FUNCTIONS
// ============================================

function getKRS() {
  const krsCodes = JSON.parse(localStorage.getItem('my_krs') || '[]');
  const allCourses = JSON.parse(localStorage.getItem('available_courses') || '[]');
  return allCourses.filter(course => krsCodes.includes(course.code));
}

function getAvailableCourses() {
  return JSON.parse(localStorage.getItem('available_courses') || '[]');
}

function addCourse(courseCode) {
  const krs = JSON.parse(localStorage.getItem('my_krs') || '[]');
  const allCourses = JSON.parse(localStorage.getItem('available_courses') || '[]');
  const course = allCourses.find(c => c.code === courseCode);
  
  if (!course) return { success: false, message: 'Mata kuliah tidak ditemukan' };
  if (krs.includes(courseCode)) return { success: false, message: 'Mata kuliah sudah diambil' };
  
  const currentSKS = getTotalSKS();
  if (currentSKS + course.sks > 24) {
    return { success: false, message: 'Melebihi batas maksimal 24 SKS' };
  }
  
  // Check schedule conflict
  const conflict = checkScheduleConflict(course);
  if (conflict.hasConflict) {
    return { success: false, message: `Jadwal bentrok dengan ${conflict.course}` };
  }
  
  krs.push(courseCode);
  localStorage.setItem('my_krs', JSON.stringify(krs));
  localStorage.setItem('krs_status', JSON.stringify('Draft'));
  return { success: true, message: 'Mata kuliah berhasil ditambahkan' };
}

function dropCourse(courseCode) {
  let krs = JSON.parse(localStorage.getItem('my_krs') || '[]');
  if (!krs.includes(courseCode)) {
    return { success: false, message: 'Mata kuliah tidak ditemukan di KRS' };
  }
  
  krs = krs.filter(code => code !== courseCode);
  localStorage.setItem('my_krs', JSON.stringify(krs));
  localStorage.setItem('krs_status', JSON.stringify('Draft'));
  return { success: true, message: 'Mata kuliah berhasil dibatalkan' };
}

function getTotalSKS() {
  const krs = getKRS();
  return krs.reduce((total, course) => total + course.sks, 0);
}

function checkScheduleConflict(newCourse) {
  const krs = getKRS();
  for (const course of krs) {
    if (course.day === newCourse.day && course.time === newCourse.time) {
      return { hasConflict: true, course: course.name };
    }
  }
  return { hasConflict: false };
}

function getKRSStatus() {
  return JSON.parse(localStorage.getItem('krs_status') || '"Draft"');
}

function approveKRS() {
  localStorage.setItem('krs_status', JSON.stringify('Disetujui'));
}

// ============================================
// ATTENDANCE FUNCTIONS
// ============================================

function doAbsen(courseCode) {
  const attendanceLog = JSON.parse(localStorage.getItem('attendance_log') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already attended today
  const alreadyAttended = attendanceLog.some(
    log => log.courseCode === courseCode && log.date === today
  );
  
  if (alreadyAttended) {
    return { success: false, message: 'Anda sudah absen untuk mata kuliah ini hari ini' };
  }
  
  const newLog = {
    courseCode: courseCode,
    date: today,
    status: "Hadir"
  };
  
  attendanceLog.push(newLog);
  localStorage.setItem('attendance_log', JSON.stringify(attendanceLog));
  return { success: true, message: 'Absensi berhasil dicatat' };
}

function getAttendanceLog() {
  return JSON.parse(localStorage.getItem('attendance_log') || '[]');
}

function getAttendanceForCourse(courseCode) {
  const logs = getAttendanceLog();
  return logs.filter(log => log.courseCode === courseCode);
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

function getProfile() {
  return JSON.parse(localStorage.getItem('student_profile') || '{}');
}

function updateProfile(profileData) {
  const currentProfile = getProfile();
  const updatedProfile = { ...currentProfile, ...profileData };
  localStorage.setItem('student_profile', JSON.stringify(updatedProfile));
  return { success: true, message: 'Profil berhasil diperbarui' };
}

// ============================================
// GRADES FUNCTIONS
// ============================================

function getGrades() {
  return JSON.parse(localStorage.getItem('student_grades') || '[]');
}

function calculateGPA() {
  const grades = getGrades();
  if (grades.length === 0) return 0;
  
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  
  for (const grade of grades) {
    totalWeightedPoints += grade.weight * grade.sks;
    totalCredits += grade.sks;
  }
  
  return totalCredits > 0 ? (totalWeightedPoints / totalCredits).toFixed(2) : 0;
}

function getTotalPassedCredits() {
  const grades = getGrades();
  return grades.reduce((total, grade) => total + grade.sks, 0);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

function getCourseByCode(code) {
  const courses = getAvailableCourses();
  return courses.find(c => c.code === code);
}

// Initialize data on script load
initMockData();

