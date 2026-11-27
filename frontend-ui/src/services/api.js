import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Retry interceptor for cold starts on free-tier hosting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, message } = error;
    if (!config || config.skipRetry) return Promise.reject(error);

    if (typeof config._retryCount === 'undefined') {
      config._retryCount = 0;
    }

    const isRetryable =
      message?.includes('timeout') ||
      message?.includes('Network Error') ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 502 ||
      error.response?.status === 503;

    if (isRetryable && config._retryCount < 3) {
      config._retryCount += 1;
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(err, fallback = 'Request failed. Please try again.') {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Request timed out — the backend server may still be waking up.';
  }
  if (err?.message === 'Network Error') {
    return 'Cannot reach the backend server right now. Check your connection or retry in a moment.';
  }
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

// ── Questions ──────────────────────────────────────────
export const fetchQuestions = (signal) =>
  api.get('/api/questions', { signal });

export const fetchQuestion = (id, signal) =>
  api.get(`/api/questions/${id}`, { signal });

export const uploadDocuments = (formData, onUploadProgress) =>
  api.post('/api/questions/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
    onUploadProgress,
  });

export const pollUploadStatus = (jobId) =>
  api.get(`/api/questions/upload/status/${jobId}`, { skipRetry: true });

// ── Videos ──────────────────────────────────────────────
export const fetchVideos = (signal) =>
  api.get('/api/videos', { signal });

export const fetchVideosByChapter = (chapter) =>
  api.get(`/api/videos/chapter/${encodeURIComponent(chapter)}`);

export const matchVideo = (chapter, topic, bloomLevel) =>
  api.get('/api/videos/match', {
    params: { chapter, topic, bloomLevel },
  });

export const createVideo = (data) =>
  api.post('/api/videos', data);

export const updateVideo = (id, data) =>
  api.put(`/api/videos/${id}`, data);

export const deleteVideo = (id) =>
  api.delete(`/api/videos/${id}`);

// ── Diagnostics / Remediation ───────────────────────────
export const submitAnswer = (payload) =>
  api.post('/api/generate-bridge/submit', payload);

export const saveDiagnosticProgress = (attempts) =>
  api.post('/api/generate-bridge/progress/save', attempts);

// ── Proficiency ─────────────────────────────────────────
export const fetchProficiency = (signal) =>
  api.get('/api/proficiency-map', { signal });

// ── PDF + QR Export ─────────────────────────────────────
export const exportPdf = async ({ chapter, ids } = {}) => {
  const params = {};
  if (ids && ids.length > 0) {
    params.ids = ids.join(',');
  }
  if (chapter) {
    params.chapter = chapter;
  } else if (!ids || ids.length === 0) {
    params.chapter = 'All';
  }

  const response = await api.get('/api/export/pdf', {
    params,
    responseType: 'blob',
    timeout: 45000,
  });

  const filename =
    ids && ids.length > 0
      ? `Selected_${ids.length}_Questions_QR.pdf`
      : `${(chapter || 'All_Chapters').replace(/\s+/g, '_')}_QuestionBank.pdf`;

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default api;
