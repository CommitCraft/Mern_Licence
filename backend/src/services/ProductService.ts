import { Product } from '../models';

export class ProductService {
  public static async getAllProducts() {
    return await Product.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  public static async getProductById(id: number) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  public static async createProduct(data: {
    productCode: string;
    productName: string;
    description?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) {
    const existing = await Product.findOne({
      where: { product_code: data.productCode.toUpperCase() },
    });
    if (existing) {
      throw new Error(`Product code '${data.productCode}' already exists`);
    }

    return await Product.create({
      product_code: data.productCode.toUpperCase(),
      product_name: data.productName,
      description: data.description || null,
      status: data.status || 'ACTIVE',
    });
  }

  public static async updateProduct(
    id: number,
    data: {
      productName?: string;
      description?: string;
      status?: 'ACTIVE' | 'INACTIVE';
    }
  ) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');

    if (data.productName !== undefined) product.product_name = data.productName;
    if (data.description !== undefined) product.description = data.description;
    if (data.status !== undefined) product.status = data.status;

    await product.save();
    return product;
  }

  public static async deleteProduct(id: number) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Product not found');
    await product.destroy();
    return true;
  }
}
