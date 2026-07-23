# Scheduling Engine Architecture

## Overview

The scheduling engine handles employee assignment for appointments across one or
more services. A single appointment may have multiple services, each performed by
a different employee.

## Key Principle

**Employee assignment moved to AppointmentServiceItem.employeeId.**

The top-level `Appointment.employeeId` is now a legacy field. New appointments
created via the `services[]` array store each employee on the individual service
item. The top-level field is set to `null`.

## Flow

### 1. Planning (`POST /appointments/plan`)

**Input:** `{ serviceIds: string[], date: string, startTime: string }`

**What it does:**
1. Loads the services (name, duration).
2. Loads all active employees with their skills
   (`EmployeeService[]`), working hours, and break schedules.
3. Loads all active appointments for the date (both top-level `employeeId`
   and per-service `AppointmentServiceItem.employeeId` are checked for
   occupancy).
4. For each service in sequence (cursor-based), evaluates every eligible
   employee:
   - **Skill match:** Employee has no services linked (all-services) OR
     the specific service is in their `employeeServices`.
   - **Working hours:** Service slot falls within the employee's working
     window for that day.
   - **Breaks:** Service slot does not overlap a configured break.
   - **Availability:** No existing appointment (top-level or per-service)
     overlaps the slot.
5. **Workload balancing:** Among available employees, selects the one with
   the lowest workload ratio (occupied minutes / total working minutes
   excluding breaks).
6. Returns per-service recommendations and an `estimatedEndTime`.

**Output:**
```ts
{
  estimatedEndTime: string,          // "14:30"
  recommendedAssignment: [           // flat list, one per service
    { serviceId, serviceName, duration, employeeId, employeeName }
  ],
  services: [                        // detailed per-service availability
    {
      serviceId, serviceName, duration,
      employees: [                   // all eligible employees
        { employeeId, employeeName, available, recommended, reason? }
      ]
    }
  ]
}
```

### 2. Assignment Validation (`schedulingService.validateAssignment`)

**Called from:** `appointmentService.createAppointment()` before the Prisma
write.

**Purpose:** Re-validates that every per-service employee assignment is still
valid at the moment of save (race-window protection).

**Checks per assignment:**
- Employee exists and is active.
- Employee has the required skill.
- Employee is working on that day.
- Time slot falls within working hours (not on break).
- No overlapping appointment exists for that employee.

**Output:** `{ valid: boolean, errors: [{ serviceId, message }] }`

### 3. Create (`POST /appointments`)

**Input (new flow):**
```ts
{
  clientId: string,
  services: [{ serviceId: string, employeeId?: string }],
  startTime: string (ISO),
  notes?: string,
  status?: string,
  tenantId?: string
}
```

**Flow inside `appointmentService.createAppointment()`:**

```
resolve services → validate top-level employee (legacy) → resolve per-service employees
→ validateAppointmentRules (tenant-wide overlap) → validateAssignment (per-service overlap)
→ prisma.appointment.create
```

Both validation calls happen in the same execution path as the Prisma write.
This eliminates the race window.

## Algorithm Details

### Sequential Cursor

Services within an appointment are always scheduled sequentially. The cursor
advances by each service's duration regardless of which employee is assigned.
This models a real salon where one client receives services one after another.

If two consecutive services have different employees, a future enhancement
could schedule them in parallel.

### Workload Balancing

Workload = (occupied minutes today) / (total working minutes today minus break minutes)

The algorithm selects the employee with the lowest workload for each service.
This tends to distribute assignments evenly across the team.

**Limitation:** Workload only considers the current date. A rolling window
would provide fairer long-term distribution.

### Overlap Detection

Existing appointments block the following employee IDs:
- `Appointment.employeeId` (legacy top-level)
- Every `AppointmentServiceItem.employeeId` on the appointment

This ensures that when an existing appointment has per-service employees,
those employees appear as occupied during planning and validation.

## Manual Override

The frontend allows the user to override the recommended employee for any
service. The override is sent via the `services[].employeeId` field.

At save time, `validateAssignment` checks every override. If an overridden
employee became unavailable (e.g., another booking came in), the backend
rejects with a 409 + human-readable message. The frontend displays this
error in the modal and does NOT retry silently.

## Future Improvements

- Parallel service execution when different employees are assigned.
- Next-available-slot suggestions when no employee is free at the requested
  time.
- Employee preference scoring (seniority, rating, cost).
- Configurable buffer time between services.
- Public booking integration: employee visibility flag + per-service public
  availability.
