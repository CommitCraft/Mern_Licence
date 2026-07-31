import { ActivityLog, LicenceAuditLog } from '../models';
import { Request } from 'express';

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'confirm_password',
  'access_token',
  'refresh_token',
  'private_key',
  'secret',
  'licenceKey',
];

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class LoggerService {
  public static getIpAddress(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || null;
  }

  public static getUserAgent(req?: Request): string | null {
    if (!req) return null;
    return req.headers['user-agent'] || null;
  }

  public static async logActivity(params: {
    userId?: number | null;
    action: string;
    module: string;
    entityType?: string;
    entityId?: string | number;
    description: string;
    previousValues?: object | null;
    newValues?: object | null;
    req?: Request;
  }) {
    try {
      await ActivityLog.create({
        user_id: params.userId || null,
        action: params.action,
        module: params.module,
        entity_type: params.entityType || null,
        entity_id: params.entityId ? String(params.entityId) : null,
        description: params.description,
        previous_values: sanitizeObject(params.previousValues),
        new_values: sanitizeObject(params.newValues),
        ip_address: LoggerService.getIpAddress(params.req),
        user_agent: LoggerService.getUserAgent(params.req),
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  }

  public static async logLicenceAudit(params: {
    licenceId?: number | null;
    activationId?: number | null;
    userId?: number | null;
    action: string;
    description: string;
    metadata?: object | null;
    req?: Request;
  }) {
    try {
      await LicenceAuditLog.create({
        licence_id: params.licenceId || null,
        activation_id: params.activationId || null,
        user_id: params.userId || null,
        action: params.action,
        description: params.description,
        ip_address: LoggerService.getIpAddress(params.req),
        metadata: sanitizeObject(params.metadata),
      });
    } catch (err) {
      console.error('Failed to log licence audit:', err);
    }
  }
}
