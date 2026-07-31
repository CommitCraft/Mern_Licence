import { User, Role, Permission, UserSession } from '../models';
import { hashPassword } from '../utils/auth';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class UserService {
  public static async getAllUsers() {
    const users = await User.findAll({
      where: { deleted_at: null },
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'Roles',
          attributes: ['id', 'name', 'code', 'is_system_role'],
          through: { attributes: [] },
        },
      ],
      order: [['created_at', 'DESC']],
    });
    return users;
  }

  public static async getUserById(id: number) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'Roles',
          attributes: ['id', 'name', 'code', 'is_system_role'],
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'Permissions',
              attributes: ['id', 'name', 'code', 'module'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user || user.deleted_at) {
      throw new Error('User not found');
    }

    return user;
  }

  public static async createUser(
    data: {
      fullName: string;
      username: string;
      email: string;
      phone?: string;
      roleId: number;
      password?: string;
      status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    },
    creatorId?: number,
    req?: Request
  ) {
    // Unique email and username checks
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await User.findOne({ where: { username: data.username } });
    if (existingUsername) {
      throw new Error('User with this username already exists');
    }

    const role = await Role.findByPk(data.roleId);
    if (!role) {
      throw new Error('Selected role does not exist');
    }

    const initialPassword = data.password || 'TempPassword123!';
    const passwordHash = await hashPassword(initialPassword);

    const newUser = await User.create({
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone || null,
      password_hash: passwordHash,
      status: data.status || 'ACTIVE',
      created_by: creatorId || null,
    });

    await newUser.addRole(role);

    await LoggerService.logActivity({
      userId: creatorId,
      action: 'CREATE_USER',
      module: 'Users',
      entityType: 'User',
      entityId: newUser.id,
      description: `Created user ${newUser.username} with role ${role.code}`,
      newValues: { username: newUser.username, email: newUser.email, role: role.code },
      req,
    });

    return UserService.getUserById(newUser.id);
  }

  public static async updateUser(
    id: number,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      roleId?: number;
      status?: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'PENDING';
    },
    updaterId?: number,
    req?: Request
  ) {
    const user = await User.findByPk(id);
    if (!user || user.deleted_at) {
      throw new Error('User not found');
    }

    const previousValues = {
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    };

    if (data.email && data.email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: data.email } });
      if (existingEmail) throw new Error('Email is already taken by another user');
      user.email = data.email;
    }

    if (data.fullName) user.full_name = data.fullName;
    if (data.phone !== undefined) user.phone = data.phone || null;
    if (data.status) user.status = data.status;
    user.updated_by = updaterId || null;

    await user.save();

    if (data.roleId) {
      const role = await Role.findByPk(data.roleId);
      if (!role) throw new Error('Selected role does not exist');
      await user.setRoles([role]);
    }

    await LoggerService.logActivity({
      userId: updaterId,
      action: 'UPDATE_USER',
      module: 'Users',
      entityType: 'User',
      entityId: user.id,
      description: `Updated profile details for user ${user.username}`,
      previousValues,
      newValues: data,
      req,
    });

    return UserService.getUserById(id);
  }

  public static async updateUserStatus(
    id: number,
    status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED',
    updaterId?: number,
    req?: Request
  ) {
    const user = await User.findByPk(id);
    if (!user || user.deleted_at) throw new Error('User not found');

    const previousStatus = user.status;
    user.status = status;
    if (status === 'ACTIVE') {
      user.failed_login_attempts = 0;
      user.locked_until = null;
    }
    user.updated_by = updaterId || null;
    await user.save();

    await LoggerService.logActivity({
      userId: updaterId,
      action: 'MANAGE_USER_STATUS',
      module: 'Users',
      entityType: 'User',
      entityId: user.id,
      description: `Changed status of user ${user.username} from ${previousStatus} to ${status}`,
      previousValues: { status: previousStatus },
      newValues: { status },
      req,
    });

    return { message: `User status updated to ${status}` };
  }

  public static async resetUserPassword(id: number, newPassword?: string, actorId?: number, req?: Request) {
    const user = await User.findByPk(id);
    if (!user || user.deleted_at) throw new Error('User not found');

    const tempPassword = newPassword || 'ResetPassword123!';
    const passwordHash = await hashPassword(tempPassword);

    user.password_hash = passwordHash;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    await user.save();

    // Revoke active sessions for security
    await UserSession.update({ is_revoked: true }, { where: { user_id: id } });

    await LoggerService.logActivity({
      userId: actorId,
      action: 'RESET_USER_PASSWORD',
      module: 'Users',
      entityType: 'User',
      entityId: user.id,
      description: `Reset password for user ${user.username}`,
      req,
    });

    return { message: 'Password reset successfully', temporaryPassword: tempPassword };
  }

  public static async softDeleteUser(id: number, actorId?: number, req?: Request) {
    const user = await User.findByPk(id);
    if (!user || user.deleted_at) throw new Error('User not found');

    user.deleted_at = new Date();
    await user.save();

    // Revoke all sessions
    await UserSession.update({ is_revoked: true }, { where: { user_id: id } });

    await LoggerService.logActivity({
      userId: actorId,
      action: 'DELETE_USER',
      module: 'Users',
      entityType: 'User',
      entityId: id,
      description: `Soft deleted user account ${user.username}`,
      req,
    });

    return { message: 'User account soft deleted successfully' };
  }
}
