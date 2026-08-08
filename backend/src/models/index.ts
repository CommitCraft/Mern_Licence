import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// ----------------------------------------------------------------------
// 1. Role Model
// ----------------------------------------------------------------------
export interface RoleAttributes {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_system_role: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'description' | 'is_system_role' | 'status'>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare public id: number;
  declare public name: string;
  declare public code: string;
  declare public description: string | null;
  declare public is_system_role: boolean;
  declare public status: 'ACTIVE' | 'INACTIVE';
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public deleted_at: Date | null;

  declare public Permissions?: Permission[];
  declare public setPermissions: (permissions: Permission[]) => Promise<void>;
  declare public getPermissions: () => Promise<Permission[]>;
}

Role.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_system_role: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'roles', paranoid: true }
);

// ----------------------------------------------------------------------
// 2. Permission Model
// ----------------------------------------------------------------------
export interface PermissionAttributes {
  id: number;
  module: string;
  name: string;
  code: string;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type PermissionCreationAttributes = Optional<PermissionAttributes, 'id' | 'description'>;

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare public id: number;
  declare public module: string;
  declare public name: string;
  declare public code: string;
  declare public description: string | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}

Permission.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    module: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'permissions', timestamps: true, paranoid: false }
);

// Role <-> Permission Junction
export class RolePermission extends Model {}
RolePermission.init(
  {
    role_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
    permission_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
  },
  { sequelize, tableName: 'role_permissions', timestamps: false }
);

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });

// ----------------------------------------------------------------------
// 3. User Model
// ----------------------------------------------------------------------
export interface UserAttributes {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  password_hash: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING';
  failed_login_attempts: number;
  locked_until?: Date | null;
  last_login_at?: Date | null;
  last_login_ip?: string | null;
  email_verified_at?: Date | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  | 'id'
  | 'phone'
  | 'status'
  | 'failed_login_attempts'
  | 'locked_until'
  | 'last_login_at'
  | 'last_login_ip'
  | 'email_verified_at'
  | 'created_by'
  | 'updated_by'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare public id: number;
  declare public full_name: string;
  declare public username: string;
  declare public email: string;
  declare public phone: string | null;
  declare public password_hash: string;
  declare public status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING';
  declare public failed_login_attempts: number;
  declare public locked_until: Date | null;
  declare public last_login_at: Date | null;
  declare public last_login_ip: string | null;
  declare public email_verified_at: Date | null;
  declare public created_by: number | null;
  declare public updated_by: number | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public deleted_at: Date | null;

  declare public Roles?: Role[];
  declare public addRole: (role: Role) => Promise<void>;
  declare public setRoles: (roles: Role[]) => Promise<void>;
}

User.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING'), defaultValue: 'ACTIVE' },
    failed_login_attempts: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
    email_verified_at: { type: DataTypes.DATE, allowNull: true },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  { sequelize, tableName: 'users', paranoid: true }
);

// User <-> Role Junction
export class UserRole extends Model {}
UserRole.init(
  {
    user_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
    role_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
  },
  { sequelize, tableName: 'user_roles', timestamps: false }
);

User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

// ----------------------------------------------------------------------
// 4. UserSession Model
// ----------------------------------------------------------------------
export class UserSession extends Model {
  declare public id: number;
  declare public user_id: number;
  declare public refresh_token_hash: string;
  declare public user_agent: string | null;
  declare public ip_address: string | null;
  declare public expires_at: Date;
  declare public is_revoked: boolean;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}
UserSession.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    refresh_token_hash: { type: DataTypes.STRING(64), allowNull: false },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'user_sessions' }
);
UserSession.belongsTo(User, { foreignKey: 'user_id' });

// ----------------------------------------------------------------------
// 5. PasswordResetToken Model
// ----------------------------------------------------------------------
export class PasswordResetToken extends Model {
  declare public id: number;
  declare public user_id: number;
  declare public token_hash: string;
  declare public expires_at: Date;
  declare public used_at: Date | null;
  declare public readonly created_at: Date;
}
PasswordResetToken.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    token_hash: { type: DataTypes.STRING(64), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'password_reset_tokens', updatedAt: false }
);

// ----------------------------------------------------------------------
// 6. LoginAttempt Model
// ----------------------------------------------------------------------
export class LoginAttempt extends Model {
  declare public id: number;
  declare public username_or_email: string;
  declare public ip_address: string | null;
  declare public is_success: boolean;
  declare public failure_reason: string | null;
  declare public readonly created_at: Date;
}
LoginAttempt.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    username_or_email: { type: DataTypes.STRING(255), allowNull: false },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    is_success: { type: DataTypes.BOOLEAN, allowNull: false },
    failure_reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'login_attempts', updatedAt: false }
);

// ----------------------------------------------------------------------
// 7. ActivityLog Model
// ----------------------------------------------------------------------
export class ActivityLog extends Model {
  declare public id: number;
  declare public user_id: number | null;
  declare public action: string;
  declare public module: string;
  declare public entity_type: string | null;
  declare public entity_id: string | null;
  declare public description: string | null;
  declare public previous_values: object | null;
  declare public new_values: object | null;
  declare public ip_address: string | null;
  declare public user_agent: string | null;
  declare public readonly created_at: Date;
}
ActivityLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    entity_type: { type: DataTypes.STRING(100), allowNull: true },
    entity_id: { type: DataTypes.STRING(100), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    previous_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
  },
  { sequelize, tableName: 'activity_logs', updatedAt: false }
);
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// ----------------------------------------------------------------------
// 8. ApplicationSetting Model
// ----------------------------------------------------------------------
export class ApplicationSetting extends Model {
  declare public id: number;
  declare public setting_key: string;
  declare public setting_value: string | null;
  declare public category: string;
  declare public is_encrypted: boolean;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
}
ApplicationSetting.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    setting_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    setting_value: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(50), defaultValue: 'GENERAL' },
    is_encrypted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'application_settings' }
);

// ----------------------------------------------------------------------
// 9. Customer Model
// ----------------------------------------------------------------------
export class Customer extends Model {
  declare public id: number;
  declare public customer_code: string;
  declare public customer_name: string;
  declare public company_name: string;
  declare public email: string;
  declare public phone: string | null;
  declare public address: string | null;
  declare public city: string | null;
  declare public state: string | null;
  declare public country: string | null;
  declare public contact_person: string | null;
  declare public status: 'ACTIVE' | 'INACTIVE';
  declare public notes: string | null;
  declare public created_by: number | null;
  declare public updated_by: number | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public deleted_at: Date | null;
}
Customer.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    customer_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    customer_name: { type: DataTypes.STRING(255), allowNull: false },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    country: { type: DataTypes.STRING(100), allowNull: true },
    contact_person: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  { sequelize, tableName: 'customers', paranoid: true }
);

// ----------------------------------------------------------------------
// 10. Licence Model
// ----------------------------------------------------------------------
export class Licence extends Model {
  declare public id: number;
  declare public customer_id: number;
  declare public licence_key: string | null;
  declare public licence_code_hash: string;
  declare public licence_reference: string;
  declare public product_code: string;
  declare public licence_type: 'TRIAL' | 'ANNUAL' | 'LIFETIME' | 'ENTERPRISE';
  declare public max_activations: number;
  declare public offline_grace_days: number;
  declare public enabled_features: any;
  declare public max_users: number;
  declare public max_machines: number;
  declare public notes: string | null;
  declare public issued_at: Date;
  declare public expires_at: Date | null;
  declare public status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED';
  declare public created_by: number | null;
  declare public updated_by: number | null;
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public deleted_at: Date | null;

  declare public Customer?: Customer;
  declare public LicenceActivations?: LicenceActivation[];
  declare public LicenceAuditLogs?: LicenceAuditLog[];
}
Licence.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    customer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    licence_key: { type: DataTypes.STRING(255), allowNull: true },
    licence_code_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    licence_reference: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    product_code: { type: DataTypes.STRING(50), allowNull: false },
    licence_type: { type: DataTypes.ENUM('TRIAL', 'ANNUAL', 'LIFETIME', 'ENTERPRISE'), defaultValue: 'ANNUAL' },
    max_activations: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 1 },
    offline_grace_days: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 7 },
    enabled_features: { type: DataTypes.JSON, allowNull: true },
    max_users: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 10 },
    max_machines: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 5 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    issued_at: { type: DataTypes.DATE, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'), defaultValue: 'ACTIVE' },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  },
  { sequelize, tableName: 'licences', paranoid: true }
);

Licence.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Licence, { foreignKey: 'customer_id' });

// ----------------------------------------------------------------------
// 11. LicenceActivation Model
// ----------------------------------------------------------------------
export class LicenceActivation extends Model {
  declare public id: number;
  declare public licence_id: number;
  declare public installation_id: string;
  declare public fingerprint_hash: string;
  declare public hostname: string | null;
  declare public operating_system: string | null;
  declare public app_version: string | null;
  declare public ip_address: string | null;
  declare public activated_at: Date;
  declare public last_validated_at: Date;
  declare public deactivated_at: Date | null;
  declare public status: 'ACTIVE' | 'DEACTIVATED' | 'BLOCKED';
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;

  declare public Licence?: Licence;
}
LicenceActivation.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    licence_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    installation_id: { type: DataTypes.STRING(64), allowNull: false },
    fingerprint_hash: { type: DataTypes.STRING(64), allowNull: false },
    hostname: { type: DataTypes.STRING(255), allowNull: true },
    operating_system: { type: DataTypes.STRING(100), allowNull: true },
    app_version: { type: DataTypes.STRING(50), allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    activated_at: { type: DataTypes.DATE, allowNull: false },
    last_validated_at: { type: DataTypes.DATE, allowNull: false },
    deactivated_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('ACTIVE', 'DEACTIVATED', 'BLOCKED'), defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'licence_activations' }
);

LicenceActivation.belongsTo(Licence, { foreignKey: 'licence_id' });
Licence.hasMany(LicenceActivation, { foreignKey: 'licence_id' });

// ----------------------------------------------------------------------
// 12. LicenceAuditLog Model
// ----------------------------------------------------------------------
export class LicenceAuditLog extends Model {
  declare public id: number;
  declare public licence_id: number | null;
  declare public activation_id: number | null;
  declare public user_id: number | null;
  declare public action: string;
  declare public description: string | null;
  declare public ip_address: string | null;
  declare public metadata: any;
  declare public readonly created_at: Date;
}
LicenceAuditLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    licence_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    activation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    action: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
  },
  { sequelize, tableName: 'licence_audit_logs', updatedAt: false }
);

LicenceAuditLog.belongsTo(Licence, { foreignKey: 'licence_id' });
Licence.hasMany(LicenceAuditLog, { foreignKey: 'licence_id' });
LicenceAuditLog.belongsTo(LicenceActivation, { foreignKey: 'activation_id' });
LicenceAuditLog.belongsTo(User, { foreignKey: 'user_id' });

// ----------------------------------------------------------------------
// 13. Product Model
// ----------------------------------------------------------------------
export class Product extends Model {
  declare public id: number;
  declare public product_code: string;
  declare public product_name: string;
  declare public description: string | null;
  declare public status: 'ACTIVE' | 'INACTIVE';
  declare public readonly created_at: Date;
  declare public readonly updated_at: Date;
  declare public deleted_at: Date | null;
}
Product.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    product_name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  },
  { sequelize, tableName: 'products', paranoid: true, underscored: true }

);

