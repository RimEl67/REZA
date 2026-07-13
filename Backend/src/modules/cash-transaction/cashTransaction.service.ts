import { prisma } from '../../lib/prisma';
import { CreateCashTransactionInput } from './cashTransaction.schema';

export class CashTransactionService {
  async getTransactions(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    type?: string,
    page: number = 1,
    limit: number = 100
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { tenantId };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.cashTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.cashTransaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  async getTransactionById(tenantId: string, transactionId: string) {
    const transaction = await prisma.cashTransaction.findFirst({
      where: {
        id: transactionId,
        tenantId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      throw {
        status: 404,
        error: 'Transaction not found'
      };
    }

    return { transaction };
  }

  async createTransaction(tenantId: string, userId: string, input: CreateCashTransactionInput) {
    const transaction = await prisma.cashTransaction.create({
      data: {
        ...input,
        tenantId,
        createdById: userId
      } as any,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return { transaction };
  }

  async deleteTransaction(tenantId: string, transactionId: string) {
    const transaction = await prisma.cashTransaction.findFirst({
      where: {
        id: transactionId,
        tenantId
      }
    });

    if (!transaction) {
      throw {
        status: 404,
        error: 'Transaction not found'
      };
    }

    await prisma.cashTransaction.delete({
      where: { id: transactionId }
    });

    return { message: 'Transaction deleted successfully' };
  }
}

export const cashTransactionService = new CashTransactionService();
