import { Op } from 'sequelize';
import { Licence, Customer, LicenceActivation, LicenceAuditLog, User } from '../models';
import { generateRandomLicenceKey, generateLicenceReference, hashSha256 } from '../utils/crypto';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class LicenceService {
  public static async autoExpireLicences(): Promise<number> {
    const [affectedCount] = await Licence.update(
      { status: 'EXPIRED' },
      {
        where: {
          status: 'ACTIVE',
          expires_at: {
            [Op.ne]: null,
            [Op.lt]: new Date(),
          },
          deleted_at: null,
        },
      }
    );
    return affectedCount;
  }

  public static async getAllLicences(statusFilter?: string) {
    await LicenceService.autoExpireLicences();

    const whereClause: any = { deleted_at: null };
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const licences = await Licence.findAll({
      where: whereClause,
      include: [
        { model: Customer, attributes: ['id', 'customer_code', 'customer_name', 'company_name', 'email'] },
        { model: LicenceActivation, attributes: ['id', 'installation_id', 'status', 'activated_at'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return licences;
  }

  public static async getLicenceById(id: number) {
    const licence = await Licence.findByPk(id, {
      include: [
        { model: Customer },
        { model: LicenceActivation },
        {
          model: LicenceAuditLog,
          include: [{ model: User, attributes: ['id', 'full_name', 'username'] }],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!licence || licence.deleted_at) {
      throw new Error('Licence not found');
    }

    return licence;
  }

  public static async createLicence(
    data: {
      customerId: number;
      productCode: string;
      licenceType: 'TRIAL' | 'ANNUAL' | 'LIFETIME' | 'ENTERPRISE';
      issuedAt?: string;
      expiresAt?: string;
      maxActivations?: number;
      offlineGraceDays?: number;
      enabledFeatures?: string[];
      maxUsers?: number;
      maxMachines?: number;
      notes?: string;
    },
    creatorId?: number,
    req?: Request
  ) {
    const customer = await Customer.findByPk(data.customerId);
    if (!customer || customer.deleted_at) {
      throw new Error('Associated customer not found');
    }

    const rawLicenceKey = generateRandomLicenceKey();
    const keyHash = hashSha256(rawLicenceKey);
    const reference = generateLicenceReference();

    const issuedAt = data.issuedAt ? new Date(data.issuedAt) : new Date();
    let expiresAt: Date | null = null;
    if (data.licenceType === 'TRIAL') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
    }

    const licence = await Licence.create({
      customer_id: customer.id,
      licence_code_hash: keyHash,
      licence_reference: reference,
      product_code: data.productCode || 'EMS',
      licence_type: data.licenceType || 'ANNUAL',
      max_activations: data.maxActivations || 1,
      offline_grace_days: data.offlineGraceDays || 7,
      enabled_features: data.enabledFeatures || ['CORE_MODULE'],
      max_users: data.maxUsers || 10,
      max_machines: data.maxMachines || 5,
      notes: data.notes || null,
      issued_at: issuedAt,
      expires_at: expiresAt,
      status: 'ACTIVE',
      created_by: creatorId || null,
    });

    await LoggerService.logLicenceAudit({
      licenceId: licence.id,
      userId: creatorId,
      action: 'CREATE_LICENCE',
      description: `Generated software licence ${reference} for customer ${customer.company_name}`,
      metadata: { licenceReference: reference, productCode: licence.product_code, maxActivations: licence.max_activations },
      req,
    });

    await LoggerService.logActivity({
      userId: creatorId,
      action: 'CREATE_LICENCE',
      module: 'Licences',
      entityType: 'Licence',
      entityId: licence.id,
      description: `Created licence ${reference}`,
      req,
    });

    return {
      licence: await LicenceService.getLicenceById(licence.id),
      rawLicenceKey, // Readable key returned ONCE
      warning: 'CRITICAL SECURITY WARNING: Copy and save this licence key immediately. It will NEVER be shown again.',
    };
  }

  public static async updateLicence(
    id: number,
    data: {
      productCode?: string;
      licenceType?: string;
      expiresAt?: string;
      maxActivations?: number;
      offlineGraceDays?: number;
      enabledFeatures?: string[];
      maxUsers?: number;
      maxMachines?: number;
      notes?: string;
    },
    updaterId?: number,
    req?: Request
  ) {
    const licence = await Licence.findByPk(id);
    if (!licence || licence.deleted_at) throw new Error('Licence not found');

    if (data.productCode !== undefined) licence.product_code = data.productCode;
    if (data.licenceType !== undefined) licence.licence_type = data.licenceType as any;
    if (data.expiresAt !== undefined) {
      licence.expires_at = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.maxActivations !== undefined) licence.max_activations = data.maxActivations;
    if (data.offlineGraceDays !== undefined) licence.offline_grace_days = data.offlineGraceDays;
    if (data.enabledFeatures) licence.enabled_features = data.enabledFeatures;
    if (data.maxUsers !== undefined) licence.max_users = data.maxUsers;
    if (data.maxMachines !== undefined) licence.max_machines = data.maxMachines;
    if (data.notes !== undefined) licence.notes = data.notes;
    licence.updated_by = updaterId || null;

    await licence.save();

    await LoggerService.logLicenceAudit({
      licenceId: licence.id,
      userId: updaterId,
      action: 'UPDATE_LICENCE',
      description: `Updated configuration for licence ${licence.licence_reference}`,
      req,
    });

    return LicenceService.getLicenceById(id);
  }


  public static async extendLicence(id: number, newExpiresAt: string, actorId?: number, req?: Request) {
    const licence = await Licence.findByPk(id);
    if (!licence || licence.deleted_at) throw new Error('Licence not found');

    const previousExpiry = licence.expires_at;
    licence.expires_at = new Date(newExpiresAt);
    if (licence.status === 'EXPIRED') {
      licence.status = 'ACTIVE';
    }
    licence.updated_by = actorId || null;
    await licence.save();

    await LoggerService.logLicenceAudit({
      licenceId: licence.id,
      userId: actorId,
      action: 'EXTEND_LICENCE',
      description: `Extended expiration date of licence ${licence.licence_reference} to ${newExpiresAt}`,
      metadata: { previousExpiry, newExpiry: newExpiresAt },
      req,
    });

    return LicenceService.getLicenceById(id);
  }

  public static async setLicenceStatus(
    id: number,
    status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED',
    actorId?: number,
    req?: Request
  ) {
    const licence = await Licence.findByPk(id);
    if (!licence || licence.deleted_at) throw new Error('Licence not found');

    const previousStatus = licence.status;
    licence.status = status;
    licence.updated_by = actorId || null;
    await licence.save();

    await LoggerService.logLicenceAudit({
      licenceId: licence.id,
      userId: actorId,
      action: status === 'SUSPENDED' ? 'SUSPEND_LICENCE' : status === 'REVOKED' ? 'REVOKE_LICENCE' : 'REACTIVATE_LICENCE',
      description: `Changed status of licence ${licence.licence_reference} from ${previousStatus} to ${status}`,
      metadata: { previousStatus, newStatus: status },
      req,
    });

    return LicenceService.getLicenceById(id);
  }
}
