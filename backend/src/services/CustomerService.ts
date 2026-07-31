import { Customer, Licence, LicenceActivation } from '../models';
import { generateCustomerCode } from '../utils/crypto';
import { LoggerService } from './LoggerService';
import { Request } from 'express';

export class CustomerService {
  public static async getAllCustomers() {
    return Customer.findAll({
      where: { deleted_at: null },
      include: [
        {
          model: Licence,
          attributes: ['id', 'licence_reference', 'product_code', 'status', 'expires_at'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public static async getCustomerById(id: number) {
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Licence,
          include: [{ model: LicenceActivation }],
        },
      ],
    });

    if (!customer || customer.deleted_at) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  public static async createCustomer(
    data: {
      customerName: string;
      companyName: string;
      email: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      contactPerson?: string;
      notes?: string;
    },
    creatorId?: number,
    req?: Request
  ) {
    const customerCode = generateCustomerCode();

    const customer = await Customer.create({
      customer_code: customerCode,
      customer_name: data.customerName,
      company_name: data.companyName,
      email: data.email,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      contact_person: data.contactPerson || null,
      notes: data.notes || null,
      status: 'ACTIVE',
      created_by: creatorId || null,
    });

    await LoggerService.logActivity({
      userId: creatorId,
      action: 'CREATE_CUSTOMER',
      module: 'Customers',
      entityType: 'Customer',
      entityId: customer.id,
      description: `Created customer ${customer.company_name} (${customer.customer_code})`,
      req,
    });

    return customer;
  }

  public static async updateCustomer(
    id: number,
    data: Partial<{
      customerName: string;
      companyName: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      contactPerson: string;
      status: 'ACTIVE' | 'INACTIVE';
      notes: string;
    }>,
    updaterId?: number,
    req?: Request
  ) {
    const customer = await Customer.findByPk(id);
    if (!customer || customer.deleted_at) throw new Error('Customer not found');

    if (data.customerName) customer.customer_name = data.customerName;
    if (data.companyName) customer.company_name = data.companyName;
    if (data.email) customer.email = data.email;
    if (data.phone !== undefined) customer.phone = data.phone || null;
    if (data.address !== undefined) customer.address = data.address || null;
    if (data.city !== undefined) customer.city = data.city || null;
    if (data.state !== undefined) customer.state = data.state || null;
    if (data.country !== undefined) customer.country = data.country || null;
    if (data.contactPerson !== undefined) customer.contact_person = data.contactPerson || null;
    if (data.status) customer.status = data.status;
    if (data.notes !== undefined) customer.notes = data.notes || null;
    customer.updated_by = updaterId || null;

    await customer.save();

    await LoggerService.logActivity({
      userId: updaterId,
      action: 'UPDATE_CUSTOMER',
      module: 'Customers',
      entityType: 'Customer',
      entityId: customer.id,
      description: `Updated customer details for ${customer.company_name}`,
      req,
    });

    return customer;
  }

  public static async deleteCustomer(id: number, actorId?: number, req?: Request) {
    const customer = await Customer.findByPk(id);
    if (!customer || customer.deleted_at) throw new Error('Customer not found');

    customer.deleted_at = new Date();
    await customer.save();

    await LoggerService.logActivity({
      userId: actorId,
      action: 'DELETE_CUSTOMER',
      module: 'Customers',
      entityType: 'Customer',
      entityId: customer.id,
      description: `Soft deleted customer ${customer.company_name}`,
      req,
    });

    return { message: 'Customer soft deleted successfully' };
  }
}
