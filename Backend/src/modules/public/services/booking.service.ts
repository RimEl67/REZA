import { prisma } from '../../../lib/prisma';
import { formatDateForNotification } from '../../../utils/dateTime';
import { validateAppointmentRules } from '../../../utils/schedulingValidation';
import { fail } from '../utils/http';
import { createPublicBookingSchema } from '../schemas/public.schema';
import type { Service } from '../../../../prisma/generated/prisma/client';

type ResolvedParticipant = {
  displayName: string;
  appointmentClientId: string;
  linkedClientId: string | null;
  isBooker: boolean;
  serviceIds: string[];
  services: Service[];
  duration: number;
  subtotal: number;
};

function getServicePrice(service: Service): number {
  if (service.onQuote) return 0;
  if (service.price != null) return service.price;
  if (service.priceFrom != null) return service.priceFrom;
  return 0;
}

function buildServicesList(services: Service[]): string {
  return services
    .map((s) => `${s.name} (${s.duration} min - ${getServicePrice(s)} MAD)`)
    .join(', ');
}

export class BookingService {
  async createBooking(body: unknown) {
    try {
      const parsed = createPublicBookingSchema.safeParse(body);
      if (!parsed.success) {
        fail(400, {
          error: 'Validation error',
          message: parsed.error.errors[0]?.message || 'Invalid booking payload',
        });
      }

      const {
        tenantId,
        firstName,
        lastName,
        email,
        phone,
        serviceIds,
        startTime,
        notes,
        includeBooker = true,
        participants: extraParticipants = [],
      } = parsed.data;

      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [{ subdomain: tenantId }, { domain: tenantId }, { id: tenantId }],
          isActive: true,
          subscriptionActive: true,
        },
      });

      if (!tenant) {
        fail(404, {
          error: 'Tenant not found',
          message: 'The requested salon or establishment was not found.',
        });
      }

      const settings = await prisma.tenantSettings.findUnique({
        where: { tenantId: tenant.id },
      });

      if (settings && settings.onlineReservationEnabled === false) {
        fail(403, {
          error: 'Online reservations disabled',
          message: 'This establishment does not accept online reservations.',
        });
      }

      const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;

      let bookerClient = await prisma.client.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            { phone },
          ],
        },
      });

      if (!bookerClient) {
        bookerClient = await prisma.client.create({
          data: {
            tenantId: tenant.id,
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            status: 'ACTIVE',
          },
        });
      } else {
        bookerClient = await prisma.client.update({
          where: { id: bookerClient.id },
          data: {
            firstName,
            lastName,
            email: normalizedEmail ?? bookerClient.email,
            phone: phone || bookerClient.phone,
          },
        });
      }

      const loadServices = async (ids: string[]) => {
        const services = await prisma.service.findMany({
          where: {
            id: { in: ids },
            tenantId: tenant.id,
            visibility: { in: ['BOOKABLE', 'VISIBLE'] },
          },
        });
        if (services.length !== ids.length) {
          fail(400, {
            error: 'Invalid services',
            message: 'One or more services are not available for booking.',
          });
        }
        return services;
      };

      const bookerServices = await loadServices(serviceIds);
      const resolved: ResolvedParticipant[] = [];

      if (includeBooker !== false) {
        resolved.push({
          displayName: `${firstName} ${lastName}`.trim(),
          appointmentClientId: bookerClient.id,
          linkedClientId: bookerClient.id,
          isBooker: true,
          serviceIds,
          services: bookerServices,
          duration: bookerServices.reduce((sum, s) => sum + s.duration, 0),
          subtotal: bookerServices.reduce((sum, s) => sum + getServicePrice(s), 0),
        });
      }

      for (const participant of extraParticipants) {
        const participantServiceIds =
          participant.sameServicesAsBooker || !participant.serviceIds?.length
            ? serviceIds
            : participant.serviceIds;

        const services = await loadServices(participantServiceIds);
        let appointmentClientId = bookerClient.id;
        let linkedClientId: string | null = null;

        if (participant.clientId) {
          const linkedClient = await prisma.client.findFirst({
            where: { id: participant.clientId, tenantId: tenant.id },
          });
          if (linkedClient) {
            appointmentClientId = linkedClient.id;
            linkedClientId = linkedClient.id;
          }
        }

        resolved.push({
          displayName: participant.name.trim(),
          appointmentClientId,
          linkedClientId,
          isBooker: false,
          serviceIds: participantServiceIds,
          services,
          duration: services.reduce((sum, s) => sum + s.duration, 0),
          subtotal: services.reduce((sum, s) => sum + getServicePrice(s), 0),
        });
      }

      if (resolved.length === 0) {
        fail(400, {
          error: 'No participants',
          message:
            'Sélectionnez au moins une personne (vous ou un proche / invité) pour la réservation.',
        });
      }

      const start = new Date(startTime);
      const maxDuration = Math.max(...resolved.map((p) => p.duration));
      const validationEnd = new Date(start.getTime() + maxDuration * 60000);
      const validationServiceIds = [
        ...new Set(resolved.flatMap((p) => p.serviceIds)),
      ];

      const validationResult = await validateAppointmentRules({
        tenantId: tenant.id,
        employeeId: null,
        serviceIds: validationServiceIds,
        startTime: start,
        endTime: validationEnd,
        isPublicBooking: true,
      });

      if (!validationResult.isValid) {
        fail(validationResult.status || 400, {
          error: validationResult.error,
          message: validationResult.message,
        });
      }

      const systemUser = await prisma.user.findFirst({
        where: {
          tenantId: tenant.id,
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });

      if (!systemUser) {
        fail(500, {
          error: 'System error',
          message: 'No admin user found for this tenant.',
        });
      }

      const grandTotal = resolved.reduce((sum, p) => sum + p.subtotal, 0);
      const pricingSummary = resolved.map((p) => ({
        displayName: p.displayName,
        isBooker: p.isBooker,
        serviceIds: p.serviceIds,
        duration: p.duration,
        subtotal: Math.round(p.subtotal * 100) / 100,
      }));

      const bookingGroup = await prisma.bookingGroup.create({
        data: {
          tenantId: tenant.id,
          bookerClientId: bookerClient.id,
          bookerFirstName: firstName,
          bookerLastName: lastName,
          bookerPhone: phone,
          bookerEmail: normalizedEmail,
          startTime: start,
          status: 'PENDING',
          grandTotal: Math.round(grandTotal * 100) / 100,
          pricingSummary,
        },
      });

      const appointments = [];

      for (const participant of resolved) {
        const end = new Date(start.getTime() + participant.duration * 60000);
        const servicesList = buildServicesList(participant.services);
        let appointmentNotes = notes
          ? `${notes}\n\nServices réservés: ${servicesList}`
          : `Services réservés: ${servicesList}`;

        if (!participant.isBooker) {
          appointmentNotes = `Participant: ${participant.displayName}\n${appointmentNotes}`;
        }

        const appointment = await prisma.appointment.create({
          data: {
            tenantId: tenant.id,
            clientId: participant.appointmentClientId,
            serviceId: participant.services[0].id,
            employeeId: null,
            createdById: systemUser.id,
            startTime: start,
            endTime: end,
            duration: participant.duration,
            status: 'PENDING',
            notes: appointmentNotes,
            bookingGroupId: bookingGroup.id,
          },
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            service: {
              select: { id: true, name: true, duration: true, price: true },
            },
          },
        });

        await prisma.bookingParticipant.create({
          data: {
            bookingGroupId: bookingGroup.id,
            displayName: participant.displayName,
            clientId: participant.linkedClientId,
            isBooker: participant.isBooker,
            serviceIds: participant.serviceIds,
            durationMinutes: participant.duration,
            subtotal: Math.round(participant.subtotal * 100) / 100,
            appointmentId: appointment.id,
          },
        });

        appointments.push(appointment);
      }

      try {
        const tenantSettings = await prisma.tenantSettings.findUnique({
          where: { tenantId: tenant.id },
          select: { timezone: true },
        });
        const timezone = tenantSettings?.timezone || 'Africa/Casablanca';
        const appointmentDate = formatDateForNotification(start.toISOString(), timezone);
        const participantCount = resolved.length;

        const tenantUsers = await prisma.user.findMany({
          where: {
            tenantId: tenant.id,
            isActive: true,
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'RECEPTIONIST'] },
          },
          select: { id: true },
        });

        const message =
          participantCount > 1
            ? `${firstName} ${lastName} a réservé pour ${participantCount} personnes le ${appointmentDate}.`
            : `${firstName} ${lastName} a réservé "${appointments[0].service.name}" le ${appointmentDate}.`;

        if (tenantUsers.length > 0) {
          await Promise.all(
            tenantUsers.map((user) =>
              prisma.notification.create({
                data: {
                  tenantId: tenant.id,
                  userId: user.id,
                  type: 'APPOINTMENT_NEW',
                  title: 'Nouveau rendez-vous en ligne',
                  message,
                  link: `/dashboard/rendez-vous`,
                  metadata: {
                    bookingGroupId: bookingGroup.id,
                    appointmentIds: appointments.map((a) => a.id),
                    clientId: bookerClient.id,
                    tenantId: tenant.id,
                  },
                },
              })
            )
          );
        }
      } catch (notificationError) {
        console.error('Error creating notification for new booking:', notificationError);
      }

      fail(201, {
        bookingGroup,
        appointments,
        client: bookerClient,
        pricing: {
          participants: pricingSummary,
          grandTotal: Math.round(grandTotal * 100) / 100,
        },
        message:
          'Réservation créée avec succès. Elle apparaîtra dans le calendrier du salon et sera confirmée par l\'établissement.',
      });
    } catch (error: unknown) {
      console.error('[Public Booking] Error:', error);
      throw error;
    }
  }

  async getAvailableSlots(tenantId: string, query: Record<string, unknown>) {
    try {
    const { date, serviceIds, employeeId } = query;

    if (!date) {
      fail(400, {
        error: 'Date required',
        message: 'Date parameter is required (YYYY-MM-DD)'
      });
    }

    const serviceIdsArray = Array.isArray(serviceIds) 
      ? serviceIds as string[]
      : serviceIds 
        ? [serviceIds as string]
        : [];

    // Verify tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: tenantId },
          { domain: tenantId },
          { id: tenantId }
        ],
        isActive: true
      },
      include: {
        settings: true
      }
    });

    if (!tenant) {
      fail(404, {
        error: 'Tenant not found'
      });
    }

    // Get services and calculate total duration
    let totalDuration = 60; // Default 1 hour
    if (serviceIdsArray.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIdsArray },
          tenantId: tenant.id
        }
      });
      totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    }

    // Get business hours from settings
    const businessHours = tenant.settings?.businessHours as any || {};
    const defaultHours = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '18:00' },
      sunday: null
    };

    const selectedDate = new Date(date as string);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const hours = businessHours[dayName] || defaultHours[dayName as keyof typeof defaultHours];

    if (!hours || !hours.open || !hours.close) {
      return { slots: [] }; // Closed on this day
    }

    // Get existing appointments for this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      tenantId: tenant.id,
      startTime: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
      }
    };

    if (employeeId) {
      // Find user for employee
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId as string, tenantId: tenant.id }
      });
      if (employee?.email) {
        const user = await prisma.user.findFirst({
          where: { email: employee.email, tenantId: tenant.id }
        });
        if (user) {
          where.employeeId = user.id;
        }
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        startTime: true,
        endTime: true,
        duration: true
      }
    });

    // Generate available slots
    const slots: string[] = [];
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    const openTime = new Date(selectedDate);
    openTime.setHours(openHour, openMin, 0, 0);
    
    const closeTime = new Date(selectedDate);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    // Check if selected date is today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const isToday = today.getTime() === selectedDay.getTime();

    // Generate 30-minute slots
    const slotDuration = 30; // minutes
    let currentTime = new Date(openTime);
    
    while (currentTime.getTime() + totalDuration * 60000 <= closeTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + totalDuration * 60000);
      
      // If the selected date is today, filter out past time slots
      if (isToday && currentTime.getTime() <= now.getTime()) {
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
        continue;
      }
      
      // Check if this slot conflicts with existing appointments
      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (currentTime.getTime() < aptEnd.getTime() && slotEnd.getTime() > aptStart.getTime())
        );
      });

      if (!hasConflict) {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        slots.push(`${hours}:${minutes}`);
      }

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    return { slots };
  } catch (error) {
    throw error;
  }
  }

  async cancelAppointment(id: string, body: any) {
    try {
    const { email } = body;

    if (!email) {
      fail(400, {
        error: 'Email is required',
        message: 'Please provide your email to cancel the appointment.'
      });
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!appointment) {
      fail(404, {
        error: 'Appointment not found',
        message: 'The appointment was not found.'
      });
    }

    // Verify the appointment belongs to a client with this email
    if (appointment.client.email?.toLowerCase() !== email.toLowerCase()) {
      fail(403, {
        error: 'Unauthorized',
        message: 'You can only cancel your own appointments.'
      });
    }

    // Check if appointment can be cancelled (not already completed or cancelled)
    if (appointment.status === 'COMPLETED') {
      fail(400, {
        error: 'Cannot cancel completed appointment',
        message: 'This appointment has already been completed and cannot be cancelled.'
      });
    }

    if (appointment.status === 'CANCELLED') {
      fail(400, {
        error: 'Appointment already cancelled',
        message: 'This appointment has already been cancelled.'
      });
    }

    // Cancel the appointment
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: appointment.clientId, // Store clientId to indicate client cancelled
        cancellationReason: 'Cancelled by client'
      }
    });

    return {
      appointment: cancelledAppointment,
      message: 'Appointment cancelled successfully'
    };
  } catch (error) {
    throw error;
  }
  }

}

export const bookingService = new BookingService();
