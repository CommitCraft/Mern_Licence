import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { LicenceService } from '../services/LicenceService';

export class AdminLicenceController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const statusFilter = req.query.status as string;
      const licences = await LicenceService.getAllLicences(statusFilter);
      return res.json({ success: true, licences });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const licence = await LicenceService.getLicenceById(id);
      return res.json({ success: true, licence });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        customerId,
        productCode,
        licenceType,
        issuedAt,
        expiresAt,
        maxActivations,
        offlineGraceDays,
        enabledFeatures,
        maxUsers,
        maxMachines,
        notes,
      } = req.body;

      if (!customerId || !licenceType) {
        return res.status(400).json({ success: false, message: 'Customer ID and licence type are required' });
      }

      const result = await LicenceService.createLicence(
        {
          customerId: parseInt(customerId),
          productCode: productCode || 'EMS',
          licenceType,
          issuedAt,
          expiresAt,
          maxActivations: maxActivations ? parseInt(maxActivations) : 1,
          offlineGraceDays: offlineGraceDays ? parseInt(offlineGraceDays) : 7,
          enabledFeatures,
          maxUsers: maxUsers ? parseInt(maxUsers) : 10,
          maxMachines: maxMachines ? parseInt(maxMachines) : 5,
          notes,
        },
        req.user?.userId,
        req
      );

      return res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const licence = await LicenceService.updateLicence(id, req.body, req.user?.userId, req);
      return res.json({ success: true, licence });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async extend(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { newExpiresAt } = req.body;
      if (!newExpiresAt) {
        return res.status(400).json({ success: false, message: 'New expiration date is required' });
      }

      const licence = await LicenceService.extendLicence(id, newExpiresAt, req.user?.userId, req);
      return res.json({ success: true, licence });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async setStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED', 'REVOKED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status specified' });
      }

      const licence = await LicenceService.setLicenceStatus(id, status, req.user?.userId, req);
      return res.json({ success: true, licence });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
