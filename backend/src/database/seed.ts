import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'licence_system',
};

async function getMysqlConnection() {
  const configsToTry = [
    { ...dbConfig },
    { ...dbConfig, user: 'root', password: '' },
    { ...dbConfig, user: 'root', password: 'root' },
  ];

  let lastError: any = null;
  for (const cfg of configsToTry) {
    try {
      const conn = await mysql.createConnection(cfg);
      return conn;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export const DEFAULT_PERMISSIONS = [
  // Dashboard Module
  { module: 'Dashboard', name: 'View Dashboard', code: 'VIEW_DASHBOARD', description: 'Can view the main executive dashboard and analytics' },
  
  // User Management Module
  { module: 'Users', name: 'View Users', code: 'VIEW_USERS', description: 'Can view administrative user list and profiles' },
  { module: 'Users', name: 'Create User', code: 'CREATE_USER', description: 'Can create new administrative user accounts' },
  { module: 'Users', name: 'Update User', code: 'UPDATE_USER', description: 'Can edit existing administrative user account details' },
  { module: 'Users', name: 'Delete User', code: 'DELETE_USER', description: 'Can soft delete user accounts' },
  { module: 'Users', name: 'Reset User Password', code: 'RESET_USER_PASSWORD', description: 'Can trigger password reset for users' },
  { module: 'Users', name: 'Manage User Status', code: 'MANAGE_USER_STATUS', description: 'Can activate, suspend, lock, or unlock user accounts' },
  
  // Role & Permission Management Module
  { module: 'Roles', name: 'View Roles', code: 'VIEW_ROLES', description: 'Can view list of system and custom roles' },
  { module: 'Roles', name: 'Create Role', code: 'CREATE_ROLE', description: 'Can create custom roles' },
  { module: 'Roles', name: 'Update Role', code: 'UPDATE_ROLE', description: 'Can edit custom role details and names' },
  { module: 'Roles', name: 'Delete Role', code: 'DELETE_ROLE', description: 'Can delete custom roles' },
  { module: 'Roles', name: 'Assign Permissions', code: 'ASSIGN_PERMISSIONS', description: 'Can assign or revoke permissions for roles' },
  
  // Customer Management Module
  { module: 'Customers', name: 'View Customers', code: 'VIEW_CUSTOMERS', description: 'Can view customer directory and profiles' },
  { module: 'Customers', name: 'Create Customer', code: 'CREATE_CUSTOMER', description: 'Can add new customers to the system' },
  { module: 'Customers', name: 'Update Customer', code: 'UPDATE_CUSTOMER', description: 'Can edit customer details and contacts' },
  { module: 'Customers', name: 'Delete Customer', code: 'DELETE_CUSTOMER', description: 'Can soft delete customer records' },
  
  // Licence Management Module
  { module: 'Licences', name: 'View Licences', code: 'VIEW_LICENCES', description: 'Can view licence inventory and details' },
  { module: 'Licences', name: 'Create Licence', code: 'CREATE_LICENCE', description: 'Can generate new software licences' },
  { module: 'Licences', name: 'Update Licence', code: 'UPDATE_LICENCE', description: 'Can update licence properties' },
  { module: 'Licences', name: 'Suspend Licence', code: 'SUSPEND_LICENCE', description: 'Can temporarily suspend active licences' },
  { module: 'Licences', name: 'Revoke Licence', code: 'REVOKE_LICENCE', description: 'Can permanently revoke software licences' },
  { module: 'Licences', name: 'Extend Licence', code: 'EXTEND_LICENCE', description: 'Can extend licence expiration dates' },
  
  // Activation Management Module
  { module: 'Activations', name: 'View Activations', code: 'VIEW_ACTIVATIONS', description: 'Can view device activation records' },
  { module: 'Activations', name: 'Deactivate Installation', code: 'DEACTIVATE_INSTALLATION', description: 'Can remote deactivate device installations' },
  
  // Audit Logs Module
  { module: 'Audit Logs', name: 'View Audit Logs', code: 'VIEW_AUDIT_LOGS', description: 'Can inspect system audit logs and activity histories' },
  
  // Settings Module
  { module: 'Settings', name: 'Manage Settings', code: 'MANAGE_SETTINGS', description: 'Can view and modify application settings' },
];

export const DEFAULT_ROLES = [
  {
    name: 'Super Administrator',
    code: 'SUPER_ADMIN',
    description: 'Full system access and administrator management',
    is_system_role: 1,
    permissions: DEFAULT_PERMISSIONS.map((p) => p.code),
  },
  {
    name: 'Licence Administrator',
    code: 'LICENCE_ADMIN',
    description: 'Manage customers, licences, and view activations',
    is_system_role: 1,
    permissions: [
      'VIEW_DASHBOARD',
      'VIEW_CUSTOMERS',
      'CREATE_CUSTOMER',
      'UPDATE_CUSTOMER',
      'DELETE_CUSTOMER',
      'VIEW_LICENCES',
      'CREATE_LICENCE',
      'UPDATE_LICENCE',
      'SUSPEND_LICENCE',
      'REVOKE_LICENCE',
      'EXTEND_LICENCE',
      'VIEW_ACTIVATIONS',
    ],
  },
  {
    name: 'Support Administrator',
    code: 'SUPPORT_ADMIN',
    description: 'View licences, activations, deactivate installations, and view logs',
    is_system_role: 1,
    permissions: [
      'VIEW_DASHBOARD',
      'VIEW_LICENCES',
      'VIEW_ACTIVATIONS',
      'DEACTIVATE_INSTALLATION',
      'VIEW_AUDIT_LOGS',
    ],
  },
  {
    name: 'Viewer',
    code: 'VIEWER',
    description: 'Read-only access across system resources',
    is_system_role: 1,
    permissions: [
      'VIEW_DASHBOARD',
      'VIEW_USERS',
      'VIEW_ROLES',
      'VIEW_CUSTOMERS',
      'VIEW_LICENCES',
      'VIEW_ACTIVATIONS',
      'VIEW_AUDIT_LOGS',
    ],
  },
];

export async function runSeeds() {
  const connection = await getMysqlConnection();

  try {
    console.log('Seeding default permissions...');
    const permissionIdMap: Record<string, number> = {};

    for (const perm of DEFAULT_PERMISSIONS) {
      await connection.query(
        `INSERT INTO permissions (module, name, code, description)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), module = VALUES(module)`,
        [perm.module, perm.name, perm.code, perm.description]
      );

      const [rows]: any = await connection.query('SELECT id FROM permissions WHERE code = ?', [perm.code]);
      if (rows && rows.length > 0) {
        permissionIdMap[perm.code] = rows[0].id;
      }
    }

    console.log('Seeding default roles...');
    const roleIdMap: Record<string, number> = {};

    for (const roleDef of DEFAULT_ROLES) {
      await connection.query(
        `INSERT INTO roles (name, code, description, is_system_role, status)
         VALUES (?, ?, ?, ?, 'ACTIVE')
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_system_role = VALUES(is_system_role)`,
        [roleDef.name, roleDef.code, roleDef.description, roleDef.is_system_role]
      );

      const [roleRows]: any = await connection.query('SELECT id FROM roles WHERE code = ?', [roleDef.code]);
      if (roleRows && roleRows.length > 0) {
        const roleId = roleRows[0].id;
        roleIdMap[roleDef.code] = roleId;

        for (const pCode of roleDef.permissions) {
          const permId = permissionIdMap[pCode];
          if (permId) {
            await connection.query(
              `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
              [roleId, permId]
            );
          }
        }
      }
    }

    console.log('Seeding application default settings...');
    const defaultSettings = [
      { setting_key: 'COMPANY_NAME', setting_value: 'Aplos Logix', category: 'COMPANY' },
      { setting_key: 'PRODUCT_NAME', setting_value: 'Enterprise Licence Management System', category: 'PRODUCT' },
      { setting_key: 'PRODUCT_CODE', setting_value: 'EMS', category: 'PRODUCT' },
      { setting_key: 'PASSWORD_MIN_LENGTH', setting_value: '8', category: 'SECURITY' },
      { setting_key: 'PASSWORD_REQUIRE_UPPERCASE', setting_value: 'true', category: 'SECURITY' },
      { setting_key: 'PASSWORD_REQUIRE_NUMBERS', setting_value: 'true', category: 'SECURITY' },
      { setting_key: 'PASSWORD_REQUIRE_SYMBOLS', setting_value: 'true', category: 'SECURITY' },
      { setting_key: 'MAX_FAILED_LOGIN_ATTEMPTS', setting_value: '5', category: 'SECURITY' },
      { setting_key: 'ACCOUNT_LOCKOUT_MINUTES', setting_value: '15', category: 'SECURITY' },
    ];

    for (const setting of defaultSettings) {
      await connection.query(
        `INSERT INTO application_settings (setting_key, setting_value, category)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), category = VALUES(category)`,
        [setting.setting_key, setting.setting_value, setting.category]
      );
    }

    // ------------------------------------------------------------------
    // Seed Default SuperAdmin Account for Demo & Integration
    // ------------------------------------------------------------------
    const superAdminName = process.env.SUPERADMIN_FULL_NAME || 'Super Admin';
    const superAdminUsername = process.env.SUPERADMIN_USERNAME || 'admin';
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@aploslogix.com';
    const superAdminPlainPassword = process.env.SUPERADMIN_PASSWORD || 'AdminPassword123!';

    console.log(`Seeding SuperAdmin user (${superAdminUsername} / ${superAdminEmail})...`);
    const passwordHash = await bcrypt.hash(superAdminPlainPassword, 10);

    await connection.query(
      `INSERT INTO users (full_name, username, email, password_hash, status, failed_login_attempts, email_verified_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', 0, NOW())
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), status = 'ACTIVE'`,
      [superAdminName, superAdminUsername, superAdminEmail, passwordHash]
    );

    const [userRows]: any = await connection.query('SELECT id FROM users WHERE username = ?', [superAdminUsername]);
    if (userRows && userRows.length > 0) {
      const superAdminUserId = userRows[0].id;
      const superAdminRoleId = roleIdMap['SUPER_ADMIN'];
      if (superAdminRoleId) {
        await connection.query(
          `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
          [superAdminUserId, superAdminRoleId]
        );
      }
    }

    // ------------------------------------------------------------------
    // Seed Default Software Products
    // ------------------------------------------------------------------
    console.log('Seeding default software products...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) NOT NULL UNIQUE,
        product_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const defaultProducts = [
      { code: 'EMS', name: 'Enterprise Management Suite', desc: 'Complete ERP & Business Management Application' },
      { code: 'POS', name: 'Point of Sale Retail Pro', desc: 'Retail & Inventory Billing Application' },
      { code: 'ERP', name: 'Enterprise Resource Planning', desc: 'Financial, Supply Chain, and Resource Suite' },
      { code: 'CRM', name: 'Customer Relationship Manager', desc: 'Sales Leads & Customer Portal System' },
      { code: 'HMS', name: 'Hospital Management System', desc: 'Healthcare & Clinical Records Management' },
      { code: 'SMS', name: 'School & Campus Management System', desc: 'Educational Campus & Student Information System' },
      { code: 'IMS', name: 'Inventory & Warehouse Pro', desc: 'Real-Time Stock & Multi-Warehouse Tracking' },
      { code: 'LMS', name: 'Licence Management Server', desc: 'Automated Software Activation & Licence Server' },
    ];

    for (const prod of defaultProducts) {
      await connection.query(
        `INSERT INTO products (product_code, product_name, description, status, created_at, updated_at)
         VALUES (?, ?, ?, 'ACTIVE', NOW(), NOW())
         ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), description = VALUES(description)`,
        [prod.code, prod.name, prod.desc]
      );
    }


    // ------------------------------------------------------------------
    // Seed Demo Customer & Licence for Demo Integration
    // ------------------------------------------------------------------
    console.log('Seeding demo customer and demo licence...');

    await connection.query(
      `INSERT INTO customers (customer_code, customer_name, company_name, email, phone, city, country, status)
       VALUES ('CUST-ACME-001', 'Acme Support', 'Acme Corporation', 'contact@acme.com', '+1-555-0199', 'New York', 'USA', 'ACTIVE')
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), email = VALUES(email)`,
    );

    const [custRows]: any = await connection.query("SELECT id FROM customers WHERE customer_code = 'CUST-ACME-001'");
    if (custRows && custRows.length > 0) {
      const custId = custRows[0].id;
      const rawKey = 'EMS-PRO-DEMO-2026-KEY';
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      await connection.query(
        `INSERT INTO licences (customer_id, licence_code_hash, licence_reference, product_code, licence_type, max_activations, offline_grace_days, max_users, max_machines, issued_at, expires_at, status)
         VALUES (?, ?, 'EMS-PRO-DEMO-2026', 'EMS', 'ENTERPRISE', 5, 14, 25, 10, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'ACTIVE')
         ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
        [custId, keyHash]
      );
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
