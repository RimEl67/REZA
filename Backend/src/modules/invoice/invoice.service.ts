import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

export class InvoiceService {
  async getInvoices(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    return prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        appointment: {
          select: {
            startTime: true,
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  }

  async getInvoiceById(tenantId: string, id: string) {
    return prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        appointment: {
          include: {
            service: true
          }
        },
        tenant: {
          select: {
            name: true,
            phone: true,
            address: true,
            logo: true
          }
        }
      }
    });
  }

  async createInvoice(tenantId: string, data: any) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId
      }
    });

    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    if (data.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: data.appointmentId,
          tenantId
        }
      });

      if (!appointment) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }
      
      if (appointment.clientId !== data.clientId) {
        throw new Error('CLIENT_MISMATCH');
      }
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
    const invoiceNumber = `INV-${year}${month}-${randomStr}`;

    const total = data.amount + (data.amount * (data.tax / 100));

    return prisma.invoice.create({
      data: {
        tenantId,
        clientId: data.clientId,
        appointmentId: data.appointmentId,
        invoiceNumber,
        amount: data.amount,
        tax: data.tax,
        total,
        status: 'PENDING',
        paymentMethod: data.paymentMethod,
        notes: data.notes
      },
      include: {
        client: true,
        appointment: true
      }
    });
  }

  async updateInvoice(tenantId: string, id: string, data: any) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId }
    });

    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.paidAt) {
      updateData.paidAt = new Date(data.paidAt);
    } else if (data.status === 'PAID' && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        appointment: true
      }
    });
  }

  async getStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [totalRevenueResult, monthlyRevenueResult, invoicesCount, pendingInvoicesCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID'
        },
        _sum: {
          total: true
        }
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          total: true
        }
      }),
      prisma.invoice.count({
        where: { tenantId }
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: 'PENDING'
        }
      })
    ]);

    return {
      totalRevenue: totalRevenueResult._sum.total || 0,
      monthlyRevenue: monthlyRevenueResult._sum.total || 0,
      invoicesCount,
      pendingInvoicesCount
    };
  }
}

export const invoiceService = new InvoiceService();
