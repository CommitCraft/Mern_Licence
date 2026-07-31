import { Product } from './src/models';
import { sequelize } from './src/config/database';

async function syncProducts() {
  await sequelize.authenticate();
  console.log('Database connected.');

  // Create products table
  await Product.sync({ alter: true });
  console.log('Products table synchronized.');

  // Seed initial products if empty
  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate([
      {
        product_code: 'EMS',
        product_name: 'Enterprise Management Suite',
        description: 'Complete ERP & Business Management Application',
        status: 'ACTIVE',
      },
      {
        product_code: 'POS',
        product_name: 'Point of Sale Retail Pro',
        description: 'Retail & Inventory Billing Application',
        status: 'ACTIVE',
      },
      {
        product_code: 'CRM',
        product_name: 'Customer Relationship Manager',
        description: 'Sales Leads & Customer Portal System',
        status: 'ACTIVE',
      },
    ]);
    console.log('Default products seeded.');
  }

  const products = await Product.findAll();
  console.log('Current Products:', products.map((p) => ({ id: p.id, code: p.product_code, name: p.product_name })));
  process.exit(0);
}

syncProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
