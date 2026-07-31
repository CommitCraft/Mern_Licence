import { Role, Permission } from '../models';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class RoleService {
  public static async getAllRoles() {
    const roles = await Role.findAll({
      where: { deleted_at: null },
      include: [
        {
          model: Permission,
          as: 'Permissions',
          attributes: ['id', 'name', 'code', 'module', 'description'],
          through: { attributes: [] },
        },
      ],
      order: [['id', 'ASC']],
    });
    return roles;
  }

  public static async getRoleById(id: number) {
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'Permissions',
          attributes: ['id', 'name', 'code', 'module', 'description'],
          through: { attributes: [] },
        },
      ],
    });

    if (!role || role.deleted_at) {
      throw new Error('Role not found');
    }

    return role;
  }

  public static async createRole(
    data: { name: string; code: string; description?: string; permissionIds?: number[] },
    actorId?: number,
    req?: Request
  ) {
    const codeUpper = data.code.trim().toUpperCase();
    const existing = await Role.findOne({ where: { code: codeUpper } });
    if (existing) {
      throw new Error(`Role with code '${codeUpper}' already exists`);
    }

    const role = await Role.create({
      name: data.name,
      code: codeUpper,
      description: data.description || null,
      is_system_role: false,
      status: 'ACTIVE',
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await Permission.findAll({ where: { id: data.permissionIds } });
      await role.setPermissions(permissions);
    }

    await LoggerService.logActivity({
      userId: actorId,
      action: 'CREATE_ROLE',
      module: 'Roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Created custom role ${role.name} (${role.code})`,
      req,
    });

    return RoleService.getRoleById(role.id);
  }

  public static async updateRole(
    id: number,
    data: { name?: string; description?: string },
    actorId?: number,
    req?: Request
  ) {
    const role = await Role.findByPk(id);
    if (!role || role.deleted_at) throw new Error('Role not found');

    if (role.is_system_role) {
      throw new Error('System roles cannot be renamed');
    }

    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    await role.save();

    await LoggerService.logActivity({
      userId: actorId,
      action: 'UPDATE_ROLE',
      module: 'Roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Updated role details for ${role.code}`,
      req,
    });

    return RoleService.getRoleById(role.id);
  }

  public static async assignPermissionsToRole(
    id: number,
    permissionIds: number[],
    actorId?: number,
    req?: Request
  ) {
    const role = await Role.findByPk(id);
    if (!role || role.deleted_at) throw new Error('Role not found');

    const permissions = await Permission.findAll({ where: { id: permissionIds } });
    await role.setPermissions(permissions);

    await LoggerService.logActivity({
      userId: actorId,
      action: 'ASSIGN_PERMISSIONS',
      module: 'Roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Updated permissions for role ${role.code} (${permissions.length} permissions assigned)`,
      req,
    });

    return RoleService.getRoleById(role.id);
  }

  public static async copyPermissions(fromRoleId: number, toRoleId: number, actorId?: number, req?: Request) {
    const sourceRole = await RoleService.getRoleById(fromRoleId);
    const targetRole = await Role.findByPk(toRoleId);

    if (!targetRole || targetRole.deleted_at) throw new Error('Target role not found');

    const permissionIds = sourceRole.Permissions?.map((p) => p.id) || [];
    const permissions = await Permission.findAll({ where: { id: permissionIds } });
    await targetRole.setPermissions(permissions);

    await LoggerService.logActivity({
      userId: actorId,
      action: 'COPY_PERMISSIONS',
      module: 'Roles',
      entityType: 'Role',
      entityId: targetRole.id,
      description: `Copied permissions from role ${sourceRole.code} to ${targetRole.code}`,
      req,
    });

    return RoleService.getRoleById(targetRole.id);
  }

  public static async deleteRole(id: number, actorId?: number, req?: Request) {
    const role = await Role.findByPk(id);
    if (!role || role.deleted_at) throw new Error('Role not found');

    if (role.is_system_role) {
      throw new Error('System roles cannot be deleted');
    }

    role.deleted_at = new Date();
    await role.save();

    await LoggerService.logActivity({
      userId: actorId,
      action: 'DELETE_ROLE',
      module: 'Roles',
      entityType: 'Role',
      entityId: role.id,
      description: `Deleted role ${role.code}`,
      req,
    });

    return { message: 'Role deleted successfully' };
  }

  public static async getAllPermissions() {
    const permissions = await Permission.findAll({ order: [['module', 'ASC'], ['id', 'ASC']] });
    
    // Group permissions by module
    const grouped: Record<string, any[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return {
      all: permissions,
      byModule: grouped,
    };
  }
}
