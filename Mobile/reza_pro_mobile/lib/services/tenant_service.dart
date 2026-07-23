import 'api_client.dart';
import '../mock_data.dart';
import 'session_store.dart';

class TenantService {
  Future<Map<String, dynamic>> getTenant() async {
    if (useMockData) {
      final sessionUser = await sessionStore.getUser();
      final salon = mockSalons.firstWhere(
          (s) => s.id == sessionUser?.tenantId,
          orElse: () => mockSalons.first);
      return {
        'id': salon.id,
        'name': salon.name,
        'city': salon.city,
      };
    }

    final res = await apiClient.get('/tenant');
    return Map<String, dynamic>.from(res['tenant'] as Map? ?? res);
  }

  Future<Map<String, dynamic>> getSettings() async {
    if (useMockData) {
      return {
        'timezone': 'Africa/Casablanca',
        'currency': 'MAD',
        'language': 'fr',
      };
    }

    try {
      final res = await apiClient.get('/tenant/settings');
      return Map<String, dynamic>.from(res['settings'] as Map? ?? res);
    } catch (_) {
      return {};
    }
  }

  Future<Map<String, dynamic>> dashboardStats() async {
    if (useMockData) {
      return {
        'todayAppointments': 1,
        'totalRevenue': 140,
      };
    }

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
