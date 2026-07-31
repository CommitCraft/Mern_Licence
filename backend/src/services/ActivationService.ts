import { Licence, LicenceActivation, Customer } from '../models';
import { hashSha256, signCertificateData } from '../utils/crypto';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class ActivationService {
  public static async activateSoftware(
    params: {
      licenceKey: string;
      installationId: string;
      fingerprintHash: string;
      productCode: string;
      appVersion?: string;
      hostname?: string;
      operatingSystem?: string;
    },
    req: Request
  ) {
    const keyHash = hashSha256(params.licenceKey.trim());
    const ipAddress = LoggerService.getIpAddress(req);

    // 1. Find licence
    const licence = await Licence.findOne({
      where: { licence_code_hash: keyHash, deleted_at: null },
      include: [{ model: Customer }],
    });

    if (!licence) {
      throw new Error('Invalid licence key provided');
    }

    // 2. Check product code match
    if (licence.product_code !== params.productCode) {
      throw new Error(`Licence key is invalid for product '${params.productCode}'`);
    }

    // 3. Check licence status
    if (licence.status === 'SUSPENDED') {
      throw new Error('This licence has been suspended. Please contact customer support.');
    }
    if (licence.status === 'REVOKED') {
      throw new Error('This licence has been permanently revoked.');
    }

    // 4. Check expiration date
    if (licence.expires_at && new Date(licence.expires_at) < new Date()) {
      licence.status = 'EXPIRED';
      await licence.save();
      throw new Error('This software licence has expired.');
    }

    // 5. Check existing activation for this installation ID
    let activation = await LicenceActivation.findOne({
      where: { licence_id: licence.id, installation_id: params.installationId },
    });

    if (!activation) {
      // Check activation limit
      const currentActiveCount = await LicenceActivation.count({
        where: { licence_id: licence.id, status: 'ACTIVE' },
      });

      if (currentActiveCount >= licence.max_activations) {
        throw new Error(
          `Activation limit reached (${currentActiveCount}/${licence.max_activations}). Please deactivate an existing installation or upgrade your licence.`
        );
      }

      // Create new activation record
      activation = await LicenceActivation.create({
        licence_id: licence.id,
        installation_id: params.installationId,
        fingerprint_hash: params.fingerprintHash,
        hostname: params.hostname || null,
        operating_system: params.operatingSystem || null,
        app_version: params.appVersion || null,
        ip_address: ipAddress,
        activated_at: new Date(),
        last_validated_at: new Date(),
        status: 'ACTIVE',
      });
    } else {
      if (activation.status === 'BLOCKED') {
        throw new Error('This installation hardware has been blocked by system administrator');
      }

      // Re-activate if previously deactivated
      activation.status = 'ACTIVE';
      activation.fingerprint_hash = params.fingerprintHash;
      activation.hostname = params.hostname || activation.hostname;
      activation.operating_system = params.operatingSystem || activation.operating_system;
      activation.app_version = params.appVersion || activation.app_version;
      activation.ip_address = ipAddress;
      activation.last_validated_at = new Date();
      activation.deactivated_at = null;
      await activation.save();
    }

    // 6. Generate signed certificate payload
    const certificatePayload = {
      licenceReference: licence.licence_reference,
      productCode: licence.product_code,
      installationId: activation.installation_id,
      fingerprintHash: activation.fingerprint_hash,
      licenceType: licence.licence_type,
      maxUsers: licence.max_users,
      maxMachines: licence.max_machines,
      offlineGraceDays: licence.offline_grace_days,
      features: licence.enabled_features,
      status: 'ACTIVE',
      issuedAt: licence.issued_at,
      expiresAt: licence.expires_at,
      validatedAt: new Date().toISOString(),
    };

    const signedCert = signCertificateData(certificatePayload);

    // 7. Audit log
    await LoggerService.logLicenceAudit({
      licenceId: licence.id,
      activationId: activation.id,
      action: 'ACTIVATION_SUCCESS',
      description: `Activated licence ${licence.licence_reference} on machine ${params.hostname || params.installationId}`,
      metadata: { installationId: params.installationId, ipAddress },
      req,
    });

    return {
      success: true,
      message: 'Software activated successfully',
      licenceReference: licence.licence_reference,
      certificate: signedCert.certificate,
      signature: signedCert.signature,
    };
  }

  public static async validateSoftware(
    params: {
      licenceReference: string;
      installationId: string;
      fingerprintHash: string;
    },
    req: Request
  ) {
    const ipAddress = LoggerService.getIpAddress(req);

    const licence = await Licence.findOne({
      where: { licence_reference: params.licenceReference, deleted_at: null },
    });

    if (!licence) {
      throw new Error('Licence record not found');
    }

    if (licence.status !== 'ACTIVE') {
      throw new Error(`Licence status is ${licence.status.toLowerCase()}`);
    }

    if (licence.expires_at && new Date(licence.expires_at) < new Date()) {
      licence.status = 'EXPIRED';
      await licence.save();
      throw new Error('Licence has expired');
    }

    const activation = await LicenceActivation.findOne({
      where: { licence_id: licence.id, installation_id: params.installationId },
    });

    if (!activation || activation.status !== 'ACTIVE') {
      throw new Error('Installation activation is not active or has been revoked');
    }

    if (activation.fingerprint_hash !== params.fingerprintHash) {
      throw new Error('Hardware fingerprint mismatch detected');
    }

    activation.last_validated_at = new Date();
    activation.ip_address = ipAddress;
    await activation.save();

    const certificatePayload = {
      licenceReference: licence.licence_reference,
      productCode: licence.product_code,
      installationId: activation.installation_id,
      fingerprintHash: activation.fingerprint_hash,
      licenceType: licence.licence_type,
      maxUsers: licence.max_users,
      maxMachines: licence.max_machines,
      offlineGraceDays: licence.offline_grace_days,
      features: licence.enabled_features,
      status: 'ACTIVE',
      issuedAt: licence.issued_at,
      expiresAt: licence.expires_at,
      validatedAt: new Date().toISOString(),
    };

    const signedCert = signCertificateData(certificatePayload);

    return {
      valid: true,
      certificate: signedCert.certificate,
      signature: signedCert.signature,
    };
  }

  public static async deactivateInstallation(id: number, actorId?: number, req?: Request) {
    const activation = await LicenceActivation.findByPk(id, { include: [{ model: Licence }] });
    if (!activation) throw new Error('Activation record not found');

    activation.status = 'DEACTIVATED';
    activation.deactivated_at = new Date();
    await activation.save();

    await LoggerService.logLicenceAudit({
      licenceId: activation.licence_id,
      activationId: activation.id,
      userId: actorId,
      action: 'DEACTIVATE_INSTALLATION',
      description: `Deactivated installation ${activation.installation_id}`,
      req,
    });

    return { message: 'Installation deactivated successfully' };
  }

  public static async getAllActivations(statusFilter?: string) {
    const where: any = {};
    if (statusFilter) where.status = statusFilter;

    return LicenceActivation.findAll({
      where,
      include: [
        {
          model: Licence,
          include: [{ model: Customer, attributes: ['company_name', 'email'] }],
        },
      ],
      order: [['last_validated_at', 'DESC']],
    });
  }
}
