import 'api_client.dart';

class TenantService {
  Future<Map<String, dynamic>> getTenant() async {
    final res = await apiClient.get('/tenant');
    return Map<String, dynamic>.from(res['tenant'] as Map? ?? res);
  }

  Future<Map<String, dynamic>> getSettings() async {
    try {
      final res = await apiClient.get('/tenant/settings');
      return Map<String, dynamic>.from(res['settings'] as Map? ?? res);
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, dynamic>> dashboardStats() async {
    try {
      return await apiClient.get('/stats/dashboard');
    } catch (_) {
      try {
        return await apiClient.get('/dashboard');
      } catch (_) {
        return {};
      }
    }
  }
}

final tenantService = TenantService();
