import axios from 'axios';
import { LicenceStatusResponse, AdminLicenceItem } from '../types/licence.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000,
});

export const licenceApi = {
  /**
   * Fetch current local licence status
   */
  async getLicenceStatus(): Promise<LicenceStatusResponse> {
    try {
      const response = await api.get<LicenceStatusResponse>('/licence/status');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return error.response.data as LicenceStatusResponse;
      }
      return {
        valid: false,
        code: 'LICENCE_REQUIRED',
        message: 'Failed to communicate with local licence service.'
      };
    }
  },

  /**
   * Submit licence key for activation
   */
  async activateLicence(licenceKey: string): Promise<{ success: boolean; message: string; licence?: LicenceStatusResponse }> {
    try {
      const response = await api.post('/licence/activate', { licenceKey });
      return {
        success: true,
        message: response.data.message || 'Licence activated successfully.',
        licence: response.data.licence
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const errData = error.response.data;
        return {
          success: false,
          message: errData.error?.message || errData.message || 'Activation failed.'
        };
      }
      return {
        success: false,
        message: 'Network error occurred during activation.'
      };
    }
  },

  /**
   * Trigger immediate online validation
   */
  async validateLicence(): Promise<{ success: boolean; message: string; licence?: LicenceStatusResponse }> {
    try {
      const response = await api.post('/licence/validate');
      return {
        success: true,
        message: response.data.message || 'Online validation completed.',
        licence: response.data.licence
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const errData = error.response.data;
        return {
          success: false,
          message: errData.error?.message || 'Online validation failed.'
        };
      }
      return {
        success: false,
        message: 'Network error during validation.'
      };
    }
  },

  /**
   * Deactivate licence for server migration
   */
  async deactivateLicence(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/licence/deactivate');
      return {
        success: true,
        message: response.data.message || 'Licence deactivated.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Deactivation failed.'
      };
    }
  },

  // --- Admin API Methods ---
  async getAdminLicences(): Promise<AdminLicenceItem[]> {
    const response = await api.get('/admin/licences');
    return response.data.licences || [];
  },

  async createAdminLicence(payload: Record<string, unknown>): Promise<{ success: boolean; message: string; licence?: Record<string, unknown> }> {
    try {
      const response = await api.post('/admin/licences', payload);
      return {
        success: true,
        message: response.data.message,
        licence: response.data.licence
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: error.response.data.error?.message || 'Failed to create licence.'
        };
      }
      return { success: false, message: 'Server error creating licence.' };
    }
  },

  async updateAdminLicenceStatus(id: number, action: 'activate' | 'suspend' | 'revoke'): Promise<boolean> {
    try {
      await api.patch(`/admin/licences/${id}/${action}`);
      return true;
    } catch {
      return false;
    }
  }
};
