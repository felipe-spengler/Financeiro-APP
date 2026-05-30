/// <reference types="vite/client" />
import axios from 'axios';
import toast from 'react-hot-toast';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://diario.techinteligente.site/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A mockup of the base44 SDK interface to prevent immediate breaking changes across the app
// This allows us to do a progressive "desmame"
// --- MOTOR OFFLINE MÍNIMO ---
export const syncQueue = {
  getQueue: () => JSON.parse(localStorage.getItem('FINANCEIROAPP_SYNC_QUEUE') || '[]'),
  push: (item) => {
    const queue = syncQueue.getQueue();
    queue.push(item);
    localStorage.setItem('FINANCEIROAPP_SYNC_QUEUE', JSON.stringify(queue));
  },
  clear: () => localStorage.removeItem('FINANCEIROAPP_SYNC_QUEUE'),
  sync: async () => {
    const queue = syncQueue.getQueue();
    if (queue.length === 0) return;
    try {
      await apiClient.post('/expenses/sync', queue);
      syncQueue.clear();
      toast.success('Despesas sincronizadas com sucesso!');
    } catch (e) {
      console.error('Falha ao sincronizar a fila', e);
    }
  }
};

window.addEventListener('online', syncQueue.sync);

export const base44 = {
  auth: {
    me: () => apiClient.get('/auth/me').then(res => res.data),
    logout: (redirectUrl) => {
      localStorage.removeItem('token');
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin: (returnUrl) => {
      window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
  },
  entities: {
    Expense: {
      list: (sort, limit) => apiClient.get('/expenses', { params: { sort, limit } }).then(res => res.data),
      create: async (data) => {
        if (!navigator.onLine) {
           syncQueue.push(data);
           toast('Salvo Offline! Sincronizará quando houver internet.', { icon: '✈️' });
           // Return mocked resolve to prevent UI crash
           return { id: 'temp-' + Date.now(), ...data }; 
        }
        return apiClient.post('/expenses', data).then(res => res.data);
      },
      update: (id, data) => apiClient.put(`/expenses/${id}`, data).then(res => res.data),
      delete: (id) => apiClient.delete(`/expenses/${id}`).then(res => res.data),
    },
    Project: {
      list: (sort) => apiClient.get('/projects', { params: { sort } }).then(res => res.data),
      create: (data) => apiClient.post('/projects', data).then(res => res.data),
      update: (id, data) => apiClient.put(`/projects/${id}`, data).then(res => res.data),
      delete: (id) => apiClient.delete(`/projects/${id}`).then(res => res.data),
    },
    CreditCard: {
      list: () => apiClient.get('/credit-cards').then(res => res.data),
      create: (data) => apiClient.post('/credit-cards', data).then(res => res.data),
      update: (id, data) => apiClient.put(`/credit-cards/${id}`, data).then(res => res.data),
      delete: (id) => apiClient.delete(`/credit-cards/${id}`).then(res => res.data),
    }
  },
  integrations: {
    Core: {
      UploadFile: async (data) => {
        const formData = new FormData();
        formData.append('file', data.file);
        const res = await apiClient.post('/upload/receipt', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      },
      InvokeLLM: async (data) => {
        const res = await apiClient.post('/ai/scan', data);
        return res.data;
      },
      ParseVoice: async (payload) => {
        const data = typeof payload === 'string' ? { text: payload } : payload;
        const res = await apiClient.post('/ai/parse-voice', data);
        return res.data;
      }
    }
  }
};
