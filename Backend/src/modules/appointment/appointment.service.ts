import { prisma } from '../../lib/prisma';
import { validateAppointmentRules } from '../../utils/schedulingValidation';
import { resolveEmployeeUserId } from '../../utils/resolveEmployeeUserId';
import { schedulingService } from './scheduling.service';
import { formatDateForNotification } from '../../utils/dateTime';
import { tenantIdFilter } from '../../utils/salonScope';
import {
  getServicePrice,
  serializeAppointmentWithServices,
  stripGeneratedServicesNotes,
} from '../../utils/appointmentServiceItems';

const ACTIVE_APPOINTMENT_STATUSES = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS']);

const serviceSelect = {
  id: true,
  name: true,
  color: true,
  duration: true,
  price: true,
  priceFrom: true,
  onQuote: true,
};

const appointmentListInclude = {
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  service: { select: serviceSelect },
  services: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      service: { select: serviceSelect },
      employee: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  employee: { select: { id: true, firstName: true, lastName: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

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
  private getRequestedServiceIds(data: any) {
    const ids =
      data.serviceIds ||
      data.services?.map((service: any) => service.serviceId) ||
      (data.serviceId ? [data.serviceId] : []);
    return [...new Set(ids.filter(Boolean))] as string[];
  }

  private async resolveServices(tenantId: string, data: any) {
    const serviceIds = this.getRequestedServiceIds(data);
    if (serviceIds.length === 0) throw new Error('SERVICE_NOT_FOUND');

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, tenantId },
    });

    if (services.length !== serviceIds.length) throw new Error('SERVICE_NOT_FOUND');

    const byId = new Map(services.map((service) => [service.id, service]));
    return serviceIds.map((id) => byId.get(id)!);
  }

  async getAppointments(tenantIds: string | string[], filters: any, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where: any = { tenantId: tenantIdFilter(tenantIds) };

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
    if (filters.employeeId) {
      where.OR = [
        { employeeId: filters.employeeId },
        { services: { some: { employeeId: filters.employeeId } } },
      ];
    }
    if (filters.serviceId) {
      const serviceFilter = [
        { serviceId: filters.serviceId },
        { services: { some: { serviceId: filters.serviceId } } },
      ];
      if (where.OR) {
        // Combine with employee OR filter — both must match
        where.AND = [{ OR: where.OR }, { OR: serviceFilter }];
        delete where.OR;
      } else {
        where.OR = serviceFilter;
      }
    }
    if (filters.status) where.status = filters.status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: appointmentListInclude,
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments: appointments.map(serializeAppointmentWithServices),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / take),
    };
  }

  async getAppointmentById(tenantIds: string | string[], id: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId: tenantIdFilter(tenantIds) },
      include: {
        client: true,
        service: true,
        services: { orderBy: { sortOrder: 'asc' }, include: { service: true, employee: true } },
        employee: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        invoice: true,
      },
    });
    return appointment ? serializeAppointmentWithServices(appointment) : null;
  }

  async createAppointment(tenantId: string, createdById: string, data: any, isPublicBooking: boolean = false) {
    const startTime = new Date(data.startTime);
    const source = data.source as 'ADMIN' | 'PUBLIC' | undefined;

    const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
    if (!client) throw new Error('CLIENT_NOT_FOUND');

    const services = await this.resolveServices(tenantId, data);
    const serviceIds = services.map((service) => service.id);
    const duration = services.reduce((sum, service) => sum + service.duration, 0);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const primaryService = services[0];

    // Top-level employeeId: legacy field. When data.employeeId is absent (new services[] flow),
    // this stays null — per-service employees are stored on AppointmentServiceItem.employeeId.
    let userIdForAppointment: string | null = null;
    if (data.employeeId) {
      userIdForAppointment = await resolveEmployeeUserId(tenantId, data.employeeId);
      if (!userIdForAppointment) throw new Error('INVALID_EMPLOYEE');
    }

    const validationResult = await validateAppointmentRules({
      tenantId,
      employeeId: userIdForAppointment,
      serviceIds,
      startTime,
      endTime,
      isPublicBooking,
      validateServiceCompatibility: false,
      source,
    });

    if (!validationResult.isValid) throwValidationError(validationResult);

    // Build per-service employee assignment map from data.services if provided
    const serviceEmployeeMap = new Map<string, string | null>();
    if (data.services && Array.isArray(data.services)) {
      for (const item of data.services) {
        if (item.employeeId) {
          const resolved = await resolveEmployeeUserId(tenantId, item.employeeId);
          serviceEmployeeMap.set(item.serviceId, resolved);
        } else {
          serviceEmployeeMap.set(item.serviceId, null);
        }
      }
    }

    // Re-validate final per-service employee assignments before write
    // (race-window safe — validation and write are in the same execution path)
    if (data.services && data.services.length > 0) {
      const dateStr = startTime.toISOString().split('T')[0];
      const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      const assignments = data.services.map((s: any) => ({
        serviceId: s.serviceId,
        employeeId: s.employeeId || null,
      }));
      const validation = await schedulingService.validateAssignment({
        tenantId,
        serviceIds: data.services.map((s: any) => s.serviceId),
        assignments,
        startTime: timeStr,
        date: dateStr,
        source,
      });
      if (!validation.valid) {
        // Admin overrides employee scheduling conflicts, but skill/day mismatches still block
        const err: any = new Error('VALIDATION_ERROR');
        err.details = { status: 409, error: 'Assignment conflict', message: validation.errors[0].message };
        throw err;
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        serviceId: primaryService.id,
        employeeId: userIdForAppointment,
        createdById,
        startTime,
        endTime,
        duration,
        status: data.status || 'CONFIRMED',
        notes: stripGeneratedServicesNotes(data.notes),
        services: {
          create: services.map((service, index) => ({
            serviceId: service.id,
            serviceName: service.name,
            duration: service.duration,
            price: getServicePrice(service),
            sortOrder: index,
            employeeId: serviceEmployeeMap.get(service.id) ?? null,
          })),
        },
      },
      include: appointmentListInclude,
    });

    return serializeAppointmentWithServices(appointment);
  }

  async updateAppointment(tenantIds: string | string[], id: string, data: any) {
    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId: tenantIdFilter(tenantIds) },
    });
    if (!existing) throw new Error('APPOINTMENT_NOT_FOUND');
    const tenantId = existing.tenantId;

    const updateData: any = { ...data };
    const servicesChanged =
      data.serviceId !== undefined ||
      data.serviceIds !== undefined ||
      data.services !== undefined;
    const nextServices = servicesChanged ? await this.resolveServices(tenantId, data) : null;

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
    const duration = nextServices
      ? nextServices.reduce((sum, service) => sum + service.duration, 0)
      : data.duration ?? existing.duration;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const nextStatus = data.status ?? existing.status;
    const timeChanged =
      (data.startTime !== undefined &&
        new Date(data.startTime).getTime() !== existing.startTime.getTime()) ||
      (data.duration !== undefined && data.duration !== existing.duration);

    if (data.employeeId !== undefined) {
      if (data.employeeId) {
        const resolvedId = await resolveEmployeeUserId(tenantId, data.employeeId);
        updateData.employeeId = resolvedId;
        if (!resolvedId) throw new Error('INVALID_EMPLOYEE');
      } else {
        updateData.employeeId = null;
      }
    }

    const employeeUserId =
      updateData.employeeId !== undefined ? updateData.employeeId : existing.employeeId;
    const employeeChanged =
      data.employeeId !== undefined && updateData.employeeId !== existing.employeeId;
    const scheduleChanged = timeChanged || servicesChanged || employeeChanged;

    if (scheduleChanged && ACTIVE_APPOINTMENT_STATUSES.has(nextStatus)) {
      const validationResult = await validateAppointmentRules({
        tenantId,
        employeeId: employeeUserId,
        serviceIds: nextServices?.map((service) => service.id) ?? [existing.serviceId],
        startTime,
        endTime,
        isPublicBooking: false,
        excludeAppointmentId: id,
        validateServiceCompatibility: employeeChanged || servicesChanged,
      });

      if (!validationResult.isValid) throwValidationError(validationResult);
    }

    updateData.startTime = startTime;
    updateData.duration = duration;
    updateData.endTime = endTime;
    if (data.notes !== undefined) updateData.notes = stripGeneratedServicesNotes(data.notes);
    delete updateData.serviceIds;
    delete updateData.services;

    if (nextServices) {
      // Build per-service employee assignment map from data.services if provided
      const serviceEmployeeMap = new Map<string, string | null>();
      if (data.services && Array.isArray(data.services)) {
        for (const item of data.services) {
          if (item.employeeId) {
            const resolved = await resolveEmployeeUserId(tenantId, item.employeeId);
            serviceEmployeeMap.set(item.serviceId, resolved);
          } else {
            serviceEmployeeMap.set(item.serviceId, null);
          }
        }
      }

      updateData.serviceId = nextServices[0].id;
      updateData.services = {
        deleteMany: {},
        create: nextServices.map((service, index) => ({
          serviceId: service.id,
          serviceName: service.name,
          duration: service.duration,
          price: getServicePrice(service),
          sortOrder: index,
          employeeId: serviceEmployeeMap.get(service.id) ?? null,
        })),
      };
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        ...appointmentListInclude,
        tenant: { select: { id: true, name: true } },
      },
    });

    if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
      try {
        const tenantSettings = await prisma.tenantSettings.findUnique({
          where: { tenantId },
          select: { timezone: true },
        });
        const timezone = tenantSettings?.timezone || 'Africa/Casablanca';
        const appointmentDate = formatDateForNotification(appointment.startTime.toISOString(), timezone);

        await prisma.notification.create({
          data: {
            tenantId,
            userId: null,
            type: 'APPOINTMENT_CONFIRMED',
            title: 'Rendez-vous confirme',
            message: `Votre rendez-vous pour "${appointment.service.name}" le ${appointmentDate} a ete confirme par ${appointment.tenant.name}.`,
            link: null,
            metadata: {
              appointmentId: appointment.id,
              clientId: appointment.clientId,
              tenantId,
            },
          },
        });
      } catch (e) {
        console.error('Error creating appointment confirmation notification:', e);
      }
    }

    return serializeAppointmentWithServices(appointment);
  }

  async deleteAppointment(tenantIds: string | string[], id: string, userId: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId: tenantIdFilter(tenantIds) },
    });
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
        cancelledBy: userId,
      },
    });
  }
}

export const appointmentService = new AppointmentService();
