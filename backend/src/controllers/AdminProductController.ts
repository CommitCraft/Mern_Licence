import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProductService } from '../services/ProductService';

export class AdminProductController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const products = await ProductService.getAllProducts();
      return res.json({ success: true, products });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { productCode, productName, description, status } = req.body;
      if (!productCode || !productName) {
        return res.status(400).json({ success: false, message: 'Product code and product name are required' });
      }

      const product = await ProductService.createProduct({
        productCode,
        productName,
        description,
        status,
      });

      return res.status(201).json({ success: true, product });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await ProductService.updateProduct(id, req.body);
      return res.json({ success: true, product });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await ProductService.deleteProduct(id);
      return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
