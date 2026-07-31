import axios from 'axios';
import { PublicRuntimeConfig, SetupStatusData } from './runtimeConfig.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

export const runtimeConfigApi = {
  async getSetupStatus(): Promise<SetupStatusData> {
    try {
      const response = await api.get('/setup/status');
      return response.data?.data || { setupRequired: false, currentStep: 'completed' };
    } catch {
      return { setupRequired: false, currentStep: 'completed' };
    }
  },

  async getPublicConfig(): Promise<PublicRuntimeConfig> {
    try {
      const response = await api.get('/public-config');
      return response.data?.data || {
        appName: 'EMS',
        appUrl: 'https://ems-pro.aploslogix.com',
        companyName: 'ABC Manufacturing Pvt Ltd',
        companyCode: 'ABC',
        logoUrl: '/assets/logo.png',
        timezone: 'Asia/Kolkata',
        productCode: 'EMS',
        licenceEnabled: true
      };
    } catch {
      return {
        appName: 'EMS',
        appUrl: 'https://ems-pro.aploslogix.com',
        companyName: 'ABC Manufacturing Pvt Ltd',
        companyCode: 'ABC',
        logoUrl: '/assets/logo.png',
        timezone: 'Asia/Kolkata',
        productCode: 'EMS',
        licenceEnabled: true
      };
    }
  }
};
