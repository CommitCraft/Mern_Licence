import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';

export class AdminUserController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      return res.json({ success: true, users });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await UserService.getUserById(id);
      return res.json({ success: true, user });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { fullName, username, email, phone, roleId, password, status } = req.body;
      if (!fullName || !username || !email || !roleId) {
        return res.status(400).json({ success: false, message: 'Full name, username, email, and role are required' });
      }

      const newUser = await UserService.createUser(
        { fullName, username, email, phone, roleId, password, status },
        req.user?.userId,
        req
      );
      return res.status(201).json({ success: true, user: newUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await UserService.updateUser(id, req.body, req.user?.userId, req);
      return res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED', 'LOCKED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid user status' });
      }

      const result = await UserService.updateUserStatus(id, status, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;
      const result = await UserService.resetUserPassword(id, password, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async revokeSessions(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await AuthService.revokeAllSessions(id, req);
      return res.json({ success: true, message: 'User sessions revoked successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async softDelete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const result = await UserService.softDeleteUser(id, req.user?.userId, req);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
