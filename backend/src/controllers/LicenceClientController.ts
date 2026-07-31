import { Request, Response } from 'express';
import { ActivationService } from '../services/ActivationService';

export class LicenceClientController {
  public static async activate(req: Request, res: Response) {
    try {
      const { licenceKey, installationId, fingerprintHash, productCode, appVersion, hostname, operatingSystem } =
        req.body;

      if (!licenceKey || !installationId || !fingerprintHash || !productCode) {
        return res.status(400).json({
          success: false,
          message: 'licenceKey, installationId, fingerprintHash, and productCode are required',
        });
      }

      const result = await ActivationService.activateSoftware(
        { licenceKey, installationId, fingerprintHash, productCode, appVersion, hostname, operatingSystem },
        req
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async validate(req: Request, res: Response) {
    try {
      const { licenceReference, installationId, fingerprintHash } = req.body;

      if (!licenceReference || !installationId || !fingerprintHash) {
        return res.status(400).json({
          success: false,
          message: 'licenceReference, installationId, and fingerprintHash are required',
        });
      }

      const result = await ActivationService.validateSoftware(
        { licenceReference, installationId, fingerprintHash },
        req
      );

      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async deactivate(req: Request, res: Response) {
    try {
      const { activationId } = req.body;
      if (!activationId) {
        return res.status(400).json({ success: false, message: 'activationId is required' });
      }

      const result = await ActivationService.deactivateInstallation(parseInt(activationId), undefined, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
