export type SetupStepId =
  | 'welcome'
  | 'requirements'
  | 'token'
  | 'database'
  | 'application'
  | 'company'
  | 'licence'
  | 'administrator'
  | 'review'
  | 'installing'
  | 'completed';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ApplicationConfig {
  name: string;
  url: string;
  environment: 'production' | 'development' | 'staging';
  timezone: string;
}

export interface CompanyConfig {
  name: string;
  code: string;
  email: string;
}

export interface LicenceSetupConfig {
  serverUrl: string;
  productCode: string;
  validationIntervalHours: number;
  offlineGraceDays: number;
}

export interface AdministratorConfig {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CompleteSetupPayload {
  database: DatabaseConfig;
  application: ApplicationConfig;
  company: CompanyConfig;
  licence: LicenceSetupConfig;
  administrator: AdministratorConfig;
}
