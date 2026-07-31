import axios from 'axios';
import { CompleteSetupPayload, DatabaseConfig } from '../types/setup.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  withCredentials: true
});

export const setupApi = {
  async verifyToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/setup/verify-token', { token });
      return { success: true, message: response.data.message || 'Token verified.' };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: error.response.data.error?.message || 'Invalid installer token.'
        };
      }
      return { success: false, message: 'Network error verifying installer token.' };
    }
  },

  async testDatabase(db: DatabaseConfig): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/setup/test-database', db);
      return { success: true, message: response.data.message || 'Database connected successfully.' };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: error.response.data.error?.message || 'Database connection test failed.'
        };
      }
      return { success: false, message: 'Could not connect to database server.' };
    }
  },

  async testLicenceServer(serverUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/setup/test-licence-server', { serverUrl });
      return { success: true, message: response.data.message || 'Licence server reachable.' };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: error.response.data.error?.message || 'Licence server connection failed.'
        };
      }
      return { success: false, message: 'Unable to reach licence server.' };
    }
  },

  async executeInstallation(payload: CompleteSetupPayload): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/setup/install', payload);
      return { success: true, message: response.data.message || 'Installation completed successfully.' };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: error.response.data.error?.message || 'Installation execution failed.'
        };
      }
      return { success: false, message: 'Server error during installation.' };
    }
  }
};
