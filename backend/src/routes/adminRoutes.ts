import { Router } from 'express';
import { authenticateUser, requirePermission, preventSelfDeletion, protectSuperAdmin } from '../middleware/authMiddleware';
import { AdminUserController } from '../controllers/AdminUserController';
import { AdminRoleController } from '../controllers/AdminRoleController';
import { AdminCustomerController } from '../controllers/AdminCustomerController';
import { AdminLicenceController } from '../controllers/AdminLicenceController';
import { AdminActivationController } from '../controllers/AdminActivationController';
import { AdminAuditLogController } from '../controllers/AdminAuditLogController';
import { AdminDashboardController } from '../controllers/AdminDashboardController';
import { AdminSettingsController } from '../controllers/AdminSettingsController';
import { AdminProductController } from '../controllers/AdminProductController';

const router = Router();


// Require authentication for all admin routes
router.use(authenticateUser);

// Dashboard
router.get('/dashboard', requirePermission('VIEW_DASHBOARD'), AdminDashboardController.getDashboard);

// Permissions Endpoint
router.get('/permissions', requirePermission('VIEW_ROLES'), AdminRoleController.getPermissions);

// User Management
router.get('/users', requirePermission('VIEW_USERS'), AdminUserController.getAll);
router.post('/users', requirePermission('CREATE_USER'), AdminUserController.create);
router.get('/users/:id', requirePermission('VIEW_USERS'), AdminUserController.getById);
router.patch('/users/:id', requirePermission('UPDATE_USER'), protectSuperAdmin, AdminUserController.update);
router.patch('/users/:id/status', requirePermission('MANAGE_USER_STATUS'), protectSuperAdmin, AdminUserController.updateStatus);
router.post('/users/:id/reset-password', requirePermission('RESET_USER_PASSWORD'), protectSuperAdmin, AdminUserController.resetPassword);
router.post('/users/:id/revoke-sessions', requirePermission('MANAGE_USER_STATUS'), AdminUserController.revokeSessions);
router.delete('/users/:id', requirePermission('DELETE_USER'), preventSelfDeletion, protectSuperAdmin, AdminUserController.softDelete);

// Role Management
router.get('/roles', requirePermission('VIEW_ROLES'), AdminRoleController.getAll);
router.post('/roles', requirePermission('CREATE_ROLE'), AdminRoleController.create);
router.get('/roles/:id', requirePermission('VIEW_ROLES'), AdminRoleController.getById);
router.patch('/roles/:id', requirePermission('UPDATE_ROLE'), AdminRoleController.update);
router.delete('/roles/:id', requirePermission('DELETE_ROLE'), AdminRoleController.delete);
router.put('/roles/:id/permissions', requirePermission('ASSIGN_PERMISSIONS'), AdminRoleController.assignPermissions);
router.post('/roles/copy-permissions', requirePermission('ASSIGN_PERMISSIONS'), AdminRoleController.copyPermissions);

// Customer Management
router.get('/customers', requirePermission('VIEW_CUSTOMERS'), AdminCustomerController.getAll);
router.post('/customers', requirePermission('CREATE_CUSTOMER'), AdminCustomerController.create);
router.get('/customers/:id', requirePermission('VIEW_CUSTOMERS'), AdminCustomerController.getById);
router.patch('/customers/:id', requirePermission('UPDATE_CUSTOMER'), AdminCustomerController.update);
router.delete('/customers/:id', requirePermission('DELETE_CUSTOMER'), AdminCustomerController.delete);

// Licence Management
router.get('/licences', requirePermission('VIEW_LICENCES'), AdminLicenceController.getAll);
router.post('/licences', requirePermission('CREATE_LICENCE'), AdminLicenceController.create);
router.get('/licences/:id', requirePermission('VIEW_LICENCES'), AdminLicenceController.getById);
router.patch('/licences/:id', requirePermission('UPDATE_LICENCE'), AdminLicenceController.update);
router.post('/licences/:id/extend', requirePermission('EXTEND_LICENCE'), AdminLicenceController.extend);
router.patch('/licences/:id/status', requirePermission('SUSPEND_LICENCE'), AdminLicenceController.setStatus);

// Activation Management
router.get('/activations', requirePermission('VIEW_ACTIVATIONS'), AdminActivationController.getAll);
router.post('/activations/:id/deactivate', requirePermission('DEACTIVATE_INSTALLATION'), AdminActivationController.deactivate);

// Audit & Activity Logs
router.get('/activity-logs', requirePermission('VIEW_AUDIT_LOGS'), AdminAuditLogController.getActivityLogs);
router.get('/audit-logs', requirePermission('VIEW_AUDIT_LOGS'), AdminAuditLogController.getLicenceAuditLogs);

// Application Settings
router.get('/settings', requirePermission('MANAGE_SETTINGS'), AdminSettingsController.getSettings);
router.patch('/settings', requirePermission('MANAGE_SETTINGS'), AdminSettingsController.updateSettings);

// Product Management
router.get('/products', AdminProductController.getAll);
router.post('/products', AdminProductController.create);
router.patch('/products/:id', AdminProductController.update);
router.delete('/products/:id', AdminProductController.delete);

export default router;

