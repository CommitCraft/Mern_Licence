import { Router } from 'express';
import { LicenceClientController } from '../controllers/LicenceClientController';
import rateLimit from 'express-rate-limit';

const router = Router();

const clientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many activation/validation requests' },
});

router.post('/licences/activate', clientLimiter, LicenceClientController.activate);
router.post('/licences/validate', clientLimiter, LicenceClientController.validate);
router.post('/licences/deactivate', clientLimiter, LicenceClientController.deactivate);

export default router;
