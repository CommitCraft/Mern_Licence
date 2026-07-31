import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { UserService } from '../services/UserService';

export class AuthController {
  public static async getSetupStatus(req: Request, res: Response) {
    try {
      const isRequired = await AuthService.isSetupRequired();
      return res.json({ success: true, setupRequired: isRequired });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async firstTimeSetup(req: Request, res: Response) {
    try {
      const { fullName, username, email, password, confirmPassword, companyName, productName } = req.body;

      if (!fullName || !username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All required fields must be filled' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }

      const result = await AuthService.firstTimeSetup({
        fullName,
        username,
        email,
        password,
        companyName,
        productName,
        req,
      });

      return res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { loginId, password, rememberMe } = req.body;
      if (!loginId || !password) {
        return res.status(400).json({ success: false, message: 'Email/username and password are required' });
      }

      const { accessToken, refreshToken, user } = await AuthService.login(loginId, password, req);

      // Set HttpOnly refresh token cookie
      const maxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
      });

      return res.json({
        success: true,
        message: 'Login successful',
        accessToken,
        user,
      });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  public static async refreshToken(req: Request, res: Response) {
    try {
      const tokenFromCookie = req.cookies?.refreshToken;
      const tokenFromBody = req.body?.refreshToken;
      const refreshToken = tokenFromCookie || tokenFromBody;

      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token is missing' });
      }

      const { accessToken } = await AuthService.refreshToken(refreshToken);
      return res.json({ success: true, accessToken });
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await AuthService.logout(refreshToken, req.user?.userId, req);

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthenticated' });
      }

      const userDetails = await UserService.getUserById(req.user.userId);
      return res.json({
        success: true,
        user: {
          id: userDetails.id,
          fullName: userDetails.full_name,
          username: userDetails.username,
          email: userDetails.email,
          phone: userDetails.phone,
          status: userDetails.status,
          lastLoginAt: userDetails.last_login_at,
          roles: req.user.roles,
          permissions: req.user.permissions,
        },
      });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }

      const user = await UserService.getUserById(req.user.userId);
      await UserService.resetUserPassword(user.id, newPassword, req.user.userId, req);

      return res.json({ success: true, message: 'Password updated successfully. Please log in again if required.' });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  public static async revokeAllSessions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

      await AuthService.revokeAllSessions(req.user.userId, req);
      return res.json({ success: true, message: 'All active sessions revoked successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
