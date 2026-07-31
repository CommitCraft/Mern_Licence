import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DashboardService } from '../services/DashboardService';

export class AdminDashboardController {
  public static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

      const data = await DashboardService.getDashboardMetrics(req.user.permissions, req.user.roles);
      return res.json({ success: true, ...data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
