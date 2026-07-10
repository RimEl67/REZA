class Appointment {
  final int id;
  final String clientName;
  final String service;
  final String time;
  final int duration; // in minutes
  final String status; // 'confirmed' | 'pending' | 'cancelled'
  final String employee;
  final String? phone;
  final String? email;
  final DateTime date;
  final String? notes;

  Appointment({
    required this.id,
    required this.clientName,
    required this.service,
    required this.time,
    required this.duration,
    required this.status,
    required this.employee,
    this.phone,
    this.email,
    required this.date,
    this.notes,
  });

  Appointment copyWith({
    int? id,
    String? clientName,
    String? service,
    String? time,
    int? duration,
    String? status,
    String? employee,
    String? phone,
    String? email,
    DateTime? date,
    String? notes,
  }) {
    return Appointment(
      id: id ?? this.id,
      clientName: clientName ?? this.clientName,
      service: service ?? this.service,
      time: time ?? this.time,
      duration: duration ?? this.duration,
      status: status ?? this.status,
      employee: employee ?? this.employee,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      date: date ?? this.date,
      notes: notes ?? this.notes,
    );
  }
}

List<Appointment> generateMockAppointments() {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  return [
    Appointment(
      id: 1,
      clientName: 'Yasmine Benali',
      service: 'Coupe + Brushing',
      time: '09:00',
      duration: 60,
      status: 'confirmed',
      employee: 'Samira Bouzid',
      phone: '+212 6 61 23 45 67',
      email: 'yasmine.benali@gmail.com',
      date: today,
    ),
    Appointment(
      id: 2,
      clientName: 'Khalid Amrani',
      service: 'Barbe + Coupe',
      time: '10:30',
      duration: 45,
      status: 'confirmed',
      employee: 'Yassine El Fassi',
      phone: '+212 6 62 34 56 78',
      date: today,
    ),
    Appointment(
      id: 3,
      clientName: 'Nadia Alaoui',
      service: 'Coloration',
      time: '11:00',
      duration: 90,
      status: 'pending',
      employee: 'Samira Bouzid',
      phone: '+212 6 63 45 67 89',
      date: today,
    ),
    Appointment(
      id: 4,
      clientName: 'Omar Tazi',
      service: 'Soin du visage',
      time: '14:00',
      duration: 60,
      status: 'confirmed',
      employee: 'Khalid Ait Lahcen',
      phone: '+212 6 64 56 78 90',
      date: today,
    ),
    Appointment(
      id: 5,
      clientName: 'Fatima Zahra',
      service: 'Manucure',
      time: '15:30',
      duration: 45,
      status: 'cancelled',
      employee: 'Nadia El Khatib',
      phone: '+212 6 65 67 89 01',
      date: today,
    ),
    Appointment(
      id: 6,
      clientName: 'Hicham Berrada',
      service: 'Massage relaxant',
      time: '16:30',
      duration: 60,
      status: 'pending',
      employee: 'Khalid Ait Lahcen',
      phone: '+212 6 66 78 90 12',
      date: today,
    ),
    Appointment(
      id: 7,
      clientName: 'Sofia Chraibi',
      service: 'Épilation',
      time: '17:30',
      duration: 30,
      status: 'confirmed',
      employee: 'Nadia El Khatib',
      phone: '+212 6 67 89 01 23',
      date: today.add(const Duration(days: 1)),
    ),
    Appointment(
      id: 8,
      clientName: 'Mehdi Kettani',
      service: 'Coupe homme',
      time: '09:30',
      duration: 30,
      status: 'confirmed',
      employee: 'Yassine El Fassi',
      phone: '+212 6 68 90 12 34',
      date: today.add(const Duration(days: 1)),
    ),
  ];
}
