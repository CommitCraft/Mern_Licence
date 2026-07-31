import { runMigrations } from '../database/migrate';
import { runSeeds } from '../database/seed';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { RoleService } from '../services/RoleService';
import { CustomerService } from '../services/CustomerService';
import { LicenceService } from '../services/LicenceService';
import { ActivationService } from '../services/ActivationService';
import { hashSha256, verifyCertificateSignature } from '../utils/crypto';

async function executeTests() {
  console.log('=== STARTING BACKEND AUTOMATED TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Database Migrations
    console.log('1. Testing Database Migrations & Seeds...');
    await runMigrations(false);
    await runSeeds();
    assert(true, 'Database migrations and seeds executed without error');

    // 2. Test Cryptographic Helpers
    console.log('\n2. Testing Cryptography & Signing...');
    const hash = hashSha256('test-string');
    assert(hash.length === 64, 'SHA-256 hash output is 64 hex characters');

    const mockCertPayload = { licenceReference: 'LIC-TEST-123', status: 'ACTIVE' };
    const { signCertificateData } = require('../utils/crypto');
    const signed = signCertificateData(mockCertPayload);
    assert(!!signed.signature, 'Ed25519 signature generated successfully');
    const isValidSig = verifyCertificateSignature(mockCertPayload, signed.signature);
    assert(isValidSig === true, 'Ed25519 signature verified successfully');

    // 3. Test Setup and Roles
    console.log('\n3. Testing System Setup & Default Roles...');
    const roles = await RoleService.getAllRoles();
    const superAdminRole = roles.find((r) => r.code === 'SUPER_ADMIN');
    assert(!!superAdminRole, 'SUPER_ADMIN role exists in database');
    assert(roles.length >= 4, 'All 4 default roles exist');

    const permissions = await RoleService.getAllPermissions();
    assert(permissions.all.length >= 20, 'Default permissions seeded successfully');

    // 4. Test Customer & Licence Creation
    console.log('\n4. Testing Customer & Licence Management...');
    const customer = await CustomerService.createCustomer({
      customerName: 'Test Contact',
      companyName: 'Acme Test Corp',
      email: 'acme@example.com',
    });
    assert(customer.company_name === 'Acme Test Corp', 'Customer created successfully');

    const licenceResult = await LicenceService.createLicence({
      customerId: customer.id,
      productCode: 'EMS',
      licenceType: 'ANNUAL',
      maxActivations: 2,
    });
    assert(!!licenceResult.rawLicenceKey, 'Raw licence key returned on creation');
    assert(licenceResult.rawLicenceKey.startsWith('EMS-PRO-'), 'Licence key matches format EMS-PRO-XXXX-XXXX-XXXX-XXXX');
    assert(licenceResult.licence.licence_code_hash !== licenceResult.rawLicenceKey, 'Licence key stored as SHA-256 hash in database');

    // 5. Test Software Activation
    console.log('\n5. Testing Software Activation & Device Binding...');
    const reqMock: any = { headers: {}, socket: { remoteAddress: '127.0.0.1' } };
    const activationResult = await ActivationService.activateSoftware(
      {
        licenceKey: licenceResult.rawLicenceKey,
        installationId: 'INST-HW-9999',
        fingerprintHash: hashSha256('HW-FINGERPRINT-DATA'),
        productCode: 'EMS',
        hostname: 'test-workstation',
      },
      reqMock
    );
    assert(activationResult.success === true, 'Software activation succeeded');
    assert(!!activationResult.signature, 'Returned Ed25519 signed certificate signature');

    console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  executeTests();
}
