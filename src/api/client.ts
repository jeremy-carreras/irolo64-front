import axios from 'axios';
import { LoginRequest, LoginResponse } from '../types';

const API_TARGET = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: API_TARGET,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/auth/login', data),
};

export const departmentsAPI = {
  getAll: () => client.get('/departments'),
  getAllWithReadings: () => client.get('/departments/with-readings/all'),
  getById: (id: string) => client.get(`/departments/${id}`),
  create: (data: any) => client.post('/departments', data),
  update: (id: string, data: any) =>
    client.patch(`/departments/${id}`, data),
  delete: (id: string) => client.delete(`/departments/${id}`),
};

export const waterReadingsAPI = {
  getByDepartment: (departmentId: string) =>
    client.get(`/departments/${departmentId}/water-readings`),
  create: (departmentId: string, data: any) =>
    client.post(`/departments/${departmentId}/water-readings`, data),
  getAll: () => client.get('/water-readings/all'),
  getByDate: (date: string) => client.get(`/water-readings/by-date/${date}`),
  getById: (id: string) => client.get(`/water-readings/${id}`),
  update: (id: string, data: any) =>
    client.patch(`/water-readings/${id}`, data),
  delete: (id: string) => client.delete(`/water-readings/${id}`),
};

export const receiptsAPI = {
  getAll: () => client.get('/receipts'),
  getById: (id: string) => client.get(`/receipts/${id}`),
  create: (data: any) => client.post('/receipts', data),
  update: (id: string, data: any) =>
    client.patch(`/receipts/${id}`, data),
  delete: (id: string) => client.delete(`/receipts/${id}`),
};

export default client;
