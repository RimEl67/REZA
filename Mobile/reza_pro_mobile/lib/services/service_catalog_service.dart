import 'api_client.dart';
import '../mock_data.dart';
import 'session_store.dart';

class ServiceCatalogService {
  Future<List<Map<String, dynamic>>> list({String? search}) async {
    if (useMockData) {
      final sessionUser = await sessionStore.getUser();
      var data = getMockServices(sessionUser?.tenantId);

      if (search != null && search.isNotEmpty) {
        final lowerSearch = search.toLowerCase();
        data = data.where((service) {
          return (service['name'] as String?)
                  ?.toLowerCase()
                  .contains(lowerSearch) ??
              false;
        }).toList();
      }

      return data;
    }

    final res = await apiClient.get('/services', query: {
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return List<Map<String, dynamic>>.from((res['services'] as List?) ?? []);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    if (useMockData) {
      return {
        'id': generateId(),
        ...data,
      };
    }

    final res = await apiClient.post('/services', data);
    return Map<String, dynamic>.from(res['service'] as Map? ?? res);
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> data) async {
    if (useMockData) {
      return {
        'id': id,
        ...data,
      };
    }

    final res = await apiClient.put('/services/$id', data);
    return Map<String, dynamic>.from(res['service'] as Map? ?? res);
  }

  Future<void> delete(String id) async {
    if (!useMockData) {
      await apiClient.delete('/services/$id');
    }
  }
}

final serviceCatalogService = ServiceCatalogService();
