import { LicenceService } from './src/services/LicenceService';
import { Customer } from './src/models';
import { sequelize } from './src/config/database';

async function main() {
  await sequelize.authenticate();
  const customer = await Customer.findOne();
  if (!customer) {
    console.error('No customer found in database');
    process.exit(1);
  }

  const result = await LicenceService.createLicence({
    customerId: customer.id,
    productCode: 'EMS',
    licenceType: 'ENTERPRISE',
    maxActivations: 10,
    offlineGraceDays: 14,
    maxUsers: 50,
    maxMachines: 20,
    notes: 'Generated 27-character Enterprise Licence Key for Demo',
  });

  console.log('=== NEW 27-CHARACTER LICENCE KEY GENERATED ===');
  console.log('Raw Licence Key:', result.rawLicenceKey);
  console.log('Key Length:', result.rawLicenceKey.length);
  console.log('Licence Reference:', result.licence.licence_reference);
  console.log('Customer:', customer.company_name);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
