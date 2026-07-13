import { prisma } from '../../lib/prisma';
import { validateAppointmentRules } from '../../utils/schedulingValidation';
import { resolveEmployeeUserId } from '../../utils/resolveEmployeeUserId';
import { formatDateForNotification } from '../../utils/dateTime';

const ACTIVE_APPOINTMENT_STATUSES = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS']);

function throwValidationError(details: {
  status?: number;
  error?: string;
  message?: string;
}): never {
  const error: any = new Error('VALIDATION_ERROR');
  error.details = details;
  throw error;
}

export class AppointmentService {
  async getAppointments(tenantId: string, filters: any, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where: any = { tenantId };

    if (filters.startDate || filters.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        where.startTime.gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.status) where.status = filters.status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          service: { select: { id: true, name: true, color: true, duration: true } },
          employee: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } }
        }
      }),
      prisma.appointment.count({ where })
    ]);

    return { appointments, total, page, limit, totalPages: Math.ceil(total / take) };
  }

  async getAppointmentById(tenantId: string, id: string) {
    return prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        service: true,
        employee: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        invoice: true
      }
    });
  }

  async createAppointment(tenantId: string, createdById: string, data: any, isPublicBooking: boolean = false) {
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + data.duration * 60000);

    const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
    if (!client) throw new Error('CLIENT_NOT_FOUND');

    const service = await prisma.service.findFirst({ where: { id: data.serviceId, tenantId } });
    if (!service) throw new Error('SERVICE_NOT_FOUND');

    let userIdForAppointment: string | null = null;
    if (data.employeeId) {
      userIdForAppointment = await resolveEmployeeUserId(tenantId, data.employeeId);
      if (!userIdForAppointment) throw new Error('INVALID_EMPLOYEE');
    }

    const validationResult = await validateAppointmentRules({
      tenantId,
      employeeId: userIdForAppointment,
      serviceIds: [data.serviceId],
      startTime,
      endTime,
      isPublicBooking,
    });

    if (!validationResult.isValid) {
      throwValidationError(validationResult);
    }

    return prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        serviceId: data.serviceId,
        employeeId: userIdForAppointment,
        createdById,
        startTime,
        endTime,
        duration: data.duration,
        status: data.status || 'CONFIRMED',
        notes: data.notes
      },
      include: {
        client: true,
        service: true,
        employee: true
      }
    });
  }

  async updateAppointment(tenantId: string, id: string, data: any) {
    const existing = await prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('APPOINTMENT_NOT_FOUND');

    const updateData: any = { ...data };

    if (data.employeeId !== undefined) {
      if (data.employeeId) {
        const userIdForAppointment = await resolveEmployeeUserId(tenantId, data.employeeId);
        updateData.employeeId = userIdForAppointment;
      } else {
        updateData.employeeId = null;
      }
    }

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
    const duration = data.duration ?? existing.duration;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    updateData.startTime = startTime;
    updateData.duration = duration;
    updateData.endTime = endTime;

    const employeeUserId =
      updateData.employeeId !== undefined ? updateData.employeeId : existing.employeeId;
    const serviceId = data.serviceId ?? existing.serviceId;
    const nextStatus = data.status ?? existing.status;

    const resolvedEmployeeId =
      data.employeeId !== undefined
        ? updateData.employeeId
        : existing.employeeId;
    const employeeChanged =
      data.employeeId !== undefined && resolvedEmployeeId !== existing.employeeId;
    const serviceChanged =
      data.serviceId !== undefined && data.serviceId !== existing.serviceId;

    if (employeeUserId && ACTIVE_APPOINTMENT_STATUSES.has(nextStatus)) {
      const validationResult = await validateAppointmentRules({
        tenantId,
        employeeId: employeeUserId,
        serviceIds: [serviceId],
        startTime,
        endTime,
        isPublicBooking: false,
        excludeAppointmentId: id,
        validateServiceCompatibility: employeeChanged || serviceChanged,
      });

      if (!validationResult.isValid) {
        throwValidationError(validationResult);
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        service: true,
        employee: true,
        tenant: { select: { id: true, name: true } }
      }
    });

    if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
      try {
        const tenantSettings = await prisma.tenantSettings.findUnique({
          where: { tenantId }, select: { timezone: true }
        });
        const timezone = tenantSettings?.timezone || 'Africa/Casablanca';
        const appointmentDate = formatDateForNotification(appointment.startTime.toISOString(), timezone);

        await prisma.notification.create({
          data: {
            tenantId,
            userId: null,
            type: 'APPOINTMENT_CONFIRMED',
            title: 'Rendez-vous confirmé',
            message: `Votre rendez-vous pour "${appointment.service.name}" le ${appointmentDate} a été confirmé par ${appointment.tenant.name}.`,
            link: null,
            metadata: {
              appointmentId: appointment.id,
              clientId: appointment.clientId,
              tenantId
            }
          }
        });
      } catch (e) {
        console.error('Error creating appointment confirmation notification:', e);
      }
    }

    return appointment;
  }

  async deleteAppointment(tenantId: string, id: string, userId: string) {
    const appointment = await prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!appointment) throw new Error('APPOINTMENT_NOT_FOUND');

    if (appointment.status === 'CANCELLED') {
      await prisma.appointment.delete({ where: { id } });
      return;
    }

    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId
      }
    });
  }
}

export const appointmentService = new AppointmentService();
