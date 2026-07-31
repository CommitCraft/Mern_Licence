export type LicenceStatusCode =
  | "LICENCE_VALID"
  | "LICENCE_REQUIRED"
  | "LICENCE_EXPIRED"
  | "LICENCE_SUSPENDED"
  | "LICENCE_REVOKED"
  | "INVALID_SIGNATURE"
  | "INSTALLATION_MISMATCH"
  | "FINGERPRINT_MISMATCH"
  | "ONLINE_VALIDATION_REQUIRED"
  | "CLOCK_ROLLBACK_DETECTED";

export interface LicenceFeatures {
  machineManagement?: boolean;
  preventiveMaintenance?: boolean;
  energyMonitoring?: boolean;
  maxUsers?: number;
  maxMachines?: number;
  [key: string]: boolean | number | string | undefined;
}

export interface LicenceDetails {
  licenceReference: string;
  licenceType: string;
  companyName: string;
  customerName: string;
  productCode: string;
  issuedAt: string;
  expiresAt: string | null;
  nextValidationAt: string;
  graceEndsAt: string;
  installationId?: string;
}

export interface LicenceStatusResponse {
  valid: boolean;
  code: LicenceStatusCode;
  message: string;
  features?: LicenceFeatures;
  licence?: LicenceDetails;
}

export interface ActivateLicenceRequest {
  licenceKey: string;
}

export interface AdminLicenceItem {
  id: number;
  licence_reference: string;
  customer_name: string;
  customer_email: string;
  company_name: string;
  product_code: string;
  licence_type: string;
  max_activations: number;
  features: LicenceFeatures;
  issued_at: string;
  expires_at: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  created_at: string;
}

export interface AdminActivationItem {
  id: number;
  licence_id: number;
  installation_id: string;
  fingerprint_hash: string;
  hostname: string;
  operating_system: string;
  app_version: string;
  activated_at: string;
  last_validated_at: string;
  status: 'ACTIVE' | 'DEACTIVATED' | 'BLOCKED';
}

export interface AdminAuditItem {
  id: number;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}
