import { User, Role, Permission, UserSession, PasswordResetToken, LoginAttempt, ApplicationSetting } from '../models';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, hashRefreshToken } from '../utils/auth';
import { LoggerService } from './LoggerService';
import { runSeeds } from '../database/seed';
import { Op } from 'sequelize';
import { Request } from 'express';

export class AuthService {
  public static async isSetupRequired(): Promise<boolean> {
    const userCount = await User.count();
    return userCount === 0;
  }

  public static async firstTimeSetup(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    companyName: string;
    productName: string;
    req?: Request;
  }) {
    const alreadySetup = !(await AuthService.isSetupRequired());
    if (alreadySetup) {
      throw new Error('First-time setup has already been completed. Action not allowed.');
    }

    // Run database seeds to populate roles, permissions, role_permissions
    await runSeeds();

    // Find SUPER_ADMIN role
    const superAdminRole = await Role.findOne({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
      throw new Error('SUPER_ADMIN role creation failed during setup');
    }

    // Hash password securely
    const hashedPassword = await hashPassword(data.password);

    // Create the first admin user
    const adminUser = await User.create({
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      password_hash: hashedPassword,
      status: 'ACTIVE',
      failed_login_attempts: 0,
      email_verified_at: new Date(),
    });

    // Assign SUPER_ADMIN role
    await adminUser.addRole(superAdminRole);

    // Store Company and Product settings
    if (data.companyName) {
      await ApplicationSetting.upsert({
        setting_key: 'COMPANY_NAME',
        setting_value: data.companyName,
        category: 'COMPANY',
      });
    }
    if (data.productName) {
      await ApplicationSetting.upsert({
        setting_key: 'PRODUCT_NAME',
        setting_value: data.productName,
        category: 'PRODUCT',
      });
    }

    // Log setup activity
    await LoggerService.logActivity({
      userId: adminUser.id,
      action: 'FIRST_TIME_SETUP',
      module: 'Setup',
      description: `First-time application setup completed by initial administrator ${adminUser.username}`,
      req: data.req,
    });

    return {
      message: 'First-time setup completed successfully. Please log in with your new administrator credentials.',
    };
  }

  public static async login(
    loginId: string,
    password: string,
    req: Request
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const ipAddress = LoggerService.getIpAddress(req);
    const userAgent = LoggerService.getUserAgent(req);

    // Find user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: loginId }, { username: loginId }],
      },
      include: [
        {
          model: Role,
          as: 'Roles',
          include: [{ model: Permission, as: 'Permissions' }],
        },
      ],
    });

    if (!user || user.deleted_at) {
      await LoginAttempt.create({
        username_or_email: loginId,
        ip_address: ipAddress,
        is_success: false,
        failure_reason: 'User not found or deleted',
      });
      throw new Error('Invalid email/username or password');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      await LoginAttempt.create({
        username_or_email: loginId,
        ip_address: ipAddress,
        is_success: false,
        failure_reason: 'Account suspended',
      });
      throw new Error('Your account has been suspended. Please contact system administrator.');
    }

    if (user.status === 'PENDING') {
      throw new Error('Your account is pending activation.');
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      throw new Error(`Account is temporarily locked. Please try again in ${lockMinutes} minute(s).`);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      const failedAttempts = user.failed_login_attempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await user.update({
        failed_login_attempts: failedAttempts,
        locked_until: lockedUntil,
        status: lockedUntil ? 'LOCKED' : user.status,
      });

      await LoginAttempt.create({
        username_or_email: loginId,
        ip_address: ipAddress,
        is_success: false,
        failure_reason: lockedUntil ? 'Account locked due to 5 failed attempts' : 'Invalid password',
      });

      throw new Error(
        lockedUntil
          ? 'Account locked due to repeated failed login attempts. Please try again after 15 minutes.'
          : 'Invalid email/username or password'
      );
    }

    // Reset failed attempts on success
    await user.update({
      failed_login_attempts: 0,
      locked_until: null,
      status: user.status === 'LOCKED' ? 'ACTIVE' : user.status,
      last_login_at: new Date(),
      last_login_ip: ipAddress,
    });

    // Record login attempt success
    await LoginAttempt.create({
      username_or_email: loginId,
      ip_address: ipAddress,
      is_success: true,
    });

    // Extract roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    if (user.Roles) {
      for (const r of user.Roles) {
        roles.push(r.code);
        if (r.Permissions) {
          for (const p of r.Permissions) {
            permissionsSet.add(p.code);
          }
        }
      }
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
    };

    const accessToken = generateAccessToken(tokenPayload);
    const { token: refreshToken, hash: refreshHash } = generateRefreshToken(user.id);

    // Save refresh token session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await UserSession.create({
      user_id: user.id,
      refresh_token_hash: refreshHash,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
      is_revoked: false,
    });

    // Log activity
    await LoggerService.logActivity({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      module: 'Auth',
      description: `User ${user.username} logged in successfully`,
      req,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.last_login_at,
        roles,
        permissions: Array.from(permissionsSet),
      },
    };
  }

  public static async refreshToken(refreshToken: string) {
    const hash = hashRefreshToken(refreshToken);
    const session = await UserSession.findOne({
      where: { refresh_token_hash: hash, is_revoked: false },
      include: [
        {
          model: User,
          include: [
            {
              model: Role,
              as: 'Roles',
              include: [{ model: Permission, as: 'Permissions' }],
            },
          ],
        },
      ],
    });

    if (!session || new Date(session.expires_at) < new Date()) {
      throw new Error('Invalid or expired refresh token session');
    }

    const user: any = session.get('User');
    if (!user || user.status !== 'ACTIVE' || user.deleted_at) {
      throw new Error('User account is no longer active');
    }

    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    if (user.Roles) {
      for (const r of user.Roles) {
        roles.push(r.code);
        if (r.Permissions) {
          for (const p of r.Permissions) {
            permissionsSet.add(p.code);
          }
        }
      }
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    return { accessToken: newAccessToken };
  }

  public static async logout(refreshToken: string | undefined, userId?: number, req?: Request) {
    if (refreshToken) {
      const hash = hashRefreshToken(refreshToken);
      await UserSession.update({ is_revoked: true }, { where: { refresh_token_hash: hash } });
    }

    if (userId) {
      await LoggerService.logActivity({
        userId,
        action: 'LOGOUT',
        module: 'Auth',
        description: 'User logged out',
        req,
      });
    }
  }

  public static async revokeAllSessions(userId: number, req?: Request) {
    await UserSession.update({ is_revoked: true }, { where: { user_id: userId } });
    await LoggerService.logActivity({
      userId,
      action: 'REVOKE_ALL_SESSIONS',
      module: 'Auth',
      description: 'Revoked all active sessions for user',
      req,
    });
  }
}
