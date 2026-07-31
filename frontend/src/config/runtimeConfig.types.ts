export interface PublicRuntimeConfig {
  appName: string;
  appUrl: string;
  companyName: string;
  companyCode: string;
  logoUrl: string;
  timezone: string;
  productCode: string;
  licenceEnabled: boolean;
}

export interface SetupStatusData {
  setupRequired: boolean;
  currentStep: string;
}
