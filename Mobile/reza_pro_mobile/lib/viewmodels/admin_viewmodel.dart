import 'package:flutter/foundation.dart';
import '../services/api_client.dart';
import '../services/employee_service.dart';
import '../services/service_catalog_service.dart';
import '../services/tenant_service.dart';

class AdminViewModel extends ChangeNotifier {
  List<Map<String, dynamic>> services = [];
  List<Map<String, dynamic>> staff = [];
  Map<String, dynamic> tenant = {};
  Map<String, dynamic> stats = {};
  bool loading = true;
  String? error;

  Future<void> loadAll() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        serviceCatalogService.list(),
        employeeService.list(),
        tenantService.getTenant(),
        tenantService.dashboardStats(),
      ]);
      services = List<Map<String, dynamic>>.from(results[0] as List);
      staff = List<Map<String, dynamic>>.from(results[1] as List);
      tenant = Map<String, dynamic>.from(results[2] as Map);
      stats = Map<String, dynamic>.from(results[3] as Map);
      loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      error = e.message;
      loading = false;
      notifyListeners();
    } catch (_) {
      error = 'Impossible de charger l\'admin';
      loading = false;
      notifyListeners();
    }
  }

  Future<void> createService({
    required String name,
    required double price,
    required int duration,
  }) async {
    await serviceCatalogService.create({
      'name': name,
      'duration': duration,
      'price': price,
      'priceType': 'FIXED',
    });
    await loadAll();
  }

  Future<void> createEmployee({
    required String firstName,
    required String lastName,
    String? email,
  }) async {
    await employeeService.create({
      'firstName': firstName,
      'lastName': lastName,
      if (email != null && email.isNotEmpty) 'email': email,
      'isActive': true,
    });
    await loadAll();
  }
}
