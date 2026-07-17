import { prisma } from '../../lib/prisma';
import { validateAppointmentRules } from '../../utils/schedulingValidation';
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
    include: { service: { select: serviceSelect } },
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
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.serviceId) {
      where.OR = [
        { serviceId: filters.serviceId },
        { services: { some: { serviceId: filters.serviceId } } },
      ];
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
        services: { orderBy: { sortOrder: 'asc' }, include: { service: true } },
        employee: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        invoice: true,
      },
    });
    return appointment ? serializeAppointmentWithServices(appointment) : null;
  }

  async createAppointment(tenantId: string, createdById: string, data: any, isPublicBooking: boolean = false) {
    const startTime = new Date(data.startTime);

    const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId } });
    if (!client) throw new Error('CLIENT_NOT_FOUND');

    const services = await this.resolveServices(tenantId, data);
    const serviceIds = services.map((service) => service.id);
    const duration = services.reduce((sum, service) => sum + service.duration, 0);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const primaryService = services[0];

    const validationResult = await validateAppointmentRules({
      tenantId,
      employeeId: null,
      serviceIds,
      startTime,
      endTime,
      isPublicBooking,
      validateServiceCompatibility: false,
    });

    if (!validationResult.isValid) throwValidationError(validationResult);

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        serviceId: primaryService.id,
        employeeId: null,
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
    const scheduleChanged = timeChanged || servicesChanged;

    if (scheduleChanged && ACTIVE_APPOINTMENT_STATUSES.has(nextStatus)) {
      const validationResult = await validateAppointmentRules({
        tenantId,
        employeeId: null,
        serviceIds: nextServices?.map((service) => service.id) ?? [existing.serviceId],
        startTime,
        endTime,
        isPublicBooking: false,
        excludeAppointmentId: id,
        validateServiceCompatibility: false,
      });

      if (!validationResult.isValid) throwValidationError(validationResult);
    }

    updateData.startTime = startTime;
    updateData.duration = duration;
    updateData.endTime = endTime;
    updateData.employeeId = null;
    if (data.notes !== undefined) updateData.notes = stripGeneratedServicesNotes(data.notes);
    delete updateData.serviceIds;
    delete updateData.services;

    if (nextServices) {
      updateData.serviceId = nextServices[0].id;
      updateData.services = {
        deleteMany: {},
        create: nextServices.map((service, index) => ({
          serviceId: service.id,
          serviceName: service.name,
          duration: service.duration,
          price: getServicePrice(service),
          sortOrder: index,
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
