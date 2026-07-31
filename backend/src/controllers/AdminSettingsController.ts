import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { SettingsService } from '../services/SettingsService';

export class AdminSettingsController {
  public static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await SettingsService.getAllSettings();
      return res.json({ success: true, ...settings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: 'Settings object is required' });
      }

      const updated = await SettingsService.updateSettings(settings, req.user?.userId, req);
      return res.json({ success: true, ...updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
