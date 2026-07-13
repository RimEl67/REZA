import { prisma } from '../lib/prisma';

const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as const;

interface ValidationParams {
  tenantId: string;
  employeeId?: string | null;
  serviceIds: string[];
  startTime: Date;
  endTime: Date;
  isPublicBooking: boolean;
  excludeAppointmentId?: string;
  /** When false, only overlap/time rules run (e.g. drag same employee+service). */
  validateServiceCompatibility?: boolean;
}

export async function findOverlappingAppointment(params: {
  tenantId: string;
  employeeId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}) {
  const { tenantId, employeeId, startTime, endTime, excludeAppointmentId } = params;

  return prisma.appointment.findFirst({
    where: {
      tenantId,
      employeeId,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true, startTime: true, endTime: true },
  });
}

/** When no employee is assigned, block slots that overlap any active appointment at the tenant. */
export async function findTenantWideOverlappingAppointment(params: {
  tenantId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string;
}) {
  const { tenantId, startTime, endTime, excludeAppointmentId } = params;

  return prisma.appointment.findFirst({
    where: {
      tenantId,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { id: true, startTime: true, endTime: true },
  });
}

export async function validateAppointmentRules(params: ValidationParams) {
  const {
    tenantId,
    employeeId,
    serviceIds,
    startTime,
    endTime,
    isPublicBooking,
    excludeAppointmentId,
    validateServiceCompatibility = isPublicBooking,
  } = params;

  if (endTime <= startTime) {
    return {
      isValid: false,
      status: 400,
      error: 'Invalid duration',
      message: 'La durée du rendez-vous doit être supérieure à 0.',
    };
  }

  if (isPublicBooking && startTime < new Date()) {
    return {
      isValid: false,
      status: 400,
      error: 'Invalid date',
      message: 'Impossible de réserver un créneau dans le passé.',
    };
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });

  if (settings && settings.businessHours) {
    const businessHours = settings.businessHours as Record<
      string,
      { open?: string; close?: string } | null
    >;
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[startTime.getDay()];
    const hours = businessHours[dayName];

    if (!hours || !hours.open || !hours.close) {
      return {
        isValid: false,
        status: 400,
        error: 'Outside business hours',
        message: "L'établissement est fermé ce jour-là.",
      };
    }

    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);

    const openTime = new Date(startTime);
    openTime.setHours(openHour, openMin, 0, 0);

    const closeTime = new Date(startTime);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    if (startTime < openTime || endTime > closeTime) {
      return {
        isValid: false,
        status: 400,
        error: 'Outside business hours',
        message: `Les rendez-vous doivent être planifiés entre ${hours.open} et ${hours.close}.`,
      };
    }
  }

  if (!employeeId) {
    const tenantOverlap = await findTenantWideOverlappingAppointment({
      tenantId,
      startTime,
      endTime,
      excludeAppointmentId,
    });
    if (tenantOverlap) {
      return {
        isValid: false,
        status: 409,
        error: 'Overlapping appointment',
        message: 'Ce créneau n\'est plus disponible. Veuillez en choisir un autre.',
      };
    }
    return { isValid: true };
  }

  const user = await prisma.user.findFirst({
    where: { id: employeeId, tenantId, isActive: true },
  });

  if (!user) {
    return {
      isValid: false,
      status: 404,
      error: 'Invalid employee',
      message: "Le collaborateur sélectionné n'existe pas ou n'est pas disponible.",
    };
  }

  if (validateServiceCompatibility && user.email) {
    const employee = await prisma.employee.findFirst({
      where: { email: user.email, tenantId, isActive: true },
      include: { employeeServices: true },
    });

    if (!employee) {
      return {
        isValid: false,
        status: 404,
        error: 'Invalid employee',
        message: "L'utilisateur sélectionné n'est pas configuré comme collaborateur.",
      };
    }

    const employeeAllowedServiceIds = employee.employeeServices.map((es) => es.serviceId);
    // No linked services = no restriction configured for this employee
    if (employeeAllowedServiceIds.length > 0) {
      for (const serviceId of serviceIds) {
        if (!employeeAllowedServiceIds.includes(serviceId)) {
          return {
            isValid: false,
            status: 400,
            error: 'Incompatible service',
            message: "Ce collaborateur n'est pas autorisé à effectuer cette prestation.",
          };
        }
      }
    }
  }

  const overlappingAppointment = await findOverlappingAppointment({
    tenantId,
    employeeId,
    startTime,
    endTime,
    excludeAppointmentId,
  });

  if (overlappingAppointment) {
    return {
      isValid: false,
      status: 409,
      error: 'Overlapping appointment',
      message: 'Ce collaborateur a déjà un rendez-vous sur ce créneau.',
    };
  }

  return { isValid: true };
}
