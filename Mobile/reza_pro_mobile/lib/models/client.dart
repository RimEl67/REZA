class Client {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String? address;
  final DateTime? lastVisit;
  final int totalVisits;
  final double totalSpent;
  final String? notes;
  final String? avatar; // initials fallback

  Client({
    required this.id,
    required this.name,
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
}

List<Client> generateMockClients() {
  final now = DateTime.now();
  return [
    Client(
      id: 1,
      name: 'Yasmine Benali',
      email: 'yasmine.benali@gmail.com',
      phone: '+212 6 61 23 45 67',
      address: '15 Rue Al Majd, Casablanca',
      lastVisit: now.subtract(const Duration(days: 3)),
      totalVisits: 12,
      totalSpent: 1450.0,
    ),
    Client(
      id: 2,
      name: 'Khalid Amrani',
      email: 'k.amrani@hotmail.com',
      phone: '+212 6 62 34 56 78',
      address: '8 Avenue Hassan II, Rabat',
      lastVisit: now.subtract(const Duration(days: 7)),
      totalVisits: 8,
      totalSpent: 680.0,
    ),
    Client(
      id: 3,
      name: 'Nadia Alaoui',
      email: 'nadia.alaoui@gmail.com',
      phone: '+212 6 63 45 67 89',
      address: '22 Boulevard Mohammed V, Casablanca',
      lastVisit: now.subtract(const Duration(days: 1)),
      totalVisits: 25,
      totalSpent: 3200.0,
    ),
    Client(
      id: 4,
      name: 'Omar Tazi',
      email: 'omar.tazi@yahoo.fr',
      phone: '+212 6 64 56 78 90',
      lastVisit: now.subtract(const Duration(days: 14)),
      totalVisits: 5,
      totalSpent: 420.0,
    ),
    Client(
      id: 5,
      name: 'Fatima Zahra Idrissi',
      email: 'fz.idrissi@gmail.com',
      phone: '+212 6 65 67 89 01',
      address: '5 Rue Ibn Toumert, Fès',
      lastVisit: now.subtract(const Duration(days: 21)),
      totalVisits: 18,
      totalSpent: 2100.0,
      notes: 'Cliente VIP - Préfère Samira comme coiffeuse',
    ),
    Client(
      id: 6,
      name: 'Hicham Berrada',
      email: 'h.berrada@gmail.com',
      phone: '+212 6 66 78 90 12',
      lastVisit: now.subtract(const Duration(days: 5)),
      totalVisits: 3,
      totalSpent: 250.0,
    ),
    Client(
      id: 7,
      name: 'Sofia Chraibi',
      email: 'sofia.chraibi@gmail.com',
      phone: '+212 6 67 89 01 23',
      address: '30 Rue de Paris, Casablanca',
      lastVisit: now,
      totalVisits: 32,
      totalSpent: 4800.0,
      notes: 'Allergie au henné chimique',
    ),
    Client(
      id: 8,
      name: 'Mehdi Kettani',
      email: 'm.kettani@gmail.com',
      phone: '+212 6 68 90 12 34',
      lastVisit: now.subtract(const Duration(days: 10)),
      totalVisits: 6,
      totalSpent: 380.0,
    ),
    Client(
      id: 9,
      name: 'Zineb Ouali',
      email: 'zineb.ouali@gmail.com',
      phone: '+212 6 69 01 23 45',
      address: '12 Rue des Roses, Marrakech',
      lastVisit: now.subtract(const Duration(days: 30)),
      totalVisits: 9,
      totalSpent: 950.0,
    ),
    Client(
      id: 10,
      name: 'Amine El Fassi',
      email: 'amine.elfassi@gmail.com',
      phone: '+212 6 70 12 34 56',
      lastVisit: now.subtract(const Duration(days: 45)),
      totalVisits: 2,
      totalSpent: 150.0,
    ),
  ];
}
