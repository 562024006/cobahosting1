document.addEventListener("DOMContentLoaded", function () {
  const user = checkSession();
  
  if (user) {
    const now = new Date();
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }
    const headerInfo = document.querySelector('.header-info');
    if (headerInfo) {
      headerInfo.innerHTML = `
        <div class="fs-6"><strong>:: ${user.nim} - ${user.name.toUpperCase()}</strong> (FAKULTAS TEKNOLOGI INFORMASI - TEKNIK INFORMATIKA)</div>
        <div class="small opacity-75"><strong>:: SEMESTER 3</strong> TA 2025 - 2026</div>
        <div class="badge bg-warning text-dark mt-1">Beban SKS Maksimal: 24 SKS</div>
      `;
    }
    loadScheduleData();
    loadAttendanceHistory();
  }
});

function loadScheduleData() {
  const krs = getKRS();
  const scheduleBody = document.getElementById('scheduleBody');
  if (!scheduleBody) return;

  if (krs.length === 0) {
    scheduleBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>Belum ada mata kuliah yang diambil</td></tr>';
    return;
  }
  const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 };
  krs.sort((a, b) => {
    const dayDiff = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dayDiff !== 0) return dayDiff;
    return a.time.localeCompare(b.time);
  });
  
  scheduleBody.innerHTML = '';
  krs.forEach((course, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center fw-bold">${index + 1}</td>
      <td><span class="badge bg-light text-dark border">${course.day}</span></td>
      <td><code>${course.time}</code></td>
      <td><span class="badge bg-secondary">${course.code}</span></td>
      <td><strong>${course.name}</strong></td>
      <td class="text-center">${course.sks}</td>
      <td><i class="fas fa-door-open text-muted me-1"></i>${course.room}</td>
      <td class="small"><i class="fas fa-chalkboard-teacher text-muted me-1"></i>${course.lecturer}</td>
      <td class="text-center">
        <button class="btn btn-success btn-sm px-3" onclick="attendClass('${course.code}')">
          <i class="fas fa-check me-1"></i> Absen
        </button>
      </td>
    `;
    scheduleBody.appendChild(row);
  });
}

function attendClass(courseCode) {
  const result = doAbsen(courseCode);
  if (result.success) {
    showNotification(result.message, 'success');
    loadAttendanceHistory();
  } else {
    showNotification(result.message, 'warning');
  }
}

function loadAttendanceHistory() {
  const attendanceLog = getAttendanceLog();
  const attendanceBody = document.getElementById('attendanceBody');
  if (!attendanceBody) return;
  
  if (attendanceLog.length === 0) {
    attendanceBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><i class="fas fa-history fa-2x mb-2"></i><br>Belum ada riwayat absensi</td></tr>';
    return;
  }
  const sortedLog = [...attendanceLog].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  attendanceBody.innerHTML = '';
  sortedLog.forEach((log, index) => {
    const course = getCourseByCode(log.courseCode);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="text-center text-muted">${index + 1}</td>
      <td>${formatDate(log.date)}</td>
      <td><span class="badge bg-light text-dark border">${log.courseCode}</span></td>
      <td>${course ? course.name : '<span class="text-muted">-</span>'}</td>
      <td class="text-center">
        <span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> ${log.status}</span>
      </td>
    `;
    attendanceBody.appendChild(row);
  });
}
function showNotification(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning text-dark' : 'bg-info';
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center ${bgClass} text-white border-0 show`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}