import { User, Licence, LicenceActivation, Customer, LoginAttempt, ActivityLog, LicenceAuditLog } from '../models';
import { Op } from 'sequelize';
import { LicenceService } from './LicenceService';

export class DashboardService {
  public static async getDashboardMetrics(userPermissions: string[], userRoles: string[]) {
    await LicenceService.autoExpireLicences();
    const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

    const metrics: Record<string, any> = {};

    // 1. Users metrics
    if (isSuperAdmin || userPermissions.includes('VIEW_USERS')) {
      metrics.totalUsers = await User.count({ where: { deleted_at: null } });
      metrics.activeUsers = await User.count({ where: { status: 'ACTIVE', deleted_at: null } });
    }

    // 2. Licences metrics
    if (isSuperAdmin || userPermissions.includes('VIEW_LICENCES')) {
      metrics.totalLicences = await Licence.count({ where: { deleted_at: null } });
      metrics.activeLicences = await Licence.count({ where: { status: 'ACTIVE', deleted_at: null } });
      metrics.expiredLicences = await Licence.count({ where: { status: 'EXPIRED', deleted_at: null } });
      metrics.suspendedLicences = await Licence.count({ where: { status: 'SUSPENDED', deleted_at: null } });
      metrics.revokedLicences = await Licence.count({ where: { status: 'REVOKED', deleted_at: null } });

      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      metrics.expiringIn30Days = await Licence.count({
        where: {
          status: 'ACTIVE',
          expires_at: { [Op.between]: [new Date(), in30Days] },
          deleted_at: null,
        },
      });
    }

    // 3. Activations metrics
    if (isSuperAdmin || userPermissions.includes('VIEW_ACTIVATIONS')) {
      metrics.activeInstallations = await LicenceActivation.count({ where: { status: 'ACTIVE' } });
    }

    // 4. Customers metric
    if (isSuperAdmin || userPermissions.includes('VIEW_CUSTOMERS')) {
      metrics.totalCustomers = await Customer.count({ where: { deleted_at: null } });
    }

    // Recent items section
    const recentData: Record<string, any> = {};

    if (isSuperAdmin || userPermissions.includes('VIEW_LICENCES')) {
      recentData.recentLicences = await Licence.findAll({
        where: { deleted_at: null },
        include: [{ model: Customer, attributes: ['company_name', 'email'] }],
        order: [['created_at', 'DESC']],
        limit: 5,
      });

      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      recentData.expiringLicences = await Licence.findAll({
        where: {
          status: 'ACTIVE',
          expires_at: { [Op.between]: [new Date(), in30Days] },
          deleted_at: null,
        },
        include: [{ model: Customer, attributes: ['company_name', 'email'] }],
        order: [['expires_at', 'ASC']],
        limit: 5,
      });
    }

    if (isSuperAdmin || userPermissions.includes('VIEW_ACTIVATIONS')) {
      recentData.recentActivations = await LicenceActivation.findAll({
        include: [{ model: Licence, include: [{ model: Customer, attributes: ['company_name'] }] }],
        order: [['activated_at', 'DESC']],
        limit: 5,
      });
    }

    if (isSuperAdmin || userPermissions.includes('VIEW_AUDIT_LOGS')) {
      recentData.failedLoginAttempts = await LoginAttempt.findAll({
        where: { is_success: false },
        order: [['created_at', 'DESC']],
        limit: 5,
      });

      recentData.recentActivities = await ActivityLog.findAll({
        include: [{ model: User, attributes: ['username', 'full_name'] }],
        order: [['created_at', 'DESC']],
        limit: 5,
      });
    }

    return {
      metrics,
      sections: recentData,
    };
  }
}
