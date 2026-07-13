import { prisma } from '../../lib/prisma';

export class AvailabilityService {
  async getAvailability(tenantId: string, date: string, serviceIdsArray: string[], employeeId?: string) {
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
      throw new Error('TENANT_NOT_FOUND');
    }

    // Calculate total duration
    let totalDuration = 60;
    if (serviceIdsArray.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: serviceIdsArray },
          tenantId: tenant.id
        }
      });
      totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
    }

    // Get business hours
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

    const selectedDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const hours = businessHours[dayName] || defaultHours[dayName as keyof typeof defaultHours];

    if (!hours || !hours.open || !hours.close) {
      return [];
    }

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
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId: tenant.id }
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

    const slotDuration = 30;
    let currentTime = new Date(openTime);
    
    while (currentTime.getTime() + totalDuration * 60000 <= closeTime.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + totalDuration * 60000);
      
      if (isToday && currentTime.getTime() <= now.getTime()) {
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
        continue;
      }
      
      const hasConflict = appointments.some((apt: any) => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return (
          (currentTime.getTime() < aptEnd.getTime() && slotEnd.getTime() > aptStart.getTime())
        );
      });

      if (!hasConflict) {
        const hoursStr = currentTime.getHours().toString().padStart(2, '0');
        const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');
        slots.push(`${hoursStr}:${minutesStr}`);
      }

      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    return slots;
  }
}

export const availabilityService = new AvailabilityService();
