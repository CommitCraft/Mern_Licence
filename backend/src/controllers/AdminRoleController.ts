import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { RoleService } from '../services/RoleService';

export class AdminRoleController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const roles = await RoleService.getAllRoles();
      return res.json({ success: true, roles });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const role = await RoleService.getRoleById(id);
      return res.json({ success: true, role });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, code, description, permissionIds } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Role name and code are required' });
      }

      const role = await RoleService.createRole({ name, code, description, permissionIds }, req.user?.userId, req);
      return res.status(201).json({ success: true, role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const role = await RoleService.updateRole(id, req.body, req.user?.userId, req);
      return res.json({ success: true, role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async assignPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ success: false, message: 'permissionIds must be an array of IDs' });
      }

      const role = await RoleService.assignPermissionsToRole(id, permissionIds, req.user?.userId, req);
      return res.json({ success: true, role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async copyPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const { fromRoleId, toRoleId } = req.body;
      if (!fromRoleId || !toRoleId) {
        return res.status(400).json({ success: false, message: 'fromRoleId and toRoleId are required' });
      }

      const role = await RoleService.copyPermissions(fromRoleId, toRoleId, req.user?.userId, req);
      return res.json({ success: true, role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await RoleService.deleteRole(id, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async getPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const permissions = await RoleService.getAllPermissions();
      return res.json({ success: true, ...permissions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
