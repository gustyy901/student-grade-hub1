const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Students API
export const studentsAPI = {
  getAll: () => fetchAPI('/siswa'),
  getById: (id: string) => fetchAPI(`/siswa/${id}`),
  create: (data: { nis: string; nama: string; kelas: string; jenis_kelamin: string }) => 
    fetchAPI('/siswa', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { nis?: string; nama?: string; kelas?: string; jenis_kelamin?: string }) => 
    fetchAPI(`/siswa/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/siswa/${id}`, { method: 'DELETE' }),
};

// Subjects API
export const subjectsAPI = {
  getAll: () => fetchAPI('/mapel'),
  create: (data: { nama_mapel: string }) => 
    fetchAPI('/mapel', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { nama_mapel?: string }) => 
    fetchAPI(`/mapel/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/mapel/${id}`, { method: 'DELETE' }),
};

// Grades API
export const gradesAPI = {
  getAllAssignments: () => fetchAPI('/nilai/tugas'),
  createAssignment: (data: { student_id: string; mapel_id: string; semester: string; nilai: number; keterangan?: string }) => 
    fetchAPI('/nilai/tugas', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id: string, data: { student_id?: string; mapel_id?: string; semester?: string; nilai?: number; keterangan?: string }) => 
    fetchAPI(`/nilai/tugas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id: string) => fetchAPI(`/nilai/tugas/${id}`, { method: 'DELETE' }),
  
  getAllMidterms: () => fetchAPI('/nilai/uts'),
  createMidterm: (data: { student_id: string; mapel_id: string; semester: string; nilai: number }) => 
    fetchAPI('/nilai/uts', { method: 'POST', body: JSON.stringify(data) }),
  updateMidterm: (id: string, data: { student_id?: string; mapel_id?: string; semester?: string; nilai?: number }) => 
    fetchAPI(`/nilai/uts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMidterm: (id: string) => fetchAPI(`/nilai/uts/${id}`, { method: 'DELETE' }),
  
  getAllFinals: () => fetchAPI('/nilai/uas'),
  createFinal: (data: { student_id: string; mapel_id: string; semester: string; nilai: number }) => 
    fetchAPI('/nilai/uas', { method: 'POST', body: JSON.stringify(data) }),
  updateFinal: (id: string, data: { student_id?: string; mapel_id?: string; semester?: string; nilai?: number }) => 
    fetchAPI(`/nilai/uas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFinal: (id: string) => fetchAPI(`/nilai/uas/${id}`, { method: 'DELETE' }),

  getDetail: (student_id: string, semester: string, mapel_id?: string) => {
    let url = `/nilai/detail?student_id=${student_id}&semester=${semester}`;
    if (mapel_id) url += `&mapel_id=${mapel_id}`;
    return fetchAPI(url);
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard/stats'),
};
