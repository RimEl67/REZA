class Client {
  final String id;
  final String name;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String? address;
  final DateTime? lastVisit;
  final int totalVisits;
  final double totalSpent;
  final String? notes;
  final String? avatar;

  Client({
    required this.id,
    required this.name,
    this.firstName = '',
    this.lastName = '',
    required this.email,
    required this.phone,
    this.address,
    this.lastVisit,
    this.totalVisits = 0,
    this.totalSpent = 0,
    this.notes,
    this.avatar,
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  Client copyWith({
    String? id,
    String? name,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? address,
    DateTime? lastVisit,
    int? totalVisits,
    double? totalSpent,
    String? notes,
    String? avatar,
  }) {
    return Client(
      id: id ?? this.id,
      name: name ?? this.name,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      lastVisit: lastVisit ?? this.lastVisit,
      totalVisits: totalVisits ?? this.totalVisits,
      totalSpent: totalSpent ?? this.totalSpent,
      notes: notes ?? this.notes,
      avatar: avatar ?? this.avatar,
    );
  }

  factory Client.fromJson(Map<String, dynamic> json) {
    final first = json['firstName']?.toString() ?? '';
    final last = json['lastName']?.toString() ?? '';
    final name = '$first $last'.trim();
    final count = json['_count'];
    final countAppointments = count is Map
        ? (count['appointments'] as num?)?.toInt()
        : null;
    return Client(
      id: json['id']?.toString() ?? '',
      name: name.isEmpty ? (json['name']?.toString() ?? 'Client') : name,
      firstName: first,
      lastName: last,
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      address: json['address']?.toString(),
      notes: json['notes']?.toString(),
      avatar: json['avatar']?.toString(),
      // API has _count.appointments — not totalVisits / totalSpent / lastVisit
      totalVisits:
          (json['totalVisits'] as num?)?.toInt() ?? countAppointments ?? 0,
      totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0,
      lastVisit: json['lastVisit'] != null
          ? DateTime.tryParse(json['lastVisit'].toString())
          : null,
    );
  }
}
