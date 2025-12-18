import axios from 'axios';

// L'URL de base est relative pour fonctionner avec le proxy Vite (local) et les rewrites Vercel (prod)
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const scriptService = {
  getAll: async (offset = 0, limit = 100) => {
    const response = await api.get('/scripts/', { params: { offset, limit } });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/scripts/${id}`);
    return response.data;
  },

  create: async (scriptData) => {
    const response = await api.post('/scripts/', scriptData);
    return response.data;
  },

  update: async (id, scriptData) => {
    const response = await api.patch(`/scripts/${id}`, scriptData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/scripts/${id}`);
    return response.data;
  },

  importFromUrl: async (url) => {
    const response = await api.post('/import-url', { url });
    return response.data;
  }
};
