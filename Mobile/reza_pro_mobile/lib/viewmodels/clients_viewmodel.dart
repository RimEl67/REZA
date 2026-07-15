import 'package:flutter/foundation.dart';
import '../models/client.dart';
import '../services/api_client.dart';
import '../services/appointment_service.dart';
import '../services/client_service.dart';
import '../services/invoice_service.dart';

class ClientsViewModel extends ChangeNotifier {
  List<Client> clients = [];
  String searchQuery = '';
  String sortBy = 'Nom';
  bool loading = true;
  String? error;

  final sortOptions = const ['Nom', 'Dernière visite', 'Total dépensé', 'Visites'];

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final raw = await clientService.list(limit: 200);
      var mapped = raw.map(Client.fromJson).toList();
      mapped = await _enrichWithStats(mapped);
      clients = mapped;
      loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      error = e.message;
      loading = false;
      notifyListeners();
    } catch (_) {
      error = 'Impossible de charger les clients';
      loading = false;
      notifyListeners();
    }
  }

  /// Match Web fichier-client + Backend top-clients aggregates:
  /// - Visites = appointment count (non-CANCELLED when we have the list)
  /// - Dernière visite = latest past appointment start
  /// - Total dépensé = sum of PAID invoices for client
  Future<List<Client>> _enrichWithStats(List<Client> list) async {
    if (list.isEmpty) return list;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final past = today.subtract(const Duration(days: 365 * 2));
    final future = today.add(const Duration(days: 365));

    Map<String, List<DateTime>> aptsByClient = {};
    Map<String, double> spentByClient = {};

    try {
      final rawApts = await appointmentService.list(
        startDate: past.toIso8601String(),
        endDate: future.toIso8601String(),
        limit: 1000,
      );
      for (final apt in rawApts) {
        final clientId =
            apt['clientId']?.toString() ??
            (apt['client'] as Map?)?['id']?.toString();
        if (clientId == null || clientId.isEmpty) continue;
        final status = (apt['status']?.toString() ?? '').toUpperCase();
        if (status == 'CANCELLED') continue;
        final start =
            DateTime.tryParse(apt['startTime']?.toString() ?? '')?.toLocal();
        if (start == null) continue;
        aptsByClient.putIfAbsent(clientId, () => []).add(start);
      }
    } catch (_) {
      // Keep _count.appointments from list response
    }

    try {
      final rawInvoices = await invoiceService.list(
        status: 'PAID',
        limit: 1000,
      );
      for (final inv in rawInvoices) {
        final clientId =
            inv['clientId']?.toString() ??
            (inv['client'] as Map?)?['id']?.toString();
        if (clientId == null || clientId.isEmpty) continue;
        final status = (inv['status']?.toString() ?? '').toUpperCase();
        if (status != 'PAID') continue;
        final total = (inv['total'] as num?)?.toDouble() ??
            (inv['amount'] as num?)?.toDouble() ??
            0;
        spentByClient[clientId] = (spentByClient[clientId] ?? 0) + total;
      }
    } catch (_) {
      // totalSpent stays 0 if invoices unavailable
    }

    return list.map((c) {
      final starts = aptsByClient[c.id];
      DateTime? lastVisit = c.lastVisit;
      var visits = c.totalVisits;

      if (starts != null && starts.isNotEmpty) {
        visits = starts.length;
        final pastStarts =
            starts.where((s) => s.isBefore(today)).toList()
              ..sort((a, b) => b.compareTo(a));
        if (pastStarts.isNotEmpty) {
          lastVisit = pastStarts.first;
        }
      }

      return c.copyWith(
        totalVisits: visits,
        lastVisit: lastVisit,
        totalSpent: spentByClient[c.id] ?? c.totalSpent,
      );
    }).toList();
  }

  void setSearch(String q) {
    searchQuery = q;
    notifyListeners();
  }

  void setSort(String s) {
    sortBy = s;
    notifyListeners();
  }

  List<Client> get filteredClients {
    var list = clients.where((c) {
      final q = searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) ||
          c.email.toLowerCase().contains(q) ||
          c.phone.contains(q);
    }).toList();

    switch (sortBy) {
      case 'Dernière visite':
        list.sort((a, b) =>
            (b.lastVisit ?? DateTime(0)).compareTo(a.lastVisit ?? DateTime(0)));
        break;
      case 'Total dépensé':
        list.sort((a, b) => b.totalSpent.compareTo(a.totalSpent));
        break;
      case 'Visites':
        list.sort((a, b) => b.totalVisits.compareTo(a.totalVisits));
        break;
      default:
        list.sort((a, b) => a.name.compareTo(b.name));
    }
    return list;
  }

  Future<Client> create({
    required String firstName,
    required String lastName,
    required String phone,
    String? email,
    String? address,
  }) async {
    final raw = await clientService.create({
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      if (email != null && email.isNotEmpty) 'email': email,
      if (address != null && address.isNotEmpty) 'address': address,
    });
    final client = Client.fromJson(raw);
    clients.insert(0, client);
    notifyListeners();
    return client;
  }
}
