import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ActivationService } from '../services/ActivationService';

export class AdminActivationController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const statusFilter = req.query.status as string;
      const activations = await ActivationService.getAllActivations(statusFilter);
      return res.json({ success: true, activations });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async deactivate(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await ActivationService.deactivateInstallation(id, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
