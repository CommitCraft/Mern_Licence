import { ProductService } from './src/services/ProductService';
import { sequelize } from './src/config/database';

async function testCreateProduct() {
  await sequelize.authenticate();
  console.log('Database connected.');

  const testCode = 'TEST' + Math.floor(Math.random() * 1000);
  const result = await ProductService.createProduct({
    productCode: testCode,
    productName: 'Test Product ' + testCode,
    description: 'Testing product creation',
    status: 'ACTIVE',
  });

  console.log('Product created successfully:', {
    id: result.id,
    code: result.product_code,
    name: result.product_name,
  });

  await ProductService.deleteProduct(result.id);
  console.log('Test product cleaned up.');
  process.exit(0);
}

testCreateProduct().catch((err) => {
  console.error('FAILED TO CREATE PRODUCT:', err);
  process.exit(1);
});
