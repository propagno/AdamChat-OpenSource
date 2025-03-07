import axios from 'axios';
import { getToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configuração base do Axios
const patientApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para adicionar o token de autenticação em cada requisição
patientApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Serviços de pacientes
export const patientsService = {
  // Criar novo paciente
  createPatient: async (patientData) => {
    try {
      const response = await patientApi.post('/patients', patientData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      throw error;
    }
  },

  // Buscar paciente por ID
  getPatientById: async (patientId) => {
    try {
      const response = await patientApi.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar paciente ${patientId}:`, error);
      throw error;
    }
  },

  // Buscar paciente por CPF
  getPatientByCpf: async (cpf) => {
    try {
      const response = await patientApi.get(`/patients/cpf/${cpf}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar paciente com CPF ${cpf}:`, error);
      throw error;
    }
  },

  // Adicionar prontuário a um paciente
  addProntuario: async (patientId, prontuarioData) => {
    try {
      const response = await patientApi.post(`/patients/${patientId}/prontuarios`, prontuarioData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar prontuário ao paciente ${patientId}:`, error);
      throw error;
    }
  },

  // Obter histórico de prontuários de um paciente
  getPatientHistory: async (patientId) => {
    try {
      const response = await patientApi.get(`/patients/${patientId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar histórico do paciente ${patientId}:`, error);
      throw error;
    }
  },

  // Upload de ficha médica
  uploadMedicalFile: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Adiciona opções adicionais ao FormData
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await patientApi.post('/upload-ficha', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload da ficha médica:', error);
      throw error;
    }
  }
}; 