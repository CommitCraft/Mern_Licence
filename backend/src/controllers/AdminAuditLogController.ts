import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ActivityLog, LicenceAuditLog, User, Licence } from '../models';

export class AdminAuditLogController {
  public static async getActivityLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const moduleFilter = req.query.module as string;
      const where: any = {};
      if (moduleFilter) where.module = moduleFilter;

      const logs = await ActivityLog.findAll({
        where,
        include: [{ model: User, attributes: ['id', 'full_name', 'username', 'email'] }],
        order: [['created_at', 'DESC']],
        limit: 200,
      });

      return res.json({ success: true, logs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getLicenceAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const logs = await LicenceAuditLog.findAll({
        include: [
          { model: User, attributes: ['id', 'full_name', 'username'] },
          { model: Licence, attributes: ['id', 'licence_reference', 'product_code'] },
        ],
        order: [['created_at', 'DESC']],
        limit: 200,
      });

      return res.json({ success: true, logs });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
