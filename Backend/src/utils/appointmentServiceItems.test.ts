import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeAppointmentWithServices } from './appointmentServiceItems';

test('serializeAppointmentWithServices exposes first service as compatibility aliases', () => {
  const appointment = serializeAppointmentWithServices({
    id: 'apt-1',
    notes: 'Real note',
    services: [
      {
        id: 'line-1',
        serviceId: 'service-1',
        serviceName: 'Hammam traditionnel',
        duration: 60,
        price: 200,
        sortOrder: 0,
      },
      {
        id: 'line-2',
        serviceId: 'service-2',
        serviceName: 'Massage relaxant',
        duration: 60,
        price: 250,
        sortOrder: 1,
      },
    ],
  } as any);

  assert.equal(appointment.serviceId, 'service-1');
  assert.equal(appointment.service?.name, 'Hammam traditionnel');
  assert.equal(appointment.totalDuration, 120);
  assert.equal(appointment.totalPrice, 450);
  assert.equal(appointment.notes, 'Real note');
});
