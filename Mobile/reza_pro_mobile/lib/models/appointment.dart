class Appointment {
  final String id;
  final String clientId;
  final String clientName;
  final String serviceId;
  final String service;
  final double? servicePrice;
  final String? employeeId;
  final String employee;
  final String time;
  final int duration;
  /// UI status: confirmed | pending | cancelled | completed | in_progress | no_show
  final String status;
  final String? phone;
  final String? email;
  final DateTime date;
  final String? notes;
  final DateTime? startTime;
  final String? tenantId;

  Appointment({
    required this.id,
    this.clientId = '',
    required this.clientName,
    this.serviceId = '',
    required this.service,
    this.servicePrice,
    this.employeeId,
    required this.employee,
    required this.time,
    required this.duration,
    required this.status,
    this.phone,
    this.email,
    required this.date,
    this.notes,
    this.startTime,
    this.tenantId,
  });

  Appointment copyWith({
    String? id,
    String? clientId,
    String? clientName,
    String? serviceId,
    String? service,
    double? servicePrice,
    String? employeeId,
    String? employee,
    String? time,
    int? duration,
    String? status,
    String? phone,
    String? email,
    DateTime? date,
    String? notes,
    DateTime? startTime,
    String? tenantId,
  }) {
    return Appointment(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      serviceId: serviceId ?? this.serviceId,
      service: service ?? this.service,
      servicePrice: servicePrice ?? this.servicePrice,
      employeeId: employeeId ?? this.employeeId,
      employee: employee ?? this.employee,
      time: time ?? this.time,
      duration: duration ?? this.duration,
      status: status ?? this.status,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      date: date ?? this.date,
      notes: notes ?? this.notes,
      startTime: startTime ?? this.startTime,
      tenantId: tenantId ?? this.tenantId,
    );
  }

  static bool canConfirm(String status) => status == 'pending';

  static bool canMarkAbsentOrDone(String status) =>
      status == 'pending' || status == 'confirmed' || status == 'in_progress';

  static String labelFr(String status) {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'no_show':
        return 'Absent';
      default:
        return status;
    }
  }

  static String uiStatus(String? backend) {
    switch ((backend ?? '').toUpperCase()) {
      case 'CONFIRMED':
        return 'confirmed';
      case 'PENDING':
        return 'pending';
      case 'CANCELLED':
        return 'cancelled';
      case 'COMPLETED':
        return 'completed';
      case 'IN_PROGRESS':
        return 'in_progress';
      case 'NO_SHOW':
        return 'no_show';
      default:
        return (backend ?? 'pending').toLowerCase();
    }
  }

  static String backendStatus(String ui) {
    switch (ui.toLowerCase()) {
      case 'confirmed':
        return 'CONFIRMED';
      case 'pending':
        return 'PENDING';
      case 'cancelled':
        return 'CANCELLED';
      case 'completed':
        return 'COMPLETED';
      case 'in_progress':
        return 'IN_PROGRESS';
      case 'no_show':
        return 'NO_SHOW';
      default:
        return ui.toUpperCase();
    }
  }

  factory Appointment.fromJson(Map<String, dynamic> json) {
    final client = json['client'] as Map<String, dynamic>?;
    final service = json['service'] as Map<String, dynamic>?;
    final employee = json['employee'] as Map<String, dynamic>?;
    final start = DateTime.tryParse(json['startTime']?.toString() ?? '')?.toLocal();
    final date = start != null
        ? DateTime(start.year, start.month, start.day)
        : DateTime.now();
    final time = start != null
        ? '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')}'
        : '00:00';
    final clientName = client != null
        ? '${client['firstName'] ?? ''} ${client['lastName'] ?? ''}'.trim()
        : 'Client';
    final employeeName = employee != null
        ? '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim()
        : '—';
    final price = (service?['price'] as num?)?.toDouble() ??
        (service?['priceFrom'] as num?)?.toDouble();

    return Appointment(
      id: json['id']?.toString() ?? '',
      clientId: client?['id']?.toString() ?? json['clientId']?.toString() ?? '',
      clientName: clientName.isEmpty ? 'Client' : clientName,
      serviceId: service?['id']?.toString() ?? json['serviceId']?.toString() ?? '',
      service: service?['name']?.toString() ?? 'Service',
      servicePrice: price,
      employeeId: employee?['id']?.toString() ?? json['employeeId']?.toString(),
      employee: employeeName.isEmpty ? '—' : employeeName,
      time: time,
      duration: (json['duration'] as num?)?.toInt() ??
          (service?['duration'] as num?)?.toInt() ??
          60,
      status: uiStatus(json['status']?.toString()),
      phone: client?['phone']?.toString(),
      email: client?['email']?.toString(),
      date: date,
      notes: json['notes']?.toString(),
      startTime: start,
      tenantId: json['tenantId']?.toString(),
    );
  }
}
