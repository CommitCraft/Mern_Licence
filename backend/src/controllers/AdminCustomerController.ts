import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CustomerService } from '../services/CustomerService';

export class AdminCustomerController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const customers = await CustomerService.getAllCustomers();
      return res.json({ success: true, customers });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const customer = await CustomerService.getCustomerById(id);
      return res.json({ success: true, customer });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerName, companyName, email, phone, address, city, state, country, contactPerson, notes } = req.body;
      if (!customerName || !companyName || !email) {
        return res.status(400).json({ success: false, message: 'Customer name, company name, and email are required' });
      }

      const customer = await CustomerService.createCustomer(
        { customerName, companyName, email, phone, address, city, state, country, contactPerson, notes },
        req.user?.userId,
        req
      );
      return res.status(201).json({ success: true, customer });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const customer = await CustomerService.updateCustomer(id, req.body, req.user?.userId, req);
      return res.json({ success: true, customer });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await CustomerService.deleteCustomer(id, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
