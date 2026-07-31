import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth';
import { User, Role, Permission } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication token is missing' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }

    // Verify user in DB to ensure account is active and not deleted/suspended
    const user = await User.findByPk(payload.userId, {
      include: [
        {
          model: Role,
          as: 'Roles',
          where: { status: 'ACTIVE' },
          required: false,
          include: [
            {
              model: Permission,
              as: 'Permissions',
              required: false,
            },
          ],
        },
      ],
    });

    if (!user || user.deleted_at) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status.toLowerCase()}` });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ success: false, message: 'Account is temporarily locked' });
    }

    // Fetch fresh roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    if (user.Roles) {
      for (const role of user.Roles) {
        roles.push(role.code);
        if (role.Permissions) {
          for (const perm of role.Permissions) {
            permissionsSet.add(perm.code);
          }
        }
      }
    }

    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    // SUPER_ADMIN role bypasses explicit permission checks
    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    if (!req.user.permissions.includes(permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required permission '${permissionCode}' is missing`,
      });
    }

    next();
  };
}

export function requireAnyPermission(permissionCodes: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (req.user.roles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasAny = permissionCodes.some((code) => req.user?.permissions.includes(code));
    if (!hasAny) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
}

export function requireRole(roleCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }

    if (!req.user.roles.includes(roleCode) && !req.user.roles.includes('SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required role '${roleCode}' is missing`,
      });
    }

    next();
  };
}

export function preventSelfDeletion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const targetId = parseInt(req.params.id);
  if (req.user && req.user.userId === targetId) {
    return res.status(400).json({ success: false, message: 'You cannot delete or deactivate your own active account' });
  }
  next();
}

export async function protectSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const targetUserId = parseInt(req.params.id);
    if (!targetUserId) return next();

    const targetUser = await User.findByPk(targetUserId, {
      include: [{ model: Role, as: 'Roles' }],
    });

    if (!targetUser) return next();

    const isTargetSuperAdmin = targetUser.Roles?.some((r) => r.code === 'SUPER_ADMIN');
    if (isTargetSuperAdmin) {
      // Check if current user is SUPER_ADMIN
      if (!req.user?.roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'Only a Super Administrator can modify or delete another Super Administrator',
        });
      }

      // Count total active SUPER_ADMINs
      const superAdminRole = await Role.findOne({ where: { code: 'SUPER_ADMIN' } });
      if (superAdminRole) {
        const superAdminsCount = await User.count({
          include: [{ model: Role, as: 'Roles', where: { id: superAdminRole.id } }],
        });

        if (superAdminsCount <= 1 && (req.method === 'DELETE' || req.body.status === 'SUSPENDED')) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete or suspend the final Super Administrator in the system',
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error in Super Admin protection check' });
  }
}
